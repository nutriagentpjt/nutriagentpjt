"""DB에서 유저 프로필·식이선호·오늘 식사 기록을 로딩한다."""

from dataclasses import dataclass, field
from datetime import date

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.enums import (
    ActivityLevel,
    Disease,
    Gender,
    HealthGoal,
    MealPattern,
    MealType,
)
from app.services.nutrition_calculator import NutrientTarget


@dataclass
class UserContext:
    """추천 파이프라인에 필요한 유저 정보 (DB 조회 결과)"""

    guest_id: str
    age: int
    gender: Gender
    height: float
    weight: float
    health_goal: HealthGoal
    activity_level: ActivityLevel
    meal_pattern: MealPattern
    preferred_foods: list[str] = field(default_factory=list)
    disliked_foods: list[str] = field(default_factory=list)
    diseases: list[Disease] = field(default_factory=list)
    allergies: list[str] = field(default_factory=list)
    already_eaten: NutrientTarget | None = None


class UserNotFoundError(Exception):
    pass


async def load_user_context(
    db: AsyncSession,
    guest_id: str,
    meal_type: MealType,
) -> UserContext:
    """guest_id로 DB에서 유저 컨텍스트 전체를 로딩한다."""

    # 1) users + user_profiles + dietary_preferences 조인 조회
    row = (
        await db.execute(
            text("""
                SELECT
                    u.id            AS user_id,
                    u.guest_id,
                    up.age,
                    up.gender,
                    up.height,
                    up.weight,
                    up.health_goal,
                    up.activity_level,
                    up.diseases,
                    dp.meal_pattern,
                    dp.preferred_foods,
                    dp.disliked_foods,
                    dp.allergies
                FROM users u
                JOIN user_profiles up ON up.user_id = u.id
                JOIN dietary_preferences dp ON dp.user_id = u.id
                WHERE u.guest_id = :guest_id
            """),
            {"guest_id": guest_id},
        )
    ).mappings().first()

    if row is None:
        raise UserNotFoundError(f"guest_id={guest_id} 에 해당하는 유저를 찾을 수 없습니다")

    # 2) 오늘 해당 끼니에 이미 먹은 영양소 합산
    eaten_row = (
        await db.execute(
            text("""
                SELECT
                    COALESCE(SUM(m.calories), 0) AS calories,
                    COALESCE(SUM(m.protein), 0)  AS protein,
                    COALESCE(SUM(m.carbs), 0)    AS carbs,
                    COALESCE(SUM(m.fat), 0)      AS fat
                FROM meals m
                WHERE m.user_id = :user_id
                  AND m.date = :today
                  AND m.meal_type = :meal_type
            """),
            {
                "user_id": row["user_id"],
                "today": date.today(),
                "meal_type": meal_type.value,
            },
        )
    ).mappings().first()

    # 3) JSON 필드 파싱
    diseases = _parse_diseases(row["diseases"])
    preferred_foods = _parse_string_list(row["preferred_foods"])
    disliked_foods = _parse_disliked_foods(row["disliked_foods"])
    allergies = _parse_string_list(row["allergies"])

    already_eaten = NutrientTarget(
        calories=eaten_row["calories"],
        protein=eaten_row["protein"],
        carbs=eaten_row["carbs"],
        fat=eaten_row["fat"],
    ) if eaten_row else NutrientTarget(0, 0, 0, 0)

    return UserContext(
        guest_id=guest_id,
        age=row["age"],
        gender=Gender(row["gender"]),
        height=row["height"],
        weight=row["weight"],
        health_goal=HealthGoal(row["health_goal"]),
        activity_level=ActivityLevel(row["activity_level"]),
        meal_pattern=MealPattern(row["meal_pattern"]),
        preferred_foods=preferred_foods,
        disliked_foods=disliked_foods,
        diseases=diseases,
        allergies=allergies,
        already_eaten=already_eaten,
    )


def _parse_diseases(raw: list | None) -> list[Disease]:
    if not raw:
        return []
    result = []
    for item in raw:
        try:
            result.append(Disease(item))
        except ValueError:
            continue
    return result


def _parse_string_list(raw: list | None) -> list[str]:
    if not raw:
        return []
    return [str(item) for item in raw]


def _parse_disliked_foods(raw: list | None) -> list[str]:
    """disliked_foods는 {"reason": "...", "foodName": "..."} 객체 배열."""
    if not raw:
        return []
    result = []
    for item in raw:
        if isinstance(item, dict) and "foodName" in item:
            result.append(item["foodName"])
        elif isinstance(item, str):
            result.append(item)
    return result
