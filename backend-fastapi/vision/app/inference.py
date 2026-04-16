from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.config import settings
from app.db import DatabaseError
from app.model import ModelError, encode_query_image, get_model
from app.retrieval import RetrievalError, retrieve_neighbors
from app.schemas import (
    CandidateItem,
    NutritionInfo,
    PredictionResult,
    SearchImageResponse,
)


class InferenceError(RuntimeError):
    """Raised when inference pipeline fails."""


@dataclass
class AggregatedCandidate:
    food_id: int
    food_name: str
    food_name_norm: str

    # Ranking / score
    max_similarity: float = 0.0
    score_sum: float = 0.0
    neighbor_count: int = 0

    # Nutrition payload
    nutrition_payload: dict[str, Any] = field(default_factory=dict)

    def update(self, row: dict[str, Any]) -> None:
        similarity = float(row.get("similarity") or 0.0)

        self.score_sum += similarity
        self.neighbor_count += 1

        if similarity > self.max_similarity:
            self.max_similarity = similarity

            self.nutrition_payload = {
                "serving_basis": row.get("serving_basis"),
                "calories_kcal": row.get("calories_kcal"),
                "protein_g": row.get("protein_g"),
                "fat_g": row.get("fat_g"),
                "carbs_g": row.get("carbs_g"),
                "sugars_g": row.get("sugars_g"),
                "fiber_g": row.get("fiber_g"),
                "sodium_mg": row.get("sodium_mg"),
                "potassium_mg": row.get("potassium_mg"),
                "cholesterol_mg": row.get("cholesterol_mg"),
                "sat_fat_g": row.get("sat_fat_g"),
                "caffeine_mg": row.get("caffeine_mg"),
            }


def _get_candidate_key(row: dict[str, Any]) -> tuple[str, str]:
    """
    Prefer mapped vision_foods name.
    Fallback to image class name if vision_foods row is missing.

    NOTE: retrieval.py 가 INNER JOIN 을 사용하므로 food_name_raw/norm 은 항상 존재한다.
    class_name fallback 은 현재 도달 불가(dead code)지만, 향후 LEFT JOIN 으로 변경 시
    활성화될 수 있으므로 의도적으로 유지한다.
    단, LEFT JOIN 으로 변경하면 food_id 와 display name 불일치 문제가 생길 수 있으니
    그 시점에 이 함수도 함께 재검토해야 한다.
    """
    food_name_norm = row.get("food_name_norm") or row.get("class_name_norm")
    food_name = row.get("food_name_raw") or row.get("class_name_raw")

    if not food_name_norm or not food_name:
        raise InferenceError(
            "Failed to resolve candidate key from retrieval row. "
            "Both food_name and class_name are missing."
        )

    return str(food_name), str(food_name_norm)


def _aggregate_candidates(neighbors: list[dict[str, Any]]) -> list[AggregatedCandidate]:
    """
    Aggregate image-level nearest neighbors into food-level candidates.

    Strategy:
    - Group by normalized food name
    - Weighted voting score = sum(similarity)
    - Tie-breaker 1 = max_similarity
    - Tie-breaker 2 = neighbor_count
    - Tie-breaker 3 = food_name alphabetically
    """
    grouped: dict[str, AggregatedCandidate] = {}

    for row in neighbors:
        food_name, food_name_norm = _get_candidate_key(row)

        if food_name_norm not in grouped:
            food_id = row.get("food_id")
            if food_id is None:
                raise InferenceError(
                    f"food_id is None for candidate '{food_name}'. "
                    "This indicates a data integrity issue in image_embeddings."
                )
            grouped[food_name_norm] = AggregatedCandidate(
                food_id=int(food_id),
                food_name=food_name,
                food_name_norm=food_name_norm,
            )

        grouped[food_name_norm].update(row)

    candidates = list(grouped.values())

    candidates.sort(
        key=lambda c: (
            -c.max_similarity,
            -c.score_sum,
            -c.neighbor_count,
            c.food_name,
        )
    )
    return candidates


def _build_nutrition(payload: dict[str, Any]) -> NutritionInfo:
    return NutritionInfo(
        serving_basis=payload.get("serving_basis"),
        calories_kcal=payload.get("calories_kcal"),
        protein_g=payload.get("protein_g"),
        fat_g=payload.get("fat_g"),
        carbs_g=payload.get("carbs_g"),
        sugars_g=payload.get("sugars_g"),
        fiber_g=payload.get("fiber_g"),
        sodium_mg=payload.get("sodium_mg"),
        potassium_mg=payload.get("potassium_mg"),
        cholesterol_mg=payload.get("cholesterol_mg"),
        sat_fat_g=payload.get("sat_fat_g"),
        caffeine_mg=payload.get("caffeine_mg"),
    )


def _build_empty_response(top_k_used: int) -> SearchImageResponse:
    """
    min_similarity 기준을 만족하는 결과가 없을 때 반환.
    에러가 아닌 정상 응답(200)으로 처리한다.
    Spring은 matched=False 를 보고 "인식 실패" 케이스로 처리한다.
    """
    return SearchImageResponse(
        matched=False,
        prediction=None,
        candidates=[],
        top_k_used=top_k_used,
        returned_candidates=0,
        model_name=settings.MODEL_NAME,
        distance_metric=settings.DISTANCE_METRIC,
    )


def _build_response(
    aggregated: list[AggregatedCandidate],
    top_k_used: int,
) -> SearchImageResponse:
    returned_candidates = min(len(aggregated), settings.DEFAULT_TOP_CANDIDATES)
    top_candidates = aggregated[:returned_candidates]
    top1 = top_candidates[0]

    # top1_similarity: top1 후보의 가장 유사한 이미지 1장의 유사도
    # score_sum 기반 confidence는 top_k에 종속되어 신뢰할 수 없으므로 사용하지 않는다
    prediction = PredictionResult(
        top1_food_name=top1.food_name,
        top1_similarity=top1.max_similarity,
    )

    candidate_items: list[CandidateItem] = []
    for idx, candidate in enumerate(top_candidates, start=1):
        candidate_items.append(
            CandidateItem(
                rank=idx,
                food_id=candidate.food_id,
                food_name=candidate.food_name,
                similarity=candidate.max_similarity,
                nutrition=_build_nutrition(candidate.nutrition_payload),
            )
        )

    return SearchImageResponse(
        matched=True,
        prediction=prediction,
        candidates=candidate_items,
        top_k_used=top_k_used,
        returned_candidates=returned_candidates,
        model_name=settings.MODEL_NAME,
        distance_metric=settings.DISTANCE_METRIC,
    )


def infer_from_image_bytes(
    image_bytes: bytes,
    top_k: int | None = None,
    min_similarity: float | None = None,
) -> SearchImageResponse:
    """
    End-to-end inference pipeline.

    Flow:
    1. image bytes -> query embedding
    2. retrieve raw nearest image neighbors
    3. aggregate into food-level candidates
    4. return top-3 response

    결과가 없으면 에러 대신 matched=False 응답을 반환한다.
    """
    resolved_top_k = top_k if top_k is not None else settings.DEFAULT_TOP_K

    try:
        query_embedding = encode_query_image(image_bytes)
        neighbors = retrieve_neighbors(
            query_embedding=query_embedding,
            top_k=resolved_top_k,  # None 아닌 확정값 전달 — top_k_used와 일치 보장
            min_similarity=min_similarity,
        )
    except (ModelError, RetrievalError) as e:
        raise InferenceError(str(e)) from e
    except DatabaseError:
        raise  # DB 장애는 InferenceError로 감싸지 않고 그대로 전파 → main.py에서 500 처리
    except Exception as e:
        raise InferenceError(f"Unexpected inference error: {e}") from e

    if not neighbors:
        return _build_empty_response(resolved_top_k)

    aggregated = _aggregate_candidates(neighbors)

    if not aggregated:
        return _build_empty_response(resolved_top_k)

    return _build_response(aggregated, top_k_used=resolved_top_k)


def get_model_metadata() -> dict[str, Any]:
    """
    Small helper for /health or future /model-info endpoint.
    """
    metadata = get_model().get_metadata()
    return {
        "model_name": metadata.model_name,
        "embedding_dim": metadata.embedding_dim,
        "device": metadata.device,
        "image_size": metadata.image_size,
        "resize_size": metadata.resize_size,
        "l2_normalize": metadata.l2_normalize,
    }
