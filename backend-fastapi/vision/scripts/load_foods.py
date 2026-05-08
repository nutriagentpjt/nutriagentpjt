import argparse
import logging
import os
import unicodedata
from pathlib import Path
from typing import Any

import pandas as pd
import psycopg


COLUMN_MAP = {
    "식품명": "food_name_raw",
    "영양성분함량기준량": "serving_basis",
    "에너지(kcal)": "calories_kcal",
    "단백질(g)": "protein_g",
    "지방(g)": "fat_g",
    "탄수화물(g)": "carbs_g",
    "당류(g)": "sugars_g",
    "식이섬유(g)": "fiber_g",
    "나트륨(mg)": "sodium_mg",
    "칼륨(mg)": "potassium_mg",
    "콜레스테롤(mg)": "cholesterol_mg",
    "포화지방산(g)": "sat_fat_g",
    "카페인(mg)": "caffeine_mg",
}

TARGET_COLUMNS = [
    "food_name_raw",
    "food_name_norm",
    "serving_basis",
    "calories_kcal",
    "protein_g",
    "fat_g",
    "carbs_g",
    "sugars_g",
    "fiber_g",
    "sodium_mg",
    "potassium_mg",
    "cholesterol_mg",
    "sat_fat_g",
    "caffeine_mg",
]

UPSERT_SQL = """
INSERT INTO vision_foods (
    food_name_raw,
    food_name_norm,
    serving_basis,
    calories_kcal,
    protein_g,
    fat_g,
    carbs_g,
    sugars_g,
    fiber_g,
    sodium_mg,
    potassium_mg,
    cholesterol_mg,
    sat_fat_g,
    caffeine_mg
)
VALUES (
    %(food_name_raw)s,
    %(food_name_norm)s,
    %(serving_basis)s,
    %(calories_kcal)s,
    %(protein_g)s,
    %(fat_g)s,
    %(carbs_g)s,
    %(sugars_g)s,
    %(fiber_g)s,
    %(sodium_mg)s,
    %(potassium_mg)s,
    %(cholesterol_mg)s,
    %(sat_fat_g)s,
    %(caffeine_mg)s
)
ON CONFLICT (food_name_norm)
DO UPDATE SET
    food_name_raw = EXCLUDED.food_name_raw,
    serving_basis = EXCLUDED.serving_basis,
    calories_kcal = EXCLUDED.calories_kcal,
    protein_g = EXCLUDED.protein_g,
    fat_g = EXCLUDED.fat_g,
    carbs_g = EXCLUDED.carbs_g,
    sugars_g = EXCLUDED.sugars_g,
    fiber_g = EXCLUDED.fiber_g,
    sodium_mg = EXCLUDED.sodium_mg,
    potassium_mg = EXCLUDED.potassium_mg,
    cholesterol_mg = EXCLUDED.cholesterol_mg,
    sat_fat_g = EXCLUDED.sat_fat_g,
    caffeine_mg = EXCLUDED.caffeine_mg;
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Load merged_food_db_keyword_avg.csv into vision_foods."
    )
    parser.add_argument(
        "--db-url",
        default=os.getenv("DATABASE_URL"),
        help="PostgreSQL connection URL. Defaults to env DATABASE_URL.",
    )
    parser.add_argument(
        "--csv-path",
        default=str(
            Path(__file__).resolve().parents[1]
            / "data"
            / "merged_food_db_keyword_avg.csv"
        ),
        help="Path to merged_food_db_keyword_avg.csv",
    )
    parser.add_argument(
        "--encoding",
        default="utf-8-sig",
        help="CSV encoding. Default: utf-8-sig",
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


def to_nullable_float(value: Any) -> float | None:
    if pd.isna(value):
        return None
    if isinstance(value, str):
        stripped = value.strip()
        if stripped == "":
            return None
        value = stripped.replace(",", "")
    return float(value)


def validate_required_columns(df: pd.DataFrame) -> None:
    missing = [col for col in COLUMN_MAP.keys() if col not in df.columns]
    if missing:
        raise ValueError(f"Required columns missing in CSV: {missing}")


def build_foods_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    validate_required_columns(df)

    work = df[list(COLUMN_MAP.keys())].copy()
    work = work.rename(columns=COLUMN_MAP)

    work["food_name_raw"] = work["food_name_raw"].map(normalize_text)
    # food_name_norm: load_embeddings.py의 class_name_norm 과 매칭되는 키.
    # 현재는 raw와 동일(NFC + strip)하며, 향후 추가 정규화 시 이 컬럼만 수정한다.
    work["food_name_norm"] = work["food_name_raw"].copy()

    numeric_cols = [col for col in TARGET_COLUMNS if col not in ("food_name_raw", "food_name_norm")]
    for col in numeric_cols:
        work[col] = work[col].map(to_nullable_float)

    work = work[TARGET_COLUMNS].copy()
    work = work.dropna(subset=["food_name_raw", "food_name_norm"])

    duplicated = work["food_name_norm"].duplicated(keep=False)
    if duplicated.any():
        dup_names = sorted(work.loc[duplicated, "food_name_norm"].unique().tolist())
        raise ValueError(
            f"Duplicate normalized food names found in CSV: {dup_names[:20]}"
            + (" ..." if len(dup_names) > 20 else "")
        )

    return work


def ensure_target_table_exists(conn: psycopg.Connection) -> None:
    query = """
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'vision_foods'
    );
    """
    with conn.cursor() as cur:
        cur.execute(query)
        row = cur.fetchone()

    if not row or not row[0]:
        raise RuntimeError(
            "vision_foods table does not exist. Run scripts/init_db.py --schema-only first."
        )


def count_rows(conn: psycopg.Connection) -> int:
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM vision_foods;")
        row = cur.fetchone()
    return int(row[0]) if row else 0


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

    csv_path = Path(args.csv_path)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    logging.info("Reading CSV: %s", csv_path)
    df = pd.read_csv(csv_path, encoding=args.encoding)

    foods_df = build_foods_dataframe(df)
    records = foods_df.to_dict(orient="records")

    logging.info("Prepared %d rows for upsert into vision_foods.", len(records))

    with psycopg.connect(args.db_url) as conn:
        ensure_target_table_exists(conn)

        before_count = count_rows(conn)

        with conn.cursor() as cur:
            cur.executemany(UPSERT_SQL, records)

        after_count = count_rows(conn)

    print(f"[DONE] vision_foods upsert complete")
    print(f"csv rows prepared      : {len(records)}")
    print(f"rows before in table   : {before_count}")
    print(f"rows after in table    : {after_count}")


if __name__ == "__main__":
    main()