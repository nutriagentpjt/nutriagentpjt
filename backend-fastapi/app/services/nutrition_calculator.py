from dataclasses import dataclass

from app.schemas.enums import (
    ActivityLevel,
    Disease,
    Gender,
    HealthGoal,
    MealPattern,
    MealType,
)

ACTIVITY_MULTIPLIER: dict[ActivityLevel, float] = {
    ActivityLevel.SEDENTARY: 1.2,
    ActivityLevel.LIGHTLY_ACTIVE: 1.375,
    ActivityLevel.MODERATELY_ACTIVE: 1.55,
    ActivityLevel.VERY_ACTIVE: 1.725,
}

GOAL_CALORIE_MULTIPLIER: dict[HealthGoal, float] = {
    HealthGoal.DIET: 0.80,
    HealthGoal.LEAN_MASS_UP: 1.10,
    HealthGoal.BULK_UP: 1.20,
}

GOAL_PROTEIN_PER_KG: dict[HealthGoal, float] = {
    HealthGoal.DIET: 2.0,
    HealthGoal.LEAN_MASS_UP: 1.8,
    HealthGoal.BULK_UP: 1.6,
}

# 탄:지 비율 (단백질 제외 잔여 칼로리 배분)
GOAL_CARB_FAT_RATIO: dict[HealthGoal, tuple[float, float]] = {
    HealthGoal.DIET: (40, 30),        # 40:30 → carb:fat (단백질 30% 별도)
    HealthGoal.LEAN_MASS_UP: (45, 25),
    HealthGoal.BULK_UP: (50, 25),
}

# mealPattern별 끼니 배분율
MEAL_RATIOS: dict[MealPattern, dict[MealType, float]] = {
    MealPattern.THREE_MEALS: {
        MealType.BREAKFAST: 0.25,
        MealType.LUNCH: 0.35,
        MealType.DINNER: 0.30,
        MealType.SNACK: 0.10,
    },
    MealPattern.TWO_MEALS: {
        MealType.BREAKFAST: 0.0,
        MealType.LUNCH: 0.50,
        MealType.DINNER: 0.40,
        MealType.SNACK: 0.10,
    },
    MealPattern.INTERMITTENT_FASTING: {
        MealType.BREAKFAST: 0.0,
        MealType.LUNCH: 0.45,
        MealType.DINNER: 0.45,
        MealType.SNACK: 0.10,
    },
    MealPattern.MULTIPLE_SMALL_MEALS: {
        MealType.BREAKFAST: 0.20,
        MealType.LUNCH: 0.25,
        MealType.DINNER: 0.25,
        MealType.SNACK: 0.30,
    },
}


@dataclass
class NutrientTarget:
    calories: float
    protein: float
    carbs: float
    fat: float


def calculate_bmr(gender: Gender, weight: float, height: float, age: int) -> float:
    """Mifflin-St Jeor 공식"""
    base = (10 * weight) + (6.25 * height) - (5 * age)
    if gender == Gender.MALE:
        return base + 5
    return base - 161


def calculate_tdee(bmr: float, activity_level: ActivityLevel) -> float:
    return bmr * ACTIVITY_MULTIPLIER[activity_level]


def calculate_daily_targets(
    tdee: float,
    weight: float,
    health_goal: HealthGoal,
    diseases: list[Disease],
) -> NutrientTarget:
    target_calories = tdee * GOAL_CALORIE_MULTIPLIER[health_goal]

    # 단백질: g/kg 기반 우선 계산 (신장질환 시 0.8g/kg 오버라이드)
    protein_per_kg = GOAL_PROTEIN_PER_KG[health_goal]
    if Disease.KIDNEY_DISEASE in diseases:
        protein_per_kg = 0.8

    protein_g = weight * protein_per_kg
    protein_cal = protein_g * 4

    # 잔여 칼로리를 탄:지 비율로 배분
    carb_ratio, fat_ratio = GOAL_CARB_FAT_RATIO[health_goal]
    remaining_ratio = carb_ratio + fat_ratio
    remaining_cal = target_calories - protein_cal

    carbs_g = (remaining_cal * carb_ratio / remaining_ratio) / 4
    fat_g = (remaining_cal * fat_ratio / remaining_ratio) / 9

    return NutrientTarget(
        calories=round(target_calories, 1),
        protein=round(protein_g, 1),
        carbs=round(carbs_g, 1),
        fat=round(fat_g, 1),
    )


def calculate_meal_targets(
    daily: NutrientTarget,
    meal_pattern: MealPattern,
    meal_type: MealType,
) -> NutrientTarget:
    ratio = MEAL_RATIOS[meal_pattern][meal_type]
    return NutrientTarget(
        calories=round(daily.calories * ratio, 1),
        protein=round(daily.protein * ratio, 1),
        carbs=round(daily.carbs * ratio, 1),
        fat=round(daily.fat * ratio, 1),
    )
