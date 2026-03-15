from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.food import Food
from app.schemas.enums import Disease


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


def _matches_any_keyword(food_name: str, keywords: list[str]) -> bool:
    for keyword in keywords:
        if keyword in food_name:
            return True
    return False
