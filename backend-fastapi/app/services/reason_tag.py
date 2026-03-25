from app.models.food import Food
from app.schemas.enums import HealthGoal
from app.services.nutrition_calculator import NutrientTarget


def generate_reason_tags(
    food: Food,
    gap: NutrientTarget,
    amount_ratio: float,
    health_goal: HealthGoal,
) -> list[str]:
    """영양소 기여율/음식 특성 기반 사유 태그 (최대 3개)"""
    tags: list[str] = []
    scaled_protein = (food.protein or 0) * amount_ratio
    scaled_carbs = (food.carbs or 0) * amount_ratio
    scaled_fat = (food.fat or 0) * amount_ratio

    # 영양소 기여율 태그
    if gap.protein > 0 and scaled_protein / gap.protein > 0.3:
        tags.append("단백질 보충")
    if gap.carbs > 0 and scaled_carbs / gap.carbs > 0.3:
        tags.append("탄수화물 보충")
    if gap.fat > 0 and scaled_fat / gap.fat > 0.3:
        tags.append("지방 보충")

    # 칼로리 밀도
    weight = food.weight or 1
    calories = food.calories or 0
    cal_density = calories / weight if weight > 0 else 0
    if cal_density < 1.2:
        tags.append("저칼로리")
    elif cal_density > 2.0 and health_goal == HealthGoal.BULK_UP:
        tags.append("고칼로리")

    # 식이섬유
    fiber_val = (food.fiber or 0) * amount_ratio
    if fiber_val > 5:
        tags.append("식이섬유 풍부")

    return tags[:3]
