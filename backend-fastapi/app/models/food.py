from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class Food(Base):
    __tablename__ = "foods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False, comment="1회 기본 제공량(g)")
    calories: Mapped[float] = mapped_column(Float, nullable=False)
    protein: Mapped[float] = mapped_column(Float, nullable=False)
    carbs: Mapped[float] = mapped_column(Float, nullable=False)
    fat: Mapped[float] = mapped_column(Float, nullable=False)
    sodium: Mapped[float] = mapped_column(Float, nullable=False, comment="mg")
    saturated_fat: Mapped[float | None] = mapped_column(Float, nullable=True, comment="g")
    sugar: Mapped[float | None] = mapped_column(Float, nullable=True, comment="g")
    dietary_fiber: Mapped[float | None] = mapped_column(Float, nullable=True, comment="g")
    potassium: Mapped[float | None] = mapped_column(Float, nullable=True, comment="mg")
    purine_level: Mapped[str | None] = mapped_column(String, nullable=True, comment="HIGH/MED/LOW")
    iodine: Mapped[float | None] = mapped_column(Float, nullable=True, comment="mcg")
    selenium: Mapped[float | None] = mapped_column(Float, nullable=True, comment="mcg")
