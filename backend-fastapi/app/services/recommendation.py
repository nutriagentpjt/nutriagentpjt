from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feedback import UserFoodFeedback
from app.models.food import Food
from app.schemas.enums import Disease
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


async def run_recommendation(req: RecommendRequest, db: AsyncSession) -> RecommendResponse:
    user = req.user
    meal = req.meal

    # 1. 목표 영양소 계산
    bmr = calculate_bmr(user.gender, user.weight, user.height, user.age)
    tdee = calculate_tdee(bmr, user.activity_level)
    daily = calculate_daily_targets(tdee, user.weight, user.health_goal, user.diseases)
    meal_target = calculate_meal_targets(daily, user.meal_pattern, meal.meal_type)

    # 이미 먹은 영양소 차감
    eaten_cal = sum(e.calories for e in meal.already_eaten)
    eaten_pro = sum(e.protein for e in meal.already_eaten)
    eaten_carb = sum(e.carbs for e in meal.already_eaten)
    eaten_fat = sum(e.fat for e in meal.already_eaten)

    gap = NutrientTarget(
        calories=max(meal_target.calories - eaten_cal, 0),
        protein=max(meal_target.protein - eaten_pro, 0),
        carbs=max(meal_target.carbs - eaten_carb, 0),
        fat=max(meal_target.fat - eaten_fat, 0),
    )

    # 2. 후보 필터링
    candidates = await fetch_and_filter_foods(
        db, user.diseases, user.allergies, user.disliked_foods,
    )

    if not candidates:
        return _build_response(meal, daily, meal_target, [])

    # 3. 피드백 일괄 조회
    feedback_map = await _load_feedback_map(db, user.guest_id)

    # 4. 스코어링
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
        )
        scored.append((food, total, breakdown))

    # 5. 정렬 → 상위 N개
    scored.sort(key=lambda x: x[1], reverse=True)
    top_n = scored[: req.top_n]

    # 6. 추천량 계산 + 사유 생성
    recommendations: list[FoodRecommendation] = []
    for food, total, breakdown in top_n:
        amount_ratio = _calculate_amount_ratio(food, gap)
        rec_amount = round(food.weight * amount_ratio, 1)

        tags = generate_reason_tags(food, gap, amount_ratio, user.health_goal)

        recommendations.append(
            FoodRecommendation(
                food_id=food.id,
                food_name=food.name,
                score=round(total, 2),
                score_breakdown=breakdown,
                recommended_amount_g=rec_amount,
                amount_ratio=round(amount_ratio, 2),
                nutrients_per_serving=NutrientsPerServing(
                    calories=round(food.calories * amount_ratio, 1),
                    protein=round(food.protein * amount_ratio, 1),
                    carbs=round(food.carbs * amount_ratio, 1),
                    fat=round(food.fat * amount_ratio, 1),
                ),
                reason_tags=tags,
            )
        )

    return _build_response(meal, daily, meal_target, recommendations)


def _calculate_amount_ratio(food: Food, gap: NutrientTarget) -> float:
    """가장 부족 비율이 높은 영양소 기준 추천량 계산 (0.5~2.0 범위)"""
    ratios: list[float] = []

    for food_val, gap_val in [
        (food.calories, gap.calories),
        (food.protein, gap.protein),
        (food.carbs, gap.carbs),
        (food.fat, gap.fat),
    ]:
        if food_val > 0 and gap_val > 0:
            ratios.append(gap_val / food_val)

    if not ratios:
        return 1.0

    # 가장 부족한 영양소 기준
    target_ratio = max(ratios)
    return max(0.5, min(target_ratio, 2.0))


async def _load_feedback_map(db: AsyncSession, guest_id: str) -> dict[int, str]:
    """사용자의 최신 피드백을 food_id별로 조회"""
    result = await db.execute(
        select(UserFoodFeedback)
        .where(UserFoodFeedback.guest_id == guest_id)
        .order_by(UserFoodFeedback.created_at.desc())
    )
    feedbacks = result.scalars().all()

    fb_map: dict[int, str] = {}
    for fb in feedbacks:
        if fb.food_id not in fb_map:  # 최신 피드백만
            fb_map[fb.food_id] = fb.feedback_type
    return fb_map


def _build_response(
    meal, daily: NutrientTarget, meal_target: NutrientTarget,
    recommendations: list[FoodRecommendation],
) -> RecommendResponse:
    return RecommendResponse(
        meal_type=meal.meal_type,
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
