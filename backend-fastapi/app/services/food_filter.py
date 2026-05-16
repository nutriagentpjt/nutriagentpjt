from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.food import Food
from app.schemas.enums import Disease
from app.services.nutrition_calculator import DailyNutritionPlan, NutrientTarget

# single 모드에서 단품으로 부적합한 역할 (반찬·김치는 밥과 함께 먹는 용도)
_SINGLE_EXCLUDED_ROLES: frozenset[str] = frozenset({"SIDE", "KIMCHI", "SEASONING", "BEVERAGE", "RAW"})


async def fetch_and_filter_foods(
    db: AsyncSession,
    diseases: list[Disease],
    allergies: list[str],
    disliked_foods: list[str],
    mode: str = "single",
    meal_target: NutrientTarget | None = None,
    daily_plan: DailyNutritionPlan | None = None,
) -> list[Food]:
    """foods 조회 후 하드 필터 적용.

    mode="set"  : recommandable=1인 한식 메뉴만 조회 (food_profile joinedload 포함)
    mode="single": 기존 카테고리 블랙리스트 필터 적용
    """
    # 추천 파이프라인은 항상 recommandable=1(한식 조리 메뉴)만 사용
    # dish_role 필터링을 위해 항상 food_profile joinedload
    query = select(Food).where(Food.recommandable == 1).options(joinedload(Food.profile))
    result = await db.execute(query)
    all_foods = list(result.scalars().all())

    has_allergy = Disease.ALLERGY in diseases
    has_hypertension = Disease.HYPERTENSION in diseases
    has_gout = Disease.GOUT in diseases
    has_kidney = Disease.KIDNEY_DISEASE in diseases

    meal_cal_limit = (meal_target.calories * 1.8) if meal_target else None
    # 고혈압: 끼니 Na 한도 1.2배 / 신장: 0.8배 (더 엄격)
    if has_kidney and daily_plan:
        meal_na_limit = daily_plan.sodium_mg_max / 3 * 0.8
    elif daily_plan:
        meal_na_limit = daily_plan.sodium_mg_max / 3 * 1.2
    else:
        meal_na_limit = None

    filtered: list[Food] = []
    for food in all_foods:
        if not food.name:
            continue

        # single 모드: 반찬·김치·양념 역할은 단품 추천에서 제외
        if mode == "single":
            profile = getattr(food, "profile", None)
            if profile and profile.dish_role in _SINGLE_EXCLUDED_ROLES:
                continue

        if has_allergy and allergies:
            if _matches_any_keyword(food.name, allergies):
                continue

        if disliked_foods:
            if _matches_any_keyword(food.name, disliked_foods):
                continue

        # 동적 하드 컷: 끼니 칼로리 1.8배 초과 (ONE_DISH 제외)
        if meal_cal_limit and (food.calories or 0) > meal_cal_limit:
            profile = getattr(food, "profile", None)
            if not (profile and profile.dish_role == "ONE_DISH"):
                continue

        # HYPERTENSION / KIDNEY_DISEASE: 단품 모드만 개별 Na 하드컷
        # set 모드는 plate 합산으로 체크 (_plate_objective)
        if mode == "single" and (has_hypertension or has_kidney) and meal_na_limit and (food.sodium or 0) > meal_na_limit:
            continue

        # GOUT: 퓨린 정량 데이터 200mg 초과
        if has_gout:
            profile = getattr(food, "profile", None)
            if profile and profile.purine_mg and profile.purine_mg > 200:
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
