from pydantic import BaseModel

from app.schemas.enums import MealType


class NutrientTargets(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float


class ScoreBreakdown(BaseModel):
    gap_match: float
    goal_alignment: float
    disease_compliance: float
    preference: float
    feedback: float


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


class RecommendResponse(BaseModel):
    meal_type: MealType
    daily_target: NutrientTargets
    meal_target: NutrientTargets
    recommendations: list[FoodRecommendation]
