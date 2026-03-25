from pydantic import BaseModel, Field

from app.schemas.enums import FeedbackType, MealType


class RecommendRequest(BaseModel):
    guest_id: str
    meal_type: MealType
    top_n: int = Field(default=5, ge=1, le=20)


class FeedbackRequest(BaseModel):
    guest_id: str
    food_id: int
    feedback_type: FeedbackType
