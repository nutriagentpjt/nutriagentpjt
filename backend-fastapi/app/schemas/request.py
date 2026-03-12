from pydantic import BaseModel, Field

from app.schemas.enums import (
    ActivityLevel,
    Disease,
    FeedbackType,
    Gender,
    HealthGoal,
    MealPattern,
    MealType,
)


class AlreadyEaten(BaseModel):
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0


class UserProfile(BaseModel):
    guest_id: str
    age: int = Field(ge=1, le=120)
    gender: Gender
    height: float = Field(gt=0, description="cm")
    weight: float = Field(gt=0, description="kg")
    health_goal: HealthGoal
    activity_level: ActivityLevel
    meal_pattern: MealPattern
    preferred_foods: list[str] = Field(default_factory=list)
    disliked_foods: list[str] = Field(default_factory=list)
    diseases: list[Disease] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)


class MealContext(BaseModel):
    meal_type: MealType
    already_eaten: list[AlreadyEaten] = Field(default_factory=list)


class RecommendRequest(BaseModel):
    user: UserProfile
    meal: MealContext
    top_n: int = Field(default=5, ge=1, le=20)


class FeedbackRequest(BaseModel):
    guest_id: str
    food_id: int
    feedback_type: FeedbackType
