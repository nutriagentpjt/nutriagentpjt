from typing import Literal

from pydantic import BaseModel

from app.schemas.enums import MealType


class NutrientTargets(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber_g: float | None = None
    sodium_mg_max: float | None = None
    potassium_mg: float | None = None
    sat_fat_g_max: float | None = None
    added_sugar_g_max: float | None = None


class ScoreBreakdown(BaseModel):
    gap_match: float
    goal_alignment: float
    disease_compliance: float
    preference: float
    feedback: float
    micro_fit: float = 0.0
    gi_gl: float = 0.0
    leucine: float = 0.0


class NutrientsPerServing(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float


class FoodRecommendation(BaseModel):
    food_id: int
    food_name: str
    score: float
    score_breakdown: ScoreBreakdown
    recommended_amount_g: float
    amount_ratio: float
    nutrients_per_serving: NutrientsPerServing
    reason_tags: list[str]


class MealSetItem(BaseModel):
    role: str
    food: FoodRecommendation


class MealSetRecommendation(BaseModel):
    set_id: str
    items: list[MealSetItem]
    total_nutrients: NutrientsPerServing
    micro_nutrients: dict[str, float]
    score: float
    score_breakdown: ScoreBreakdown
    reason_tags: list[str]


class RecommendResponse(BaseModel):
    meal_type: MealType
    daily_target: NutrientTargets
    meal_target: NutrientTargets
    mode: Literal["single", "set"] = "set"
    recommendations: list[FoodRecommendation]
    meal_sets: list[MealSetRecommendation] | None = None
