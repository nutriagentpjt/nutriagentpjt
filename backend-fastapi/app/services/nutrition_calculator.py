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
    HealthGoal.MAINTAIN: 1.00,
    HealthGoal.GENERAL_HEALTH: 1.00,
}

GOAL_PROTEIN_PER_KG: dict[HealthGoal, float] = {
    HealthGoal.DIET: 2.0,
    HealthGoal.LEAN_MASS_UP: 1.8,
    HealthGoal.BULK_UP: 1.6,
    HealthGoal.MAINTAIN: 1.4,
    HealthGoal.GENERAL_HEALTH: 1.4,
}

# 탄:지 비율 (단백질 제외 잔여 칼로리 배분)
GOAL_CARB_FAT_RATIO: dict[HealthGoal, tuple[float, float]] = {
    HealthGoal.DIET: (40, 30),
    HealthGoal.LEAN_MASS_UP: (45, 25),
    HealthGoal.BULK_UP: (50, 25),
    HealthGoal.MAINTAIN: (45, 30),
    HealthGoal.GENERAL_HEALTH: (45, 30),
}

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

# KDRI 2020 한국인 영양소 섭취 기준
KDRI_AMDR_PROTEIN = (0.07, 0.20)
KDRI_SAT_FAT_MAX_RATIO = 0.08
KDRI_ADDED_SUGAR_MAX_RATIO = 0.10
KDRI_FIBER_AI: dict[Gender, float] = {Gender.MALE: 30.0, Gender.FEMALE: 20.0}
KDRI_K_AI = 3500.0       # mg/day 충분섭취량
KDRI_NA_CDRR = 2300.0    # mg/day 만성질환위험감소섭취량

# 운동 후 단백질 보강이 필요한 끼니 (exercise_time → MealType)
_POST_WORKOUT_MEAL: dict[str, MealType] = {
    "MORNING":   MealType.LUNCH,
    "AFTERNOON": MealType.LUNCH,
    "EVENING":   MealType.DINNER,
    "NIGHT":     MealType.DINNER,
}


@dataclass
class NutrientTarget:
    calories: float
    protein: float
    carbs: float
    fat: float


@dataclass
class DailyNutritionPlan:
    """일일 영양 목표 (KDRI 기반 마이크로뉴트리언트 포함)"""
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber_g: float
    sodium_mg_max: float
    potassium_mg: float
    sat_fat_g_max: float
    added_sugar_g_max: float
    plant_protein_ratio_floor: float = 0.0


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
    gender: Gender = Gender.MALE,
    exercise_frequency: int = 0,
) -> DailyNutritionPlan:
    target_calories = tdee * GOAL_CALORIE_MULTIPLIER[health_goal]

    # 기본 단백질 g/kg
    protein_per_kg = GOAL_PROTEIN_PER_KG[health_goal]

    # 질환별 단백질 오버라이드 (운동 보너스 적용 전에 확정)
    if Disease.KIDNEY_DISEASE in diseases:
        protein_per_kg = 0.8
    elif Disease.LIVER_DISEASE in diseases:
        # 간질환: 1.0~1.2 g/kg 범위로 클램프
        protein_per_kg = max(1.0, min(protein_per_kg, 1.2))
    else:
        protein_per_kg += _exercise_protein_bonus(health_goal, exercise_frequency)

    protein_g = weight * protein_per_kg

    # KDRI AMDR 단백질 상한 클램프 (신장질환 제외 — 이미 0.8 g/kg으로 제한)
    if Disease.KIDNEY_DISEASE not in diseases:
        protein_g = min(protein_g, target_calories * KDRI_AMDR_PROTEIN[1] / 4)

    protein_cal = protein_g * 4
    carb_ratio, fat_ratio = GOAL_CARB_FAT_RATIO[health_goal]
    remaining_cal = max(0.0, target_calories - protein_cal)
    carbs_g = (remaining_cal * carb_ratio / (carb_ratio + fat_ratio)) / 4
    fat_g = (remaining_cal * fat_ratio / (carb_ratio + fat_ratio)) / 9

    # 마이크로뉴트리언트 기본값
    fiber_g = KDRI_FIBER_AI[gender]
    sodium_mg_max = KDRI_NA_CDRR
    potassium_mg = KDRI_K_AI
    sat_fat_g_max = target_calories * KDRI_SAT_FAT_MAX_RATIO / 9
    added_sugar_g_max = target_calories * KDRI_ADDED_SUGAR_MAX_RATIO / 4
    plant_protein_ratio_floor = 0.0

    # 질환별 마이크로뉴트리언트 오버라이드
    if Disease.HYPERTENSION in diseases:
        sodium_mg_max = 1500.0
        potassium_mg = 4700.0
    if Disease.DIABETES in diseases:
        added_sugar_g_max = target_calories * 0.05 / 4  # 5%로 강화
    if Disease.GOUT in diseases:
        plant_protein_ratio_floor = 0.4

    return DailyNutritionPlan(
        calories=round(target_calories, 1),
        protein=round(protein_g, 1),
        carbs=round(carbs_g, 1),
        fat=round(fat_g, 1),
        fiber_g=round(fiber_g, 1),
        sodium_mg_max=round(sodium_mg_max, 1),
        potassium_mg=round(potassium_mg, 1),
        sat_fat_g_max=round(sat_fat_g_max, 1),
        added_sugar_g_max=round(added_sugar_g_max, 1),
        plant_protein_ratio_floor=plant_protein_ratio_floor,
    )


def calculate_meal_targets(
    daily: "NutrientTarget | DailyNutritionPlan",
    meal_pattern: MealPattern,
    meal_type: MealType,
    weight: float = 0.0,
    exercise_time: str | None = None,
    diseases: list[Disease] | None = None,
) -> NutrientTarget:
    ratio = MEAL_RATIOS[meal_pattern][meal_type]
    protein_g = daily.protein * ratio

    # Leucine threshold: 끼니당 최소 단백질 = weight × 0.4 g/kg (신장질환 미적용)
    if weight > 0 and (diseases is None or Disease.KIDNEY_DISEASE not in diseases):
        protein_g = max(protein_g, weight * 0.4)

    # 운동 직후 끼니 단백질 +5 g
    if exercise_time and _POST_WORKOUT_MEAL.get(exercise_time) == meal_type:
        protein_g += 5.0

    return NutrientTarget(
        calories=round(daily.calories * ratio, 1),
        protein=round(protein_g, 1),
        carbs=round(daily.carbs * ratio, 1),
        fat=round(daily.fat * ratio, 1),
    )


def _exercise_protein_bonus(health_goal: HealthGoal, freq: int) -> float:
    """운동 빈도에 따른 단백질 추가량 (g/kg). LEAN_MASS_UP/BULK_UP는 이미 높으므로 0.5배."""
    if freq < 3:
        return 0.0
    bonus = 0.4 if freq >= 5 else 0.2
    if health_goal in (HealthGoal.LEAN_MASS_UP, HealthGoal.BULK_UP):
        bonus *= 0.5
    return bonus
