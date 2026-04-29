import random

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feedback import UserFoodFeedback
from app.models.food import Food
from app.schemas.enums import MealType
from app.schemas.request import RecommendRequest
from app.schemas.response import (
    FoodRecommendation,
    NutrientTargets,
    NutrientsPerServing,
    RecommendResponse,
)
from app.services.food_filter import fetch_and_filter_foods
from app.services.nutrition_calculator import (
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
    daily = calculate_daily_targets(tdee, user.weight, user.health_goal, user.diseases)
    meal_target = calculate_meal_targets(daily, user.meal_pattern, req.meal_type)

    # 이미 먹은 영양소 차감
    eaten = user.already_eaten or NutrientTarget(0, 0, 0, 0)
    gap = NutrientTarget(
        calories=max(meal_target.calories - eaten.calories, 0),
        protein=max(meal_target.protein - eaten.protein, 0),
        carbs=max(meal_target.carbs - eaten.carbs, 0),
        fat=max(meal_target.fat - eaten.fat, 0),
    )

    # 2. 후보 필터링
    candidates = await fetch_and_filter_foods(
        db, user.diseases, user.allergies, user.disliked_foods,
    )

    if not candidates:
        return _build_response(req.meal_type, daily, meal_target, [])

    # 2-1. 후보 샘플링: 카테고리 비율 상한 적용 후 랜덤 샘플링
    if len(candidates) > _CANDIDATE_SAMPLE_SIZE:
        candidates = _stratified_sample(candidates, _CANDIDATE_SAMPLE_SIZE, _CATEGORY_MAX_RATIO)

    # 3. 피드백 일괄 조회
    feedback_map = await _load_feedback_map(db, user.guest_id)

    # 4. 스코어링 (소량 노이즈 추가로 동점 음식 순서 다양화)
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
        )
        total = (
            breakdown.gap_match
            + breakdown.goal_alignment
            + breakdown.disease_compliance
            + breakdown.preference
            + breakdown.feedback
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
    meal_type: MealType, daily: NutrientTarget, meal_target: NutrientTarget,
    recommendations: list[FoodRecommendation],
) -> RecommendResponse:
    return RecommendResponse(
        meal_type=meal_type,
        daily_target=NutrientTargets(
            calories=daily.calories, protein=daily.protein,
            carbs=daily.carbs, fat=daily.fat,
        ),
        meal_target=NutrientTargets(
            calories=meal_target.calories, protein=meal_target.protein,
            carbs=meal_target.carbs, fat=meal_target.fat,
        ),
        recommendations=recommendations,
    )
