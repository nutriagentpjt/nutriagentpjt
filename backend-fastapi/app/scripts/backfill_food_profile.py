"""
백필 스크립트: recommandable=1인 한식 메뉴에 dish_role / food_group 할당.

실행:
    cd backend-fastapi
    uv run python -m app.scripts.backfill_food_profile

멱등성: INSERT ... ON CONFLICT (food_id) DO UPDATE
"""

import asyncio
import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# category → (dish_role, food_group)
# 매핑에 없는 카테고리는 (NULL, NULL) 로 기록
_CATEGORY_MAP: dict[str, tuple[str | None, str | None]] = {
    # 밥 / 곡류
    "밥류":                    ("RICE",     "GRAINS"),
    "죽 및 스프류":             ("ONE_DISH", "GRAINS"),
    "면 및 만두류":             ("ONE_DISH", "GRAINS"),
    "빵 및 과자류":             ("SNACK",    "GRAINS"),
    "곡류 및 그 제품":          ("RAW",      "GRAINS"),
    "곡류·서류 제품":           ("RAW",      "GRAINS"),
    "감자류 및 전분류":         ("RAW",      "GRAINS"),

    # 국 / 탕 / 찌개
    "국 및 탕류":               ("SOUP",     "VEGETABLES"),
    "찌개 및 전골류":           ("SOUP",     "VEGETABLES"),

    # 주반찬
    "구이류":                   ("MAIN",     "MEAT_FISH_EGG_BEAN"),
    "찜류":                     ("MAIN",     "MEAT_FISH_EGG_BEAN"),
    "볶음류":                   ("MAIN",     "MEAT_FISH_EGG_BEAN"),
    "전·적 및 부침류":          ("MAIN",     "MEAT_FISH_EGG_BEAN"),
    "조리가공식품류":            ("MAIN",     "MEAT_FISH_EGG_BEAN"),

    # 부반찬
    "조림류":                   ("SIDE",     "MEAT_FISH_EGG_BEAN"),
    "나물·숙채류":              ("SIDE",     "VEGETABLES"),
    "생채·무침류":              ("SIDE",     "VEGETABLES"),
    "장아찌·절임류":            ("SIDE",     "VEGETABLES"),
    "젓갈류":                   ("SIDE",     "MEAT_FISH_EGG_BEAN"),
    "튀김류":                   ("SIDE",     "MEAT_FISH_EGG_BEAN"),

    # 김치
    "김치류":                   ("KIMCHI",   "VEGETABLES"),

    # 원재료 (is_plate_candidate 역할 없음)
    "육류 및 그 제품":          ("RAW",      "MEAT_FISH_EGG_BEAN"),
    "수·조·어·육류":            ("RAW",      "MEAT_FISH_EGG_BEAN"),
    "동물성가공식품류":          ("RAW",      "MEAT_FISH_EGG_BEAN"),
    "두류":                     ("RAW",      "MEAT_FISH_EGG_BEAN"),
    "두류·견과 및 종실류":      ("RAW",      "MEAT_FISH_EGG_BEAN"),
    "난류":                     ("RAW",      "MEAT_FISH_EGG_BEAN"),
    "채소류":                   ("RAW",      "VEGETABLES"),
    "채소·해조류":              ("RAW",      "VEGETABLES"),
    "해조류":                   ("RAW",      "VEGETABLES"),
    "버섯류":                   ("RAW",      "VEGETABLES"),
    "과일류":                   ("RAW",      "FRUITS"),
    "견과류 및 종실류":         ("RAW",      "MEAT_FISH_EGG_BEAN"),

    # 유제품
    "우유 및 그 제품":          ("SNACK",    "DAIRY"),

    # 조미 / 유지
    "조미료류":                  ("SEASONING", "FATS_SUGARS"),
    "장류·양념류":               ("SEASONING", "FATS_SUGARS"),
    "유지류":                    ("SEASONING", "FATS_SUGARS"),

    # 음료
    "차류":                      ("BEVERAGE", None),
    "주류":                      ("BEVERAGE", None),
}


async def backfill(session: AsyncSession) -> None:
    result = await session.execute(
        text("SELECT id, category FROM foods WHERE recommandable = 1")
    )
    rows = result.fetchall()
    log.info("recommandable=1 대상: %d건", len(rows))

    upserted = 0
    skipped = 0
    for food_id, category in rows:
        dish_role, food_group = _CATEGORY_MAP.get(category or "", (None, None))
        if dish_role is None and food_group is None:
            skipped += 1

        await session.execute(
            text("""
                INSERT INTO food_profile (food_id, dish_role, food_group)
                VALUES (:food_id, :dish_role, :food_group)
                ON CONFLICT (food_id) DO UPDATE
                    SET dish_role  = EXCLUDED.dish_role,
                        food_group = EXCLUDED.food_group,
                        updated_at = now()
            """),
            {"food_id": food_id, "dish_role": dish_role, "food_group": food_group},
        )
        upserted += 1

    await session.commit()
    log.info("upsert 완료: %d건 (매핑 없음: %d건)", upserted, skipped)

    # 검증
    count = await session.execute(
        text("SELECT COUNT(*) FROM food_profile WHERE dish_role IS NOT NULL")
    )
    log.info("food_profile dish_role 채움 건수: %d", count.scalar())


async def main() -> None:
    db_url = (
        f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
        f"@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    )
    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        await backfill(session)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
