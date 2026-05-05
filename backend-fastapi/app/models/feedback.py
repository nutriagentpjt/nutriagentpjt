from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class UserFoodFeedback(Base):
    __tablename__ = "user_food_feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    guest_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    food_id: Mapped[int] = mapped_column(Integer, ForeignKey("foods.id"), nullable=False)
    feedback_type: Mapped[str] = mapped_column(String, nullable=False, comment="like/dislike/saved/ignored")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
