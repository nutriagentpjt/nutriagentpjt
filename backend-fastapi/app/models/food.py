from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class Food(Base):
    __tablename__ = "foods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    weight: Mapped[float | None] = mapped_column(Float, nullable=True, comment="1회 기본 제공량(g)")
    calories: Mapped[float | None] = mapped_column(Float, nullable=True)
    carbs: Mapped[float | None] = mapped_column(Float, nullable=True)
    protein: Mapped[float | None] = mapped_column(Float, nullable=True)
    fat: Mapped[float | None] = mapped_column(Float, nullable=True)
    sodium: Mapped[float | None] = mapped_column(Float, nullable=True, comment="mg")
    sugars: Mapped[float | None] = mapped_column(Float, nullable=True, comment="g")
    fiber: Mapped[float | None] = mapped_column(Float, nullable=True, comment="g")
    cholesterol: Mapped[float | None] = mapped_column(Float, nullable=True, comment="mg")
    saturated_fat: Mapped[float | None] = mapped_column(Float, nullable=True, comment="g")
    trans_fat: Mapped[float | None] = mapped_column(Float, nullable=True, comment="g")
