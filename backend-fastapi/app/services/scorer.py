import math

from app.models.food import Food
from app.schemas.enums import Disease, HealthGoal
from app.schemas.response import ScoreBreakdown
from app.services.nutrition_calculator import DailyNutritionPlan, NutrientTarget

# 기본 가중치 (합 = 100)
DEFAULT_WEIGHTS: dict[str, int] = {
    "gap_match": 35,
    "goal_alignment": 12,
    "disease_compliance": 18,
    "preference": 8,
    "feedback": 7,
    "micro_fit": 10,
    "gi_gl": 5,
    "leucine": 5,
}


def _resolve_weights(health_goal: HealthGoal, diseases: list[Disease]) -> dict[str, int]:
    w = dict(DEFAULT_WEIGHTS)
    if Disease.DIABETES in diseases:
        w["gi_gl"] += 10       # 5→15
        w["gap_match"] -= 5    # 35→30
    if Disease.HYPERTENSION in diseases:
        w["micro_fit"] += 8    # 10→18
        w["disease_compliance"] -= 4  # 18→14
    if health_goal in (HealthGoal.LEAN_MASS_UP, HealthGoal.BULK_UP):
        w["leucine"] += 7      # 5→12
    if Disease.KIDNEY_DISEASE in diseases:
        w["disease_compliance"] += 7  # 18→25
    return w


def calculate_score(
    food: Food,
    gap: NutrientTarget,
    meal_target: NutrientTarget,
    health_goal: HealthGoal,
    diseases: list[Disease],
    preferred_foods: list[str],
    disliked_foods: list[str],
    feedback_map: dict[int, str],
    daily_plan: DailyNutritionPlan | None = None,
    weight: float = 0.0,
) -> ScoreBreakdown:
    w = _resolve_weights(health_goal, diseases)

    def scale(raw: float, key: str) -> float:
        return round(raw * w[key] / 10, 2)

    return ScoreBreakdown(
        gap_match=scale(_gap_match_score(food, gap, meal_target), "gap_match"),
        goal_alignment=scale(_goal_alignment_score(food, health_goal), "goal_alignment"),
        disease_compliance=scale(_disease_compliance_score(food, diseases), "disease_compliance"),
        preference=scale(_preference_score(food, preferred_foods, disliked_foods), "preference"),
        feedback=scale(_feedback_score(food.id, feedback_map), "feedback"),
        micro_fit=scale(_micro_fit_score(food, daily_plan, meal_target), "micro_fit"),
        gi_gl=scale(_gi_gl_score(food, diseases), "gi_gl"),
        leucine=scale(_leucine_score(food, gap.protein, weight), "leucine"),
    )


# ---------------------------------------------------------------------------
# Gap Match Score — 내부 [0-10], 가중치 적용 후 [0, w["gap_match"]]
# ---------------------------------------------------------------------------

def _gap_match_score(food: Food, gap: NutrientTarget, meal_target: NutrientTarget) -> float:
    nutrients = {
        "calories": (food.calories or 0, gap.calories, meal_target.calories),
        "protein":  (food.protein or 0,  gap.protein,  meal_target.protein),
        "carbs":    (food.carbs or 0,    gap.carbs,    meal_target.carbs),
        "fat":      (food.fat or 0,      gap.fat,      meal_target.fat),
    }

    deficit_ratios: dict[str, float] = {}
    for name, (_, g, mt) in nutrients.items():
        deficit_ratios[name] = max(g, 0) / mt if mt > 0 else 0.0

    weights = _softmax(deficit_ratios)

    score = 0.0
    for name, (food_val, g, mt) in nutrients.items():
        if g > 0:
            raw = food_val / g
            if raw <= 1.0:
                fill_rate = raw
            else:
                # 필요량 초과 시 제곱 페널티 곡선
                excess = raw - 1.0
                fill_rate = max(0.0, 1.0 - excess ** 2)
        else:
            # 이미 충족된 영양소: 해당 식품 기여가 클수록 제곱 감점
            fill_rate = max(0.0, 1.0 - (food_val / mt) ** 2) if mt > 0 else 0.5

        score += weights[name] * fill_rate * 10

    return round(min(score, 10.0), 2)


def _softmax(ratios: dict[str, float]) -> dict[str, float]:
    if not ratios:
        return {}
    max_val = max(ratios.values())
    exp_vals = {k: math.exp(v - max_val) for k, v in ratios.items()}
    total = sum(exp_vals.values())
    return {k: v / total for k, v in exp_vals.items()}


# ---------------------------------------------------------------------------
# Goal Alignment Score — [0-10]
# ---------------------------------------------------------------------------

def _goal_alignment_score(food: Food, health_goal: HealthGoal) -> float:
    score = 5.0
    w = food.weight or 1
    calories = food.calories or 0
    protein = food.protein or 0
    fat_val = food.fat or 0

    cal_density = calories / w if w > 0 else 0
    protein_ratio = (protein * 4 / calories * 100) if calories > 0 else 0

    if health_goal == HealthGoal.DIET:
        if cal_density < 1.5:
            score += 2.5
        if protein_ratio > 30:
            score += 2.5
        if cal_density > 2.5:
            score -= 3.3

    elif health_goal == HealthGoal.BULK_UP:
        if cal_density > 1.5:
            score += 2.5
        if protein > 20:
            score += 2.5
        if cal_density < 0.8:
            score -= 3.3

    elif health_goal == HealthGoal.LEAN_MASS_UP:
        if protein_ratio > 35:
            score += 2.5
        if 1.0 <= cal_density <= 2.0:
            score += 2.5
        fat_ratio = (fat_val * 9 / calories * 100) if calories > 0 else 0
        if fat_ratio > 40:
            score -= 3.3

    return round(max(0.0, min(score, 10.0)), 2)


# ---------------------------------------------------------------------------
# Disease Compliance Score — [0-10] (KIDNEY/GOUT/THYROID/LIVER 중심)
# HYPERTENSION/HYPERLIPIDEMIA/DIABETES는 micro_fit/gi_gl로 이관
# ---------------------------------------------------------------------------

def _disease_compliance_score(food: Food, diseases: list[Disease]) -> float:
    score = 10.0

    for disease in diseases:
        if disease == Disease.KIDNEY_DISEASE:
            if food.protein and food.protein > 15:
                score -= 5

        elif disease == Disease.LIVER_DISEASE:
            # 간질환: 고단백 과잉 섭취 제한 (1.2 g/kg 상한, 단품 100g 기준 15g 초과 시)
            if food.protein and food.protein > 15:
                score -= 3

        elif disease == Disease.GOUT:
            profile = getattr(food, "profile", None)
            if profile and profile.purine_mg and profile.purine_mg > 200:
                score -= 5
            elif food.purine_level and food.purine_level.upper() in ("HIGH", "VERY_HIGH"):
                score -= 4

        elif disease == Disease.THYROID_DISEASE:
            if food.iodine and food.iodine > 1000:
                score -= 3

    return round(max(0.0, min(score, 10.0)), 2)


# ---------------------------------------------------------------------------
# Micro-Fit Score — [0-10] (섬유/K/Na/포화지방)
# ---------------------------------------------------------------------------

def _micro_fit_score(
    food: Food,
    daily_plan: DailyNutritionPlan | None,
    meal_target: NutrientTarget,
) -> float:
    if daily_plan is None:
        return 5.0

    score = 5.0

    # 식이섬유 기여율 (끼니 목표 ≈ 일일 × 0.35)
    meal_fiber_target = daily_plan.fiber_g * 0.35
    if food.fiber and meal_fiber_target > 0:
        fiber_rate = min(food.fiber / meal_fiber_target, 1.0)
        score += fiber_rate * 4

    # K/Na 비율
    k = food.potassium or 0
    na = food.sodium or 0
    if na > 0:
        kna = k / na
        if kna > 2.0:
            score += 3
        elif kna < 0.5:
            score -= 2

    # 포화지방 끼니 한도 초과
    meal_sat_fat_limit = daily_plan.sat_fat_g_max / 3
    if food.saturated_fat and food.saturated_fat > meal_sat_fat_limit:
        score -= 3

    # HYPERTENSION(Na_max=1500) 기준: 끼니 Na 한도 0.4배 초과 → 강감점
    meal_na_limit = daily_plan.sodium_mg_max / 3
    if daily_plan.sodium_mg_max <= 1500 and na > meal_na_limit * 0.4:
        score -= 5

    return round(max(0.0, min(score, 10.0)), 2)


# ---------------------------------------------------------------------------
# GI/GL Score — [0-10] (당뇨 사용자만 차별화)
# ---------------------------------------------------------------------------

def _gi_gl_score(food: Food, diseases: list[Disease]) -> float:
    if Disease.DIABETES not in diseases:
        return 5.0

    profile = getattr(food, "profile", None)
    if profile is None or (profile.gl is None and profile.gi is None):
        return 5.0

    score = 5.0
    gl = profile.gl
    gi = profile.gi

    if gl is not None:
        if gl <= 10:
            score = 10.0
        elif gl <= 20:
            score = 5.0
        else:
            score = 0.0

    if gi is not None and gi >= 70:
        score = max(0.0, score - 3)

    return round(max(0.0, min(score, 10.0)), 2)


# ---------------------------------------------------------------------------
# Leucine Score — [0-10]
# ---------------------------------------------------------------------------

def _leucine_score(food: Food, remaining_protein: float, body_weight: float) -> float:
    score = 0.0
    food_protein = food.protein or 0

    if remaining_protein > 0 and food_protein >= remaining_protein * 0.6:
        score += 5.0

    estimated_leucine = food_protein * 0.085
    if estimated_leucine >= 2.5:
        score += 5.0

    return round(max(0.0, min(score, 10.0)), 2)


# ---------------------------------------------------------------------------
# Preference Score — [0-10]
# ---------------------------------------------------------------------------

def _preference_score(
    food: Food,
    preferred_foods: list[str],
    disliked_foods: list[str],
) -> float:
    food_name = food.name or ""

    for keyword in disliked_foods:
        if keyword in food_name:
            return 0.0

    score = 5.0
    for keyword in preferred_foods:
        if keyword == food_name:
            return 10.0
        if keyword in food_name:
            return min(score + 3, 10.0)

    return score


# ---------------------------------------------------------------------------
# Feedback Score — [0-10]
# ---------------------------------------------------------------------------

_FEEDBACK_DELTA = {
    "like": 3,
    "saved": 5,
    "dislike": -5,
    "ignored": -1,
}


def _feedback_score(food_id: int, feedback_map: dict[int, str]) -> float:
    score = 5.0
    fb_type = feedback_map.get(food_id)
    if fb_type and fb_type in _FEEDBACK_DELTA:
        score += _FEEDBACK_DELTA[fb_type]
    return round(max(0.0, min(score, 10.0)), 2)
