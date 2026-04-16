from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Any, Generator, Iterable

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.config import settings

logger = logging.getLogger(__name__)


class DatabaseError(RuntimeError):
    """Custom database error for app-level handling."""


_pool: ConnectionPool | None = None


def init_pool() -> None:
    """
    Initialize the connection pool at app startup.
    Must be called once before any DB operations (e.g. in FastAPI lifespan).

    DATABASE_URL 은 pydantic-settings Field(min_length=1) 로 보장되므로
    빈값 체크는 별도로 하지 않는다.
    """
    global _pool

    # 검증 전까지는 로컬 변수에 보관한다.
    # open=True 는 백그라운드 스레드를 즉시 시작하므로, 연결 실패 시
    # close() 를 호출해 스레드를 정리해야 에러 로그 스팸이 멈춘다.
    candidate = ConnectionPool(
        settings.DATABASE_URL,
        min_size=settings.DB_POOL_MIN_SIZE,
        max_size=settings.DB_POOL_MAX_SIZE,
        # autocommit=True: 읽기 전용 SELECT에 불필요한 BEGIN/COMMIT 제거
        # 벡터 검색처럼 빈번한 read-only 쿼리의 트랜잭션 오버헤드를 줄인다.
        kwargs={"row_factory": dict_row, "autocommit": True},
        open=True,
    )

    try:
        with candidate.connection() as conn:
            conn.execute("SELECT 1")
    except Exception as e:
        candidate.close()  # 백그라운드 재연결 스레드 정리
        raise DatabaseError(
            f"DB connectivity check failed. Check DATABASE_URL and DB status: {e}"
        ) from e

    _pool = candidate

    logger.info(
        "DB connection pool initialized. min_size=%d, max_size=%d",
        settings.DB_POOL_MIN_SIZE,
        settings.DB_POOL_MAX_SIZE,
    )


def close_pool() -> None:
    """Close the connection pool at app shutdown."""
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


def _get_pool() -> ConnectionPool:
    if _pool is None:
        raise DatabaseError(
            "Connection pool is not initialized. "
            "Call init_pool() before making DB calls."
        )
    return _pool


@contextmanager
def get_connection() -> Generator[psycopg.Connection, None, None]:
    """
    Acquire a connection from the pool.
    Returns the connection to the pool on exit (success or exception).
    """
    try:
        with _get_pool().connection() as conn:
            yield conn
    except DatabaseError:
        raise
    except Exception as e:
        raise DatabaseError(f"Database connection/query failed: {e}") from e


def fetch_all(
    query: str, params: dict[str, Any] | tuple[Any, ...] | None = None
) -> list[dict[str, Any]]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            rows = cur.fetchall()
    return list(rows)


def fetch_one(
    query: str, params: dict[str, Any] | tuple[Any, ...] | None = None
) -> dict[str, Any] | None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            row = cur.fetchone()
    return row


def execute(
    query: str, params: dict[str, Any] | tuple[Any, ...] | None = None
) -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)


def executemany(
    query: str, seq_of_params: Iterable[dict[str, Any] | tuple[Any, ...]]
) -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.executemany(query, seq_of_params)
