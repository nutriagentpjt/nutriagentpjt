import math

from app.models.food import Food
from app.schemas.enums import Disease, HealthGoal
from app.schemas.response import ScoreBreakdown
from app.services.nutrition_calculator import NutrientTarget


def calculate_score(
    food: Food,
    gap: NutrientTarget,
    meal_target: NutrientTarget,
    health_goal: HealthGoal,
    diseases: list[Disease],
    preferred_foods: list[str],
    disliked_foods: list[str],
    feedback_map: dict[int, str],
) -> ScoreBreakdown:
    return ScoreBreakdown(
        gap_match=_gap_match_score(food, gap, meal_target),
        goal_alignment=_goal_alignment_score(food, health_goal),
        disease_compliance=_disease_compliance_score(food, diseases),
        preference=_preference_score(food, preferred_foods, disliked_foods),
        feedback=_feedback_score(food.id, feedback_map),
    )


# ---------------------------------------------------------------------------
# Gap Match Score (최대 50점)
# ---------------------------------------------------------------------------

def _gap_match_score(food: Food, gap: NutrientTarget, meal_target: NutrientTarget) -> float:
    nutrients = {
        "calories": (food.calories or 0, gap.calories, meal_target.calories),
        "protein": (food.protein or 0, gap.protein, meal_target.protein),
        "carbs": (food.carbs or 0, gap.carbs, meal_target.carbs),
        "fat": (food.fat or 0, gap.fat, meal_target.fat),
    }

    # 부족 비율 기반 softmax 가중치
    deficit_ratios: dict[str, float] = {}
    for name, (_, g, mt) in nutrients.items():
        if mt > 0:
            deficit_ratios[name] = max(g, 0) / mt
        else:
            deficit_ratios[name] = 0.0

    weights = _softmax(deficit_ratios)

    score = 0.0
    for name, (food_val, g, _mt) in nutrients.items():
        if g > 0:
            fill_rate = min(food_val / g, 1.0) if g > 0 else 0.0
        else:
            # 이미 충족된 영양소 → 초과분 감점
            fill_rate = max(0, 1.0 - (food_val / _mt)) if _mt > 0 else 0.5

        score += weights[name] * fill_rate * 50

    return round(min(score, 50.0), 2)


def _softmax(ratios: dict[str, float]) -> dict[str, float]:
    if not ratios:
        return {}
    max_val = max(ratios.values())
    exp_vals = {k: math.exp(v - max_val) for k, v in ratios.items()}
    total = sum(exp_vals.values())
    return {k: v / total for k, v in exp_vals.items()}


# ---------------------------------------------------------------------------
# Goal Alignment Score (최대 15점)
# ---------------------------------------------------------------------------

def _goal_alignment_score(food: Food, health_goal: HealthGoal) -> float:
    score = 7.5  # 기본 중간
    weight = food.weight or 1
    calories = food.calories or 0
    protein = food.protein or 0
    fat_val = food.fat or 0

    cal_density = calories / weight if weight > 0 else 0
    protein_ratio = (protein * 4 / calories * 100) if calories > 0 else 0

    if health_goal == HealthGoal.DIET:
        if cal_density < 1.5:
            score += 3.75
        if protein_ratio > 30:
            score += 3.75
        if cal_density > 2.5:
            score -= 5.0

    elif health_goal == HealthGoal.BULK_UP:
        if cal_density > 1.5:
            score += 3.75
        if protein > 20:
            score += 3.75
        if cal_density < 0.8:
            score -= 5.0

    elif health_goal == HealthGoal.LEAN_MASS_UP:
        if protein_ratio > 35:
            score += 3.75
        if 1.0 <= cal_density <= 2.0:
            score += 3.75
        fat_ratio = (fat_val * 9 / calories * 100) if calories > 0 else 0
        if fat_ratio > 40:
            score -= 5.0

    # MAINTAIN / GENERAL_HEALTH → 기본 점수 유지

    return round(max(0.0, min(score, 15.0)), 2)


# ---------------------------------------------------------------------------
# Disease Compliance Score (최대 15점)
# ---------------------------------------------------------------------------

def _disease_compliance_score(food: Food, diseases: list[Disease]) -> float:
    score = 15.0

    for disease in diseases:
        if disease == Disease.NONE:
            continue

        if disease == Disease.DIABETES:
            if food.sugars and food.calories and food.calories > 0:
                sugar_ratio = (food.sugars * 4 / food.calories) * 100
                if sugar_ratio > 30:
                    score -= 5

        elif disease == Disease.HYPERTENSION:
            if food.sodium and food.sodium > 600:
                score -= 5

        elif disease == Disease.HYPERLIPIDEMIA:
            if food.saturated_fat and food.saturated_fat > 5:
                score -= 5

        elif disease == Disease.KIDNEY_DISEASE:
            if food.protein and food.protein > 15:
                score -= 5

        elif disease == Disease.LIVER_DISEASE:
            if food.sodium and food.sodium > 600:
                score -= 5

    return round(max(0.0, min(score, 15.0)), 2)


# ---------------------------------------------------------------------------
# Preference Score (최대 10점)
# ---------------------------------------------------------------------------

def _preference_score(
    food: Food,
    preferred_foods: list[str],
    disliked_foods: list[str],
) -> float:
    food_name = food.name or ""

    # 비선호 체크
    for keyword in disliked_foods:
        if keyword in food_name:
            return 0.0

    score = 5.0

    # 선호 체크: 정확 매칭 +5, 부분 매칭 +3
    for keyword in preferred_foods:
        if keyword == food_name:
            return min(score + 5, 10.0)
        if keyword in food_name:
            return min(score + 3, 10.0)

    return score


# ---------------------------------------------------------------------------
# Feedback Score (최대 10점)
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
