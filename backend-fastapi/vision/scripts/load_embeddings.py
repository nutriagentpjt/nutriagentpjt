import argparse
import logging
import os
import unicodedata
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import psycopg


REQUIRED_SOURCE_COLUMNS = [
    "image_id",
    "rename_id",
    "class_name",
    "class_seq",
    "relative_path",
    "original_relative_path",
    "model_name",
    "embedding_dim",
    "embedding",
]

TARGET_COLUMNS = [
    "image_id",
    "rename_id",
    "class_seq",
    "food_id",
    "class_name_raw",
    "class_name_norm",
    "relative_path",
    "original_relative_path",
    "model_name",
    "embedding",
]

UPSERT_SQL = """
INSERT INTO image_embeddings (
    image_id,
    rename_id,
    class_seq,
    food_id,
    class_name_raw,
    class_name_norm,
    relative_path,
    original_relative_path,
    model_name,
    embedding
)
VALUES (
    %(image_id)s,
    %(rename_id)s,
    %(class_seq)s,
    %(food_id)s,
    %(class_name_raw)s,
    %(class_name_norm)s,
    %(relative_path)s,
    %(original_relative_path)s,
    %(model_name)s,
    %(embedding)s::vector
)
ON CONFLICT (image_id)
DO UPDATE SET
    rename_id = EXCLUDED.rename_id,
    class_seq = EXCLUDED.class_seq,
    food_id = EXCLUDED.food_id,
    class_name_raw = EXCLUDED.class_name_raw,
    class_name_norm = EXCLUDED.class_name_norm,
    relative_path = EXCLUDED.relative_path,
    original_relative_path = EXCLUDED.original_relative_path,
    model_name = EXCLUDED.model_name,
    embedding = EXCLUDED.embedding;
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Load pgvector_rows.parquet into image_embeddings."
    )
    parser.add_argument(
        "--db-url",
        default=os.getenv("DATABASE_URL"),
        help="PostgreSQL connection URL. Defaults to env DATABASE_URL.",
    )
    parser.add_argument(
        "--parquet-path",
        default=str(
            Path(__file__).resolve().parents[1] / "data" / "pgvector_rows.parquet"
        ),
        help="Path to pgvector_rows.parquet",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=1000,
        help="Batch size for DB upsert. Default: 1000",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging.",
    )
    return parser.parse_args()


def normalize_text(value: Any) -> str | None:
    if pd.isna(value):
        return None
    text = str(value).strip()
    if not text:
        return None
    return unicodedata.normalize("NFC", text)


def to_required_int(value: Any, field_name: str) -> int:
    if pd.isna(value):
        raise ValueError(f"{field_name} is null")
    return int(value)


def to_required_str(value: Any, field_name: str, normalize: bool = False) -> str:
    if pd.isna(value):
        raise ValueError(f"{field_name} is null")
    text = str(value).strip()
    if not text:
        raise ValueError(f"{field_name} is empty")
    if normalize:
        return unicodedata.normalize("NFC", text)
    return text


def validate_required_columns(df: pd.DataFrame) -> None:
    missing = [col for col in REQUIRED_SOURCE_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Required columns missing in parquet: {missing}")


def validate_unique_keys(df: pd.DataFrame) -> None:
    dup_image_id = df["image_id"].duplicated().sum()
    if dup_image_id > 0:
        raise ValueError(f"Duplicate image_id found: {dup_image_id}")

    dup_rename_id = df["rename_id"].duplicated().sum()
    if dup_rename_id > 0:
        raise ValueError(f"Duplicate rename_id found: {dup_rename_id}")


def embedding_to_list(value: Any, expected_dim: int = 768) -> list[float]:
    if value is None:
        raise ValueError("embedding is null")

    if isinstance(value, np.ndarray):
        arr = value.astype(np.float64).tolist()
    elif isinstance(value, (list, tuple)):
        arr = [float(x) for x in value]
    else:
        raise TypeError(f"Unsupported embedding type: {type(value)}")

    if len(arr) != expected_dim:
        raise ValueError(f"embedding length {len(arr)} != expected {expected_dim}")

    for i, x in enumerate(arr):
        if not np.isfinite(x):
            raise ValueError(f"embedding contains non-finite value at index {i}: {x}")

    return arr


def embedding_to_pgvector_text(values: list[float]) -> str:
    return "[" + ",".join(f"{x:.10f}" for x in values) + "]"


def build_embeddings_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    validate_required_columns(df)
    validate_unique_keys(df)

    work = df[REQUIRED_SOURCE_COLUMNS].copy()

    work["image_id"] = work["image_id"].map(lambda x: to_required_int(x, "image_id"))
    work["rename_id"] = work["rename_id"].map(lambda x: to_required_int(x, "rename_id"))
    work["class_seq"] = work["class_seq"].map(lambda x: to_required_int(x, "class_seq"))

    work["class_name_raw"] = work["class_name"].map(
        lambda x: to_required_str(x, "class_name", normalize=False)
    )
    work["class_name_norm"] = work["class_name"].map(
        lambda x: to_required_str(x, "class_name", normalize=True)
    )

    work["relative_path"] = work["relative_path"].map(
        lambda x: to_required_str(x, "relative_path", normalize=False)
    )
    work["original_relative_path"] = work["original_relative_path"].map(
        lambda x: to_required_str(x, "original_relative_path", normalize=False)
    )
    work["model_name"] = work["model_name"].map(
        lambda x: to_required_str(x, "model_name", normalize=False)
    )

    # embedding_dim 컬럼은 DB 스키마에서 제거됐지만 파케이 값으로 사전 검증은 유지한다.
    # (embedding 배열 변환 시 expected_dim=768 으로도 검증되지만 여기서 조기에 잡는 편이 낫다)
    work["embedding_dim"] = work["embedding_dim"].map(
        lambda x: to_required_int(x, "embedding_dim")
    )
    bad_dim = work.loc[work["embedding_dim"] != 768]
    if not bad_dim.empty:
        raise ValueError(
            f"Found {len(bad_dim)} rows where embedding_dim != 768"
        )

    work["embedding"] = work["embedding"].map(
        lambda x: embedding_to_pgvector_text(embedding_to_list(x, expected_dim=768))
    )

    # embedding_dim 은 검증에만 사용하고 DB에는 쓰지 않는다 (schema.sql 참조)
    return work[
        [
            "image_id",
            "rename_id",
            "class_seq",
            "class_name_raw",
            "class_name_norm",
            "relative_path",
            "original_relative_path",
            "model_name",
            "embedding",
        ]
    ].copy()


def fetch_food_id_map(conn: psycopg.Connection) -> dict[str, int]:
    """
    vision_foods 테이블에서 food_name_norm → food_id 매핑을 반환한다.
    load_foods.py 가 먼저 실행되어 있어야 한다.
    """
    with conn.cursor() as cur:
        cur.execute("SELECT food_name_norm, food_id FROM vision_foods;")
        rows = cur.fetchall()

    if not rows:
        raise RuntimeError(
            "vision_foods table is empty. "
            "Run scripts/load_foods.py before load_embeddings.py."
        )

    return {row[0]: int(row[1]) for row in rows}


def attach_food_ids(
    df: pd.DataFrame,
    food_id_map: dict[str, int],
) -> pd.DataFrame:
    """
    각 행의 class_name_norm 을 food_id 로 변환해 food_id 컬럼을 추가한다.
    vision_foods 에 없는 class_name_norm 이 있으면 적재를 중단한다.

    이 검사 덕분에 DB의 FK 제약이 위반되기 전에 사람이 알아볼 수 있는
    에러 메시지로 실패한다.
    """
    df = df.copy()
    df["food_id"] = df["class_name_norm"].map(food_id_map)

    missing_mask = df["food_id"].isna()
    if missing_mask.any():
        missing_names = df.loc[missing_mask, "class_name_norm"].unique().tolist()
        sample = "\n".join(f"  - {name}" for name in missing_names[:20])
        suffix = "\n  ..." if len(missing_names) > 20 else ""
        raise ValueError(
            f"{len(missing_names)} class_name_norm value(s) have no matching entry "
            f"in vision_foods:\n{sample}{suffix}\n\n"
            "Check that load_foods.py was run with the same food list, "
            "and that normalization (NFC) is consistent between both scripts."
        )

    df["food_id"] = df["food_id"].astype(int)
    return df


def ensure_target_table_exists(conn: psycopg.Connection) -> None:
    query = """
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'image_embeddings'
    );
    """
    with conn.cursor() as cur:
        cur.execute(query)
        row = cur.fetchone()

    if not row or not row[0]:
        raise RuntimeError(
            "image_embeddings table does not exist. Run scripts/init_db.py --schema-only first."
        )


def count_rows(conn: psycopg.Connection) -> int:
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM image_embeddings;")
        row = cur.fetchone()
    return int(row[0]) if row else 0


def chunked_records(records: list[dict[str, Any]], batch_size: int):
    for i in range(0, len(records), batch_size):
        yield records[i : i + batch_size]


def main() -> None:
    args = parse_args()

    logging.basicConfig(
        level=logging.INFO if args.verbose else logging.WARNING,
        format="%(asctime)s | %(levelname)s | %(message)s",
    )

    if not args.db_url:
        raise ValueError(
            "DATABASE_URL is not set. Pass --db-url or set env DATABASE_URL."
        )

    parquet_path = Path(args.parquet_path)
    if not parquet_path.exists():
        raise FileNotFoundError(f"Parquet file not found: {parquet_path}")

    logging.info("Reading parquet: %s", parquet_path)
    df = pd.read_parquet(parquet_path)

    logging.info("Building validated dataframe for image_embeddings ...")
    embeddings_df = build_embeddings_dataframe(df)

    with psycopg.connect(args.db_url) as conn:
        ensure_target_table_exists(conn)

        # vision_foods 에서 food_id 매핑을 가져와 각 행에 붙인다.
        # 매칭 안 되는 class 가 있으면 여기서 명확한 에러로 중단된다.
        logging.info("Fetching food_id mapping from vision_foods ...")
        food_id_map = fetch_food_id_map(conn)
        embeddings_df = attach_food_ids(embeddings_df, food_id_map)
        logging.info("food_id mapping OK. %d unique foods matched.", len(food_id_map))

        records = embeddings_df.to_dict(orient="records")
        logging.info("Prepared %d rows for upsert into image_embeddings.", len(records))

        before_count = count_rows(conn)

        with conn.cursor() as cur:
            for batch_idx, batch in enumerate(
                chunked_records(records, args.batch_size), start=1
            ):
                cur.executemany(UPSERT_SQL, batch)
                logging.info(
                    "Upserted batch %d (%d rows)", batch_idx, len(batch)
                )

        after_count = count_rows(conn)

    print("[DONE] image_embeddings upsert complete")
    print(f"parquet rows prepared  : {len(records)}")
    print(f"rows before in table   : {before_count}")
    print(f"rows after in table    : {after_count}")


if __name__ == "__main__":
    main()
