from __future__ import annotations

from typing import Any

import numpy as np

from app.config import settings
from app.db import fetch_all


class RetrievalError(RuntimeError):
    """Raised when retrieval input/query is invalid."""


# min_similarity 필터는 CTE 내부 WHERE에 적용한다.
# 이렇게 해야 "similarity >= threshold를 만족하는 것 중 top_k"를 반환한다.
# 외부 SELECT 이후에 필터를 적용하면 LIMIT으로 이미 잘린 결과에서만 필터링되어
# threshold를 만족하는 결과가 top_k 범위 밖에 있을 때 영원히 발견되지 않는다.
#
# max_distance = 1 - min_similarity 로 변환하여 전달한다.
# (cosine distance = 1 - cosine similarity 이므로)
# min_similarity=0.0(기본값) → max_distance=1.0 → 사실상 필터 없음
#
# ORDER BY 는 SELECT 에서 정의한 distance 별칭을 재사용해
# %(query_embedding)s 가 SELECT + WHERE 두 번만 등장하도록 한다.
RETRIEVAL_SQL = """
WITH nearest AS (
    SELECT
        ie.image_id,
        ie.food_id,
        ie.class_name_raw,
        ie.class_name_norm,
        ie.embedding <=> %(query_embedding)s::vector AS distance
    FROM image_embeddings AS ie
    WHERE ie.embedding <=> %(query_embedding)s::vector <= %(max_distance)s
    ORDER BY distance ASC, ie.image_id ASC
    LIMIT %(top_k)s
)
SELECT
    n.image_id,
    n.class_name_raw,
    n.class_name_norm,
    n.distance,
    (1 - n.distance) AS similarity,

    vf.food_id,
    vf.food_name_raw,
    vf.food_name_norm,
    vf.serving_basis,
    vf.calories_kcal,
    vf.protein_g,
    vf.fat_g,
    vf.carbs_g,
    vf.sugars_g,
    vf.fiber_g,
    vf.sodium_mg,
    vf.potassium_mg,
    vf.cholesterol_mg,
    vf.sat_fat_g,
    vf.caffeine_mg

FROM nearest AS n
INNER JOIN vision_foods AS vf ON n.food_id = vf.food_id
ORDER BY n.distance ASC, n.image_id ASC;
"""


def _validate_top_k(top_k: int | None) -> int:
    if top_k is None:
        top_k = settings.DEFAULT_TOP_K

    if not isinstance(top_k, int):
        raise RetrievalError(f"top_k must be int, got: {type(top_k)}")

    if top_k <= 0:
        raise RetrievalError(f"top_k must be >= 1, got: {top_k}")

    if top_k > settings.MAX_TOP_K:
        raise RetrievalError(
            f"top_k must be <= {settings.MAX_TOP_K}, got: {top_k}"
        )

    return top_k


def _to_vector_list(query_embedding: Any) -> list[float]:
    if query_embedding is None:
        raise RetrievalError("query_embedding is None")

    if isinstance(query_embedding, np.ndarray):
        values = query_embedding.astype(np.float64).tolist()
    elif isinstance(query_embedding, (list, tuple)):
        values = [float(x) for x in query_embedding]
    else:
        raise RetrievalError(
            f"Unsupported query_embedding type: {type(query_embedding)}"
        )

    if len(values) != settings.EMBEDDING_DIM:
        raise RetrievalError(
            f"query_embedding length must be {settings.EMBEDDING_DIM}, "
            f"got {len(values)}"
        )

    for idx, value in enumerate(values):
        if not np.isfinite(value):
            raise RetrievalError(
                f"query_embedding contains non-finite value at index {idx}: {value}"
            )

    return values


def _to_pgvector_text(values: list[float]) -> str:
    return "[" + ",".join(f"{x:.10f}" for x in values) + "]"


def _normalize_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Add rank and normalize numeric types for downstream inference usage.
    """
    normalized: list[dict[str, Any]] = []

    for rank, row in enumerate(rows, start=1):
        item = dict(row)
        item["rank"] = rank

        if item.get("distance") is not None:
            item["distance"] = float(item["distance"])

        if item.get("similarity") is not None:
            item["similarity"] = float(item["similarity"])

        normalized.append(item)

    return normalized


def retrieve_neighbors(
    query_embedding: Any,
    top_k: int | None = None,
    min_similarity: float | None = None,
) -> list[dict[str, Any]]:
    """
    Retrieve top-k nearest image neighbors from image_embeddings
    and join nutrition info from vision_foods.

    min_similarity 는 CTE 내부 WHERE 로 처리되므로,
    threshold를 만족하는 결과 중 실제로 가장 가까운 top_k 개가 반환된다.

    Returns raw image-level neighbors.
    Final top-3 food candidates are decided in inference.py.
    """
    validated_top_k = _validate_top_k(top_k)
    embedding_list = _to_vector_list(query_embedding)
    query_embedding_text = _to_pgvector_text(embedding_list)

    # similarity = 1 - distance 이므로 min_similarity → max_distance 로 변환
    # min_similarity=None(기본값)이면 max_distance=1.0 → 사실상 필터 없음
    effective_min_similarity = min_similarity if min_similarity is not None else 0.0
    max_distance = 1.0 - effective_min_similarity

    rows = fetch_all(
        RETRIEVAL_SQL,
        {
            "query_embedding": query_embedding_text,
            "top_k": validated_top_k,
            "max_distance": max_distance,
        },
    )

    return _normalize_rows(rows)
