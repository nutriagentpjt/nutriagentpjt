from datetime import datetime

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models import Base


class Food(Base):
    __tablename__ = "foods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    weight: Mapped[float | None] = mapped_column(Float, nullable=True, comment="1회 기본 제공량(g)")
    calories: Mapped[float | None] = mapped_column(Float, nullable=True)
    protein: Mapped[float | None] = mapped_column(Float, nullable=True)
    carbs: Mapped[float | None] = mapped_column(Float, nullable=True)
    fat: Mapped[float | None] = mapped_column(Float, nullable=True)
    sodium: Mapped[float | None] = mapped_column(Float, nullable=True, comment="mg")
    saturated_fat: Mapped[float | None] = mapped_column(Float, nullable=True, comment="g")
    sugars: Mapped[float | None] = mapped_column("sugar", Float, nullable=True, comment="g")
    fiber: Mapped[float | None] = mapped_column("dietary_fiber", Float, nullable=True, comment="g")
    potassium: Mapped[float | None] = mapped_column(Float, nullable=True, comment="mg")
    purine_level: Mapped[str | None] = mapped_column(String, nullable=True)
    iodine: Mapped[float | None] = mapped_column(Float, nullable=True)
    selenium: Mapped[float | None] = mapped_column(Float, nullable=True)
    recommandable: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    profile: Mapped["FoodProfile | None"] = relationship(
        "FoodProfile", back_populates="food", uselist=False
    )


class FoodProfile(Base):
    __tablename__ = "food_profile"

    food_id: Mapped[int] = mapped_column(ForeignKey("foods.id"), primary_key=True)
    dish_role: Mapped[str | None] = mapped_column(String(20), nullable=True)
    food_group: Mapped[str | None] = mapped_column(String(20), nullable=True)
    gi: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gl: Mapped[float | None] = mapped_column(Float, nullable=True)
    purine_mg: Mapped[float | None] = mapped_column(Float, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    food: Mapped["Food"] = relationship("Food", back_populates="profile")
