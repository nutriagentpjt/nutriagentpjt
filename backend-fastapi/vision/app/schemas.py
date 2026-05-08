from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str = "ok"
    app_name: str
    version: str
    environment: str


class NutritionInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    serving_basis: float | None = Field(default=None, ge=0)
    calories_kcal: float | None = Field(default=None, ge=0)
    protein_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)
    carbs_g: float | None = Field(default=None, ge=0)
    sugars_g: float | None = Field(default=None, ge=0)
    fiber_g: float | None = Field(default=None, ge=0)
    sodium_mg: float | None = Field(default=None, ge=0)
    potassium_mg: float | None = Field(default=None, ge=0)
    cholesterol_mg: float | None = Field(default=None, ge=0)
    sat_fat_g: float | None = Field(default=None, ge=0)
    caffeine_mg: float | None = Field(default=None, ge=0)


class CandidateItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rank: int = Field(..., ge=1)
    food_id: int
    food_name: str
    similarity: float | None = None
    nutrition: NutritionInfo


class PredictionResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    top1_food_name: str
    top1_similarity: float | None = None


class SearchImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    matched: bool
    prediction: PredictionResult | None
    candidates: list[CandidateItem]
    top_k_used: int
    returned_candidates: int
    model_name: str
    distance_metric: str


class ErrorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    detail: str
