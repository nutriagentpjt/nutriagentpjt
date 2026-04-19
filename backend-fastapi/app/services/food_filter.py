from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.food import Food
from app.schemas.enums import Disease

# 식사로 부적합한 카테고리 (음료, 조미료, 빙과류, 보충제 등)
_EXCLUDED_CATEGORIES: frozenset[str] = frozenset([
    "음료류",
    "음료 및 차류",
    "빙과류",
    "조미식품",
    "장류",
    "잼류",
    "당류",
    "식용유지류",
    "특수영양식품",
    "특수의료용도식품",
    "코코아가공품류 또는 초콜릿류",
])

# 이름에 포함되면 보충제/가공품으로 판단해 제외하는 키워드
_SUPPLEMENT_KEYWORDS: tuple[str, ...] = (
    "효소 정", "발효효소 정", "캡슐", "정제", "알약", "분말", "농축액",
)


async def fetch_and_filter_foods(
    db: AsyncSession,
    diseases: list[Disease],
    allergies: list[str],
    disliked_foods: list[str],
) -> list[Food]:
    """foods 전체 조회 후 하드 필터 적용"""
    result = await db.execute(select(Food))
    all_foods = list(result.scalars().all())

    has_allergy = Disease.ALLERGY in diseases

    filtered: list[Food] = []
    for food in all_foods:
        # 이름이 없는 음식은 제외
        if not food.name:
            continue

        # 비식사 카테고리 제외
        if food.category in _EXCLUDED_CATEGORIES:
            continue

        # 보충제/정제류 이름 패턴 제외
        if any(kw in food.name for kw in _SUPPLEMENT_KEYWORDS):
            continue

        # 알레르기: 키워드 매칭
        if has_allergy and allergies:
            if _matches_any_keyword(food.name, allergies):
                continue

        # 비선호 음식 제외
        if disliked_foods:
            if _matches_any_keyword(food.name, disliked_foods):
                continue

        filtered.append(food)

    return filtered


def _matches_any_keyword(food_name: str | None, keywords: list[str]) -> bool:
    if not food_name:
        return False
    for keyword in keywords:
        if keyword in food_name:
            return True
    return False
