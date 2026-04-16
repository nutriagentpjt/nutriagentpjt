import argparse
import logging
import os
import unicodedata
import json
from pathlib import Path
from typing import Any, List

import numpy as np
import pandas as pd
import psycopg

# .env에서 차원 정보를 가져오되, 없으면 기본값 1280 사용
DEFAULT_DIM = int(os.getenv("EMBEDDING_DIM", "1280"))

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
    image_id, rename_id, class_seq, food_id, class_name_raw,
    class_name_norm, relative_path, original_relative_path,
    model_name, embedding
)
VALUES (
    %(image_id)s, %(rename_id)s, %(class_seq)s, %(food_id)s, %(class_name_raw)s,
    %(class_name_norm)s, %(relative_path)s, %(original_relative_path)s,
    %(model_name)s, %(embedding)s::vector
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
    parser = argparse.ArgumentParser(description="Load Hybrid embeddings into PostgreSQL.")
    parser.add_argument("--db-url", default=os.getenv("DATABASE_URL"), help="DB connection URL.")
    parser.add_argument(
        "--parquet-path",
        default=str(Path(__file__).resolve().parents[1] / "data" / "pgvector_export.parquet"),
        help="Path to the parquet file."
    )
    # 명령어로도 차원을 조절할 수 있게 추가함
    parser.add_argument("--expected-dim", type=int, default=DEFAULT_DIM, help=f"Default: {DEFAULT_DIM}")
    parser.add_argument("--batch-size", type=int, default=1000, help="Batch size for upsert.")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging.")
    return parser.parse_args()

def normalize_text(value: Any) -> str:
    if pd.isna(value): return ""
    return unicodedata.normalize("NFC", str(value).strip())

def embedding_to_list(value: Any, expected_dim: int) -> List[float]:
    if value is None:
        raise ValueError("embedding is null")
    
    if isinstance(value, np.ndarray):
        arr = value.astype(np.float64).tolist()
    elif isinstance(value, (list, tuple)):
        arr = [float(x) for x in value]
    elif isinstance(value, str): # JSON 문자열 형태 대비
        arr = json.loads(value)
    else:
        raise TypeError(f"Unsupported embedding type: {type(value)}")

    if len(arr) != expected_dim:
        raise ValueError(f"데이터 차원 불일치: {len(arr)} (기대값: {expected_dim})")
    
    return arr

def embedding_to_pgvector_text(values: List[float]) -> str:
    return "[" + ",".join(f"{x:.10f}" for x in values) + "]"

def build_embeddings_dataframe(df: pd.DataFrame, expected_dim: int) -> pd.DataFrame:
    work = pd.DataFrame()
    
    # ID 및 기본 정보 매핑
    work["image_id"] = df["id"].astype(int)
    work["rename_id"] = df["id"].astype(int)
    work["class_seq"] = 1

    work["class_name_raw"] = df["class_name"].map(str)
    work["class_name_norm"] = df["class_name"].map(normalize_text)

    # 경로 정보 (df에 'image_path' 컬럼이 있다고 가정)
    path_col = "image_path" if "image_path" in df.columns else "relative_path"
    work["relative_path"] = df[path_col].map(str)
    work["original_relative_path"] = df[path_col].map(str)
    
    work["model_name"] = "hybrid_dinov3_clip"

    # 차원 검증 및 변환
    work["embedding"] = df["embedding"].map(
        lambda x: embedding_to_pgvector_text(embedding_to_list(x, expected_dim))
    )

    return work

def fetch_food_id_map(conn) -> dict:
    with conn.cursor() as cur:
        cur.execute("SELECT food_name_norm, food_id FROM vision_foods;")
        rows = cur.fetchall()
    if not rows:
        raise RuntimeError("vision_foods 테이블이 비어있습니다. load_foods.py를 먼저 실행하세요.")
    return {row[0]: int(row[1]) for row in rows}

def main() -> None:
    args = parse_args()
    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING)

    if not args.db_url:
        raise ValueError("DATABASE_URL이 설정되지 않았습니다.")

    df = pd.read_parquet(args.parquet_path)
    
    # 수정: 차원 정보를 인자로 전달
    embeddings_df = build_embeddings_dataframe(df, args.expected_dim)

    with psycopg.connect(args.db_url) as conn:
        food_id_map = fetch_food_id_map(conn)
        embeddings_df["food_id"] = embeddings_df["class_name_norm"].map(food_id_map)
        
        # 매칭 안 되는 음식 체크
        if embeddings_df["food_id"].isna().any():
            missing = embeddings_df.loc[embeddings_df["food_id"].isna(), "class_name_norm"].unique()
            raise ValueError(f"DB에 없는 음식 이름 발견: {missing}")

        embeddings_df["food_id"] = embeddings_df["food_id"].astype(int)
        records = embeddings_df.to_dict(orient="records")

        before_count = 0
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM image_embeddings;")
            before_count = cur.fetchone()[0]
            
            for i in range(0, len(records), args.batch_size):
                batch = records[i : i + args.batch_size]
                cur.executemany(UPSERT_SQL, batch)
        
        conn.commit()
        
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM image_embeddings;")
            after_count = cur.fetchone()[0]

    print(f"[DONE] image_embeddings 적재 완료")
    print(f"차원 규격: {args.expected_dim}")
    print(f"이전 데이터 수: {before_count} -> 현재 데이터 수: {after_count}")

if __name__ == "__main__":
    main()