import itertools
import random
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feedback import UserFoodFeedback
from app.models.food import Food
from app.schemas.enums import Disease, MealType
from app.schemas.request import RecommendRequest
from app.schemas.response import (
    FoodRecommendation,
    MealSetItem,
    MealSetRecommendation,
    NutrientTargets,
    NutrientsPerServing,
    RecommendResponse,
    ScoreBreakdown,
)
from app.services.food_filter import fetch_and_filter_foods
from app.services.nutrition_calculator import (
    DailyNutritionPlan,
    NutrientTarget,
    calculate_bmr,
    calculate_daily_targets,
    calculate_meal_targets,
    calculate_tdee,
)
from app.services.reason_tag import generate_reason_tags
from app.services.scorer import calculate_score
from app.services.user_profile_loader import UserContext, load_user_context

# 후보 샘플링: 전체 중 최대 이 수만큼만 스코어링
_CANDIDATE_SAMPLE_SIZE = 300
# 카테고리 1개가 전체 샘플의 최대 이 비율까지만 차지할 수 있음 (과자류 독점 방지)
_CATEGORY_MAX_RATIO = 0.15
# 점수 노이즈 범위 (비슷한 점수 음식 사이 순서 다양화)
_SCORE_NOISE_RANGE = 3.0


async def run_recommendation(req: RecommendRequest, db: AsyncSession) -> RecommendResponse:
    # 0. DB에서 유저 컨텍스트 로딩
    user = await load_user_context(db, req.guest_id, req.meal_type)

    # 1. 목표 영양소 계산
    bmr = calculate_bmr(user.gender, user.weight, user.height, user.age)
    tdee = calculate_tdee(bmr, user.activity_level)
    daily = calculate_daily_targets(
        tdee, user.weight, user.health_goal, user.diseases,
        gender=user.gender, exercise_frequency=user.exercise_frequency,
    )
    meal_target = calculate_meal_targets(
        daily, user.meal_pattern, req.meal_type,
        weight=user.weight, exercise_time=user.exercise_time, diseases=user.diseases,
    )

    # 이미 먹은 영양소 차감
    eaten = user.already_eaten or NutrientTarget(0, 0, 0, 0)
    gap = NutrientTarget(
        calories=max(meal_target.calories - eaten.calories, 0),
        protein=max(meal_target.protein - eaten.protein, 0),
        carbs=max(meal_target.carbs - eaten.carbs, 0),
        fat=max(meal_target.fat - eaten.fat, 0),
    )

    # 피드백 일괄 조회 (single/set 공통)
    feedback_map = await _load_feedback_map(db, user.guest_id)

    if req.mode == "set":
        return await _run_set_mode(req, db, user, daily, meal_target, gap, feedback_map)

    # 2. 후보 필터링 (single 모드)
    candidates = await fetch_and_filter_foods(
        db, user.diseases, user.allergies, user.disliked_foods,
        meal_target=meal_target, daily_plan=daily,
    )

    if not candidates:
        return _build_response(req.meal_type, daily, meal_target, [])

    # 2-1. 후보 샘플링: 카테고리 비율 상한 적용 후 랜덤 샘플링
    if len(candidates) > _CANDIDATE_SAMPLE_SIZE:
        candidates = _stratified_sample(candidates, _CANDIDATE_SAMPLE_SIZE, _CATEGORY_MAX_RATIO)

    # 3. 스코어링 (소량 노이즈 추가로 동점 음식 순서 다양화)
    scored: list[tuple[Food, float, object]] = []
    for food in candidates:
        breakdown = calculate_score(
            food=food,
            gap=gap,
            meal_target=meal_target,
            health_goal=user.health_goal,
            diseases=user.diseases,
            preferred_foods=user.preferred_foods,
            disliked_foods=user.disliked_foods,
            feedback_map=feedback_map,
            daily_plan=daily,
            weight=user.weight,
        )
        total = (
            breakdown.gap_match
            + breakdown.goal_alignment
            + breakdown.disease_compliance
            + breakdown.preference
            + breakdown.feedback
            + breakdown.micro_fit
            + breakdown.gi_gl
            + breakdown.leucine
            + random.uniform(-_SCORE_NOISE_RANGE, _SCORE_NOISE_RANGE)
        )
        scored.append((food, total, breakdown))

    # 5. 정렬 → 카테고리 다양성 적용 후 상위 N개
    scored.sort(key=lambda x: x[1], reverse=True)
    top_n = _apply_category_diversity(scored, req.top_n)

    # 6. 추천량 계산 + 사유 생성
    recommendations: list[FoodRecommendation] = []
    for food, total, breakdown in top_n:
        amount_ratio = _calculate_amount_ratio(food, gap)
        rec_amount = round((food.weight or 0) * amount_ratio, 1)

        tags = generate_reason_tags(food, gap, amount_ratio, user.health_goal)

        recommendations.append(
            FoodRecommendation(
                food_id=food.id,
                food_name=food.name or "",
                score=round(total, 2),
                score_breakdown=breakdown,
                recommended_amount_g=rec_amount,
                amount_ratio=round(amount_ratio, 2),
                nutrients_per_serving=NutrientsPerServing(
                    calories=round((food.calories or 0) * amount_ratio, 1),
                    protein=round((food.protein or 0) * amount_ratio, 1),
                    carbs=round((food.carbs or 0) * amount_ratio, 1),
                    fat=round((food.fat or 0) * amount_ratio, 1),
                ),
                reason_tags=tags,
            )
        )

    return _build_response(req.meal_type, daily, meal_target, recommendations)


def _stratified_sample(
    candidates: list, sample_size: int, category_max_ratio: float
) -> list:
    """카테고리별 상한선을 적용한 계층적 샘플링.
    특정 카테고리(과자류 등)가 전체 샘플을 독점하지 못하도록 제한."""
    from collections import defaultdict

    # 카테고리별로 그룹화 후 셔플
    groups: dict[str, list] = defaultdict(list)
    for food in candidates:
        cat = food.category or "기타"
        groups[cat].append(food)
    for group in groups.values():
        random.shuffle(group)

    max_per_category = max(1, int(sample_size * category_max_ratio))
    result = []

    # 1패스: 각 카테고리에서 최대 max_per_category개까지
    remainder: list = []
    for cat, foods in groups.items():
        result.extend(foods[:max_per_category])
        remainder.extend(foods[max_per_category:])

    # 부족하면 나머지에서 랜덤으로 채움
    if len(result) < sample_size and remainder:
        random.shuffle(remainder)
        result.extend(remainder[: sample_size - len(result)])

    # 최종 셔플 후 상위 sample_size 반환
    random.shuffle(result)
    return result[:sample_size]


def _apply_category_diversity(
    scored: list[tuple[Food, float, object]], top_n: int
) -> list[tuple[Food, float, object]]:
    """같은 카테고리가 연속으로 추천되지 않도록 다양성 보장.
    카테고리당 최대 2개까지만 허용하고, 나머지는 다른 카테고리에서 채움."""
    selected: list[tuple[Food, float, object]] = []
    category_count: dict[str, int] = {}
    remainder: list[tuple[Food, float, object]] = []

    for item in scored:
        food = item[0]
        cat = food.category or "기타"
        if category_count.get(cat, 0) < 2:
            selected.append(item)
            category_count[cat] = category_count.get(cat, 0) + 1
        else:
            remainder.append(item)
        if len(selected) >= top_n:
            break

    # 부족하면 나머지에서 채움
    for item in remainder:
        if len(selected) >= top_n:
            break
        selected.append(item)

    return selected


def _calculate_amount_ratio(food: Food, gap: NutrientTarget) -> float:
    """가장 부족 비율이 높은 영양소 기준 추천량 계산 (0.5~2.0 범위)"""
    ratios: list[float] = []

    for food_val, gap_val in [
        (food.calories or 0, gap.calories),
        (food.protein or 0, gap.protein),
        (food.carbs or 0, gap.carbs),
        (food.fat or 0, gap.fat),
    ]:
        if food_val > 0 and gap_val > 0:
            ratios.append(gap_val / food_val)

    if not ratios:
        return 1.0

    target_ratio = max(ratios)
    return max(0.5, min(target_ratio, 2.0))


async def _load_feedback_map(db: AsyncSession, guest_id: str) -> dict[int, str]:
    """사용자의 최신 피드백을 food_id별로 조회"""
    try:
        result = await db.execute(
            select(UserFoodFeedback)
            .where(UserFoodFeedback.guest_id == guest_id)
            .order_by(UserFoodFeedback.created_at.desc())
        )
    except Exception:
        # user_food_feedback 테이블이 아직 없는 경우
        return {}
    feedbacks = result.scalars().all()

    fb_map: dict[int, str] = {}
    for fb in feedbacks:
        if fb.food_id not in fb_map:
            fb_map[fb.food_id] = fb.feedback_type
    return fb_map


def _build_response(
    meal_type: MealType,
    daily: "NutrientTarget | DailyNutritionPlan",
    meal_target: NutrientTarget,
    recommendations: list[FoodRecommendation],
    mode: str = "single",
    meal_sets: "list[MealSetRecommendation] | None" = None,
) -> RecommendResponse:
    daily_kwargs: dict = dict(
        calories=daily.calories, protein=daily.protein,
        carbs=daily.carbs, fat=daily.fat,
    )
    if isinstance(daily, DailyNutritionPlan):
        daily_kwargs.update(
            fiber_g=daily.fiber_g,
            sodium_mg_max=daily.sodium_mg_max,
            potassium_mg=daily.potassium_mg,
            sat_fat_g_max=daily.sat_fat_g_max,
            added_sugar_g_max=daily.added_sugar_g_max,
        )
    return RecommendResponse(
        meal_type=meal_type,
        daily_target=NutrientTargets(**daily_kwargs),
        meal_target=NutrientTargets(
            calories=meal_target.calories, protein=meal_target.protein,
            carbs=meal_target.carbs, fat=meal_target.fat,
        ),
        mode=mode,
        recommendations=recommendations,
        meal_sets=meal_sets,
    )


# ---------------------------------------------------------------------------
# Set 모드 헬퍼
# ---------------------------------------------------------------------------

async def _run_set_mode(
    req: RecommendRequest,
    db: AsyncSession,
    user: "UserContext",
    daily: DailyNutritionPlan,
    meal_target: NutrientTarget,
    gap: NutrientTarget,
    feedback_map: dict[int, str],
) -> RecommendResponse:
    candidates = await fetch_and_filter_foods(
        db, user.diseases, user.allergies, user.disliked_foods,
        mode="set", meal_target=meal_target, daily_plan=daily,
    )

    if not candidates:
        return _build_response(req.meal_type, daily, meal_target, [], "set", [])

    scored_candidates: list[tuple[Food, float]] = []
    for food in candidates:
        bd = calculate_score(
            food=food, gap=gap, meal_target=meal_target,
            health_goal=user.health_goal, diseases=user.diseases,
            preferred_foods=user.preferred_foods, disliked_foods=user.disliked_foods,
            feedback_map=feedback_map, daily_plan=daily, weight=user.weight,
        )
        total = (bd.gap_match + bd.goal_alignment + bd.disease_compliance
                 + bd.preference + bd.feedback + bd.micro_fit + bd.gi_gl + bd.leucine)
        scored_candidates.append((food, total))

    role_top = _group_by_role(scored_candidates, top_n=5)
    meal_sets = _compose_plates(role_top, meal_target, daily, user.diseases, top_k=req.top_n)
    return _build_response(req.meal_type, daily, meal_target, [], "set", meal_sets)


# 역할별 1인분 칼로리 상한 — 반찬·김치류는 저칼로리 채소 위주로 선택
_ROLE_CAL_MAX: dict[str, float] = {
    "SIDE": 150.0,
    "KIMCHI": 80.0,
    "SOUP": 350.0,
}


def _group_by_role(
    scored: list[tuple[Food, float]], top_n: int = 8
) -> dict[str, list[tuple[Food, float]]]:
    buckets: dict[str, list[tuple[Food, float]]] = {}
    for food, score in scored:
        profile = getattr(food, "profile", None)
        role = (profile.dish_role if profile else None) or "UNKNOWN"
        buckets.setdefault(role, []).append((food, score))

    result = {}
    for role, items in buckets.items():
        cal_max = _ROLE_CAL_MAX.get(role)
        # 역할별 칼로리 상한 적용; 후보 부족 시 상한을 2배로 완화
        if cal_max:
            filtered = [(f, s) for f, s in items if (f.calories or 0) <= cal_max]
            if len(filtered) < max(2, top_n // 2):
                filtered = [(f, s) for f, s in items if (f.calories or 0) <= cal_max * 2]
            items = filtered if filtered else items

        sorted_items = sorted(items, key=lambda x: x[1], reverse=True)
        diverse: list[tuple[Food, float]] = []
        seen_stems: set[str] = set()
        for food, score in sorted_items:
            # 첫 번째 토큰(언더스코어/공백 이전)을 stem으로 사용해 이름 다양성 보장
            name = food.name or ""
            stem = name.replace("_", " ").split()[0] if name else ""
            if stem not in seen_stems:
                diverse.append((food, score))
                seen_stems.add(stem)
            if len(diverse) >= top_n:
                break
        # stem 필터 후 부족하면 나머지에서 보충
        seen_ids = {id(f) for f, _ in diverse}
        for food, score in sorted_items:
            if len(diverse) >= top_n:
                break
            if id(food) not in seen_ids:
                diverse.append((food, score))
        result[role] = diverse
    return result


def _plate_objective(
    combo: list[tuple[str, Food]],
    meal_target: NutrientTarget,
    daily_plan: DailyNutritionPlan,
    diseases: list[Disease],
) -> float:
    total_cal = sum(food.calories or 0 for _, food in combo)
    total_protein = sum(food.protein or 0 for _, food in combo)
    total_na = sum(food.sodium or 0 for _, food in combo)
    total_fiber = sum(food.fiber or 0 for _, food in combo)

    # 끼니 영양 충족도 (최대 40점)
    cal_fill = min(total_cal / meal_target.calories, 1.2) if meal_target.calories > 0 else 0
    prot_fill = min(total_protein / meal_target.protein, 1.2) if meal_target.protein > 0 else 0
    gap_score = (cal_fill * 0.6 + prot_fill * 0.4) * 40

    # 6대 식품군 커버리지 (최대 25점)
    food_groups = set()
    for _, food in combo:
        profile = getattr(food, "profile", None)
        if profile and profile.food_group:
            food_groups.add(profile.food_group)
    balance_score = (len(food_groups) / 6) * 25

    # 나트륨 준수 (최대 20점) — 고혈압/신장질환은 초과 시 강한 페널티
    disease_score = 20.0
    meal_na_max = daily_plan.sodium_mg_max / 3
    na_sensitive = Disease.HYPERTENSION in diseases or Disease.KIDNEY_DISEASE in diseases
    if total_na > meal_na_max * 1.5:
        disease_score -= 18 if na_sensitive else 15
    elif total_na > meal_na_max:
        disease_score -= 12 if na_sensitive else 8

    # 칼로리 이탈 페널티 (목표 ±15% 초과 시)
    if meal_target.calories > 0:
        cal_dev = abs(total_cal - meal_target.calories) / meal_target.calories
        overshoot_penalty = max(0.0, (cal_dev - 0.15) * 30)
    else:
        overshoot_penalty = 0.0

    # 단백질 오버슈트 페널티 (목표 130% 초과 시)
    if meal_target.protein > 0:
        prot_ratio = total_protein / meal_target.protein
        prot_penalty = max(0.0, (prot_ratio - 1.3) * 20)
    else:
        prot_penalty = 0.0

    # 카테고리 반복 페널티
    categories = [food.category for _, food in combo if food.category]
    repeat_penalty = max(0, len(categories) - len(set(categories))) * 3

    return gap_score + balance_score + disease_score - overshoot_penalty - prot_penalty - repeat_penalty


def _compose_plates(
    role_top: dict[str, list[tuple[Food, float]]],
    meal_target: NutrientTarget,
    daily_plan: DailyNutritionPlan,
    diseases: list[Disease],
    top_k: int = 3,
) -> list[MealSetRecommendation]:
    results: list[tuple[float, list[tuple[str, Food]]]] = []

    # ONE_DISH 단독 plate
    for food, _ in role_top.get("ONE_DISH", [])[:3]:
        combo: list[tuple[str, Food]] = [("ONE_DISH", food)]
        results.append((_plate_objective(combo, meal_target, daily_plan, diseases), combo))

    # 1식 3찬 조합: RICE × SOUP × MAIN × SIDE(2) × KIMCHI
    rice_list  = role_top.get("RICE",   [])
    soup_list  = role_top.get("SOUP",   [])
    main_list  = role_top.get("MAIN",   [])
    # SIDE는 300kcal 이하만 허용 (땅콩조림 같은 고칼로리 SIDE 제외)
    # 후보가 2개 미만이면 필터를 완화해 500kcal 이하 사용
    _all_sides = role_top.get("SIDE", [])
    side_list = [item for item in _all_sides if (item[0].calories or 0) <= 300]
    if len(side_list) < 2:
        side_list = [item for item in _all_sides if (item[0].calories or 0) <= 500]
    if len(side_list) < 2:
        side_list = _all_sides
    kimchi_list = role_top.get("KIMCHI", [])

    side_pairs = (
        list(itertools.combinations(side_list, 2))
        if len(side_list) >= 2
        else [(s,) for s in side_list]
    )

    for rice, soup, main, sides, kimchi in itertools.product(
        rice_list, soup_list, main_list, side_pairs, kimchi_list
    ):
        combo = (
            [("RICE", rice[0]), ("SOUP", soup[0]), ("MAIN", main[0])]
            + [("SIDE", s[0]) for s in sides]
            + [("KIMCHI", kimchi[0])]
        )
        results.append((_plate_objective(combo, meal_target, daily_plan, diseases), combo))

    results.sort(key=lambda x: x[0], reverse=True)
    return [_build_meal_set(score, combo, daily_plan) for score, combo in results[:top_k]]


def _build_meal_set(
    score: float,
    combo: list[tuple[str, Food]],
    daily_plan: DailyNutritionPlan,
) -> MealSetRecommendation:
    items = [
        MealSetItem(
            role=role,
            food=FoodRecommendation(
                food_id=food.id,
                food_name=food.name or "",
                score=round(score, 2),
                score_breakdown=ScoreBreakdown(
                    gap_match=0, goal_alignment=0, disease_compliance=0,
                    preference=0, feedback=0,
                ),
                recommended_amount_g=round(food.weight or 0, 1),
                amount_ratio=1.0,
                nutrients_per_serving=NutrientsPerServing(
                    calories=round(food.calories or 0, 1),
                    protein=round(food.protein or 0, 1),
                    carbs=round(food.carbs or 0, 1),
                    fat=round(food.fat or 0, 1),
                ),
                reason_tags=[],
            ),
        )
        for role, food in combo
    ]

    total_cal    = sum(food.calories or 0 for _, food in combo)
    total_protein = sum(food.protein or 0 for _, food in combo)
    total_carbs  = sum(food.carbs or 0 for _, food in combo)
    total_fat    = sum(food.fat or 0 for _, food in combo)
    total_na     = sum(food.sodium or 0 for _, food in combo)
    total_k      = sum(food.potassium or 0 for _, food in combo)
    total_fiber  = sum(food.fiber or 0 for _, food in combo)

    food_groups = {
        p.food_group
        for _, food in combo
        if (p := getattr(food, "profile", None)) and p.food_group
    }

    reason_tags = []
    if len(food_groups) >= 4:
        reason_tags.append("균형잡힌 식단")
    if total_na <= daily_plan.sodium_mg_max / 3:
        reason_tags.append("적정 나트륨")
    if total_fiber >= daily_plan.fiber_g * 0.3:
        reason_tags.append("식이섬유 충분")

    return MealSetRecommendation(
        set_id=str(uuid.uuid4())[:8],
        items=items,
        total_nutrients=NutrientsPerServing(
            calories=round(total_cal, 1),
            protein=round(total_protein, 1),
            carbs=round(total_carbs, 1),
            fat=round(total_fat, 1),
        ),
        micro_nutrients={
            "sodium_mg": round(total_na, 1),
            "potassium_mg": round(total_k, 1),
            "fiber_g": round(total_fiber, 1),
        },
        score=round(score, 2),
        score_breakdown=ScoreBreakdown(
            gap_match=0, goal_alignment=0, disease_compliance=0,
            preference=0, feedback=0,
        ),
        reason_tags=reason_tags,
    )
