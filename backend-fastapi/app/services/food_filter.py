from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.food import Food, FoodProfile
from app.schemas.enums import Disease
from app.services.nutrition_calculator import DailyNutritionPlan, NutrientTarget

# 식사로 부적합한 카테고리 (음료, 조미료, 빙과류, 보충제, 원재료 등) — single 모드 전용
_EXCLUDED_CATEGORIES: frozenset[str] = frozenset([
    # 음료·조미·빙과
    "음료류", "음료 및 차류", "빙과류", "조미식품",
    "장류", "잼류", "당류", "식용유지류",
    "특수영양식품", "특수의료용도식품",
    "코코아가공품류 또는 초콜릿류",
    # 원재료·건조식품 (추천 부적합 — 식사 기록 검색 전용)
    "곡류 및 그 제품", "곡류·서류 제품",
    "육류 및 그 제품", "수·조·어·육류", "동물성가공식품류",
    "두류", "두류·견과 및 종실류",
    "견과류 및 종실류",
    "해조류", "채소·해조류",
    "버섯류",
    "난류",
    "감자류 및 전분류",
    "조미료류", "장류·양념류", "유지류",
])

# 이름에 포함되면 원재료·보충제로 판단해 제외하는 키워드
_SUPPLEMENT_KEYWORDS: tuple[str, ...] = (
    "효소 정", "발효효소 정", "캡슐", "정제", "알약", "분말", "농축액",
    ", 말린것", ", 건조", ", 생것", ", 날것",
)


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

    # single 모드에서 단품으로 부적합한 역할 제외 (반찬·김치는 밥과 함께 먹는 용도)
    _SINGLE_EXCLUDED_ROLES = frozenset({"SIDE", "KIMCHI", "SEASONING", "BEVERAGE", "RAW"})

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
