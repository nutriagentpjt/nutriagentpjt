import argparse
import logging
import os
import unicodedata
from pathlib import Path
from typing import Any

import pandas as pd
import psycopg

# CSV 헤더명 -> DB 컬럼명 매핑 (네가 올린 CSV 규격에 맞춤)
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
    parser = argparse.ArgumentParser(description="Load nutrition CSV into vision_foods.")
    parser.add_argument("--db-url", default=os.getenv("DATABASE_URL"), help="DB connection URL.")
    parser.add_argument(
        "--csv-path",
        default=str(Path(__file__).resolve().parents[1] / "data" / "vision_nutrition_148.csv"),
        help="Path to vision_nutrition_148.csv"
    )
    parser.add_argument("--encoding", default="utf-8-sig", help="CSV encoding.")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging.")
    return parser.parse_args()

def normalize_text(value: Any) -> str | None:
    if pd.isna(value): return None
    text = str(value).strip()
    if not text: return None
    return unicodedata.normalize("NFC", text)

def to_nullable_float(value: Any) -> float | None:
    if pd.isna(value): return None
    if isinstance(value, str):
        stripped = value.strip().replace(",", "")
        if stripped == "" or stripped == "-": return None
        try:
            return float(stripped)
        except ValueError:
            return None
    return float(value)

def build_foods_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    # CSV에 필요한 컬럼이 다 있는지 확인
    missing = [col for col in COLUMN_MAP.keys() if col not in df.columns]
    if missing:
        raise ValueError(f"CSV에 다음 컬럼이 없습니다: {missing}")

    work = df[list(COLUMN_MAP.keys())].copy()
    work = work.rename(columns=COLUMN_MAP)

    work["food_name_raw"] = work["food_name_raw"].map(normalize_text)
    work["food_name_norm"] = work["food_name_raw"].copy()

    numeric_cols = [col for col in TARGET_COLUMNS if col not in ("food_name_raw", "food_name_norm")]
    for col in numeric_cols:
        work[col] = work[col].map(to_nullable_float)

    work = work.dropna(subset=["food_name_raw", "food_name_norm"])
    
    if work["food_name_norm"].duplicated().any():
        dup_names = work.loc[work["food_name_norm"].duplicated(), "food_name_norm"].tolist()
        logging.warning(f"중복된 음식 이름 발견(무시됨): {dup_names}")
        work = work.drop_duplicates(subset=["food_name_norm"])

    return work[TARGET_COLUMNS]

def main() -> None:
    args = parse_args()
    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING)

    if not args.db_url:
        raise ValueError("DATABASE_URL이 설정되지 않았습니다.")

    csv_path = Path(args.csv_path)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV 파일을 찾을 수 없음: {csv_path}")

    df = pd.read_csv(csv_path, encoding=args.encoding)
    foods_df = build_foods_dataframe(df)
    records = foods_df.to_dict(orient="records")

    with psycopg.connect(args.db_url) as conn:
        with conn.cursor() as cur:
            cur.executemany(UPSERT_SQL, records)
        conn.commit()

    print(f"[DONE] vision_foods 적재 완료: {len(records)}개 행")

if __name__ == "__main__":
    main()