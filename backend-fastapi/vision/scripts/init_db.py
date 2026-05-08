import argparse
import logging
import os
from pathlib import Path

import psycopg


VECTOR_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_image_embeddings_embedding_hnsw_cosine
    ON image_embeddings
    USING hnsw (embedding vector_cosine_ops);
"""


def read_sql_file(sql_path: Path) -> str:
    if not sql_path.exists():
        raise FileNotFoundError(f"SQL file not found: {sql_path}")
    return sql_path.read_text(encoding="utf-8")


def execute_sql(conn: psycopg.Connection, sql_text: str) -> None:
    with conn.cursor() as cur:
        cur.execute(sql_text)


def vector_index_exists(conn: psycopg.Connection) -> bool:
    query = """
    SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'idx_image_embeddings_embedding_hnsw_cosine'
    );
    """
    with conn.cursor() as cur:
        cur.execute(query)
        row = cur.fetchone()
    return bool(row and row[0])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Initialize NutriAgent Vision Retrieval database schema."
    )
    parser.add_argument(
        "--db-url",
        default=os.getenv("DATABASE_URL"),
        help="PostgreSQL connection URL. Defaults to env DATABASE_URL.",
    )
    parser.add_argument(
        "--schema-file",
        default=str(Path(__file__).resolve().parents[1] / "sql" / "schema.sql"),
        help="Path to schema.sql",
    )
    parser.add_argument(
        "--schema-only",
        action="store_true",
        help="Create extension/tables/basic indexes only.",
    )
    parser.add_argument(
        "--create-vector-index",
        action="store_true",
        help="Create HNSW vector index after data loading.",
    )
    parser.add_argument(
        "--force-vector-index",
        action="store_true",
        help="Drop and recreate the vector index if it already exists.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging.",
    )
    return parser.parse_args()


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

    schema_file = Path(args.schema_file)
    schema_sql = read_sql_file(schema_file)

    with psycopg.connect(args.db_url) as conn:
        logging.info("Connected to database.")

        # CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS 로 구성되어
        # 멱등하므로 스키마 존재 여부와 무관하게 항상 실행한다.
        logging.info("Applying schema.sql ...")
        execute_sql(conn, schema_sql)
        logging.info("Schema applied successfully (idempotent).")

        if args.schema_only:
            logging.info("Schema-only mode complete.")
            print("[DONE] Schema created.")
            print()
            print("Next steps (run in order):")
            print("  1. python scripts/load_foods.py --db-url <URL> --verbose")
            print("  2. python scripts/load_embeddings.py --db-url <URL> --verbose")
            print("  3. python scripts/init_db.py --create-vector-index --db-url <URL>")
            print()
            print("WARNING: Step 3 is required for fast vector search.")
            print("         Without the HNSW index, every query is a full table scan.")
            return

        if args.create_vector_index:
            if args.force_vector_index:
                logging.info("Dropping existing vector index if present ...")
                execute_sql(
                    conn,
                    "DROP INDEX IF EXISTS idx_image_embeddings_embedding_hnsw_cosine;",
                )

            if vector_index_exists(conn) and not args.force_vector_index:
                logging.info("Vector index already exists. Skipping.")
            else:
                logging.info("Creating HNSW vector index ...")
                execute_sql(conn, VECTOR_INDEX_SQL)
                logging.info("Vector index created successfully.")


if __name__ == "__main__":
    main()