from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.chatbot.tools.base import BaseTool
from app.schemas.request import RecommendRequest
from app.services.recommendation import run_recommendation
from app.services.user_profile_loader import UserNotFoundError


class RecommendMealTool(BaseTool):
    name = "recommend_meal"
    description = (
        "사용자의 건강 목표와 현재 영양 상태에 맞는 식단을 추천합니다. "
        "사용자가 뭘 먹을지 고민하거나, 식단 추천을 요청하거나, "
        "특정 끼니(아침/점심/저녁/간식)에 대해 물어볼 때 사용하세요."
    )
    input_schema = {
        "type": "object",
        "properties": {
            "meal_type": {
                "type": "string",
                "enum": ["BREAKFAST", "LUNCH", "DINNER", "SNACK"],
                "description": "끼니 종류. 아침=BREAKFAST, 점심=LUNCH, 저녁=DINNER, 간식=SNACK",
            },
            "top_n": {
                "type": "integer",
                "description": "추천 음식 개수 (기본 5)",
                "default": 5,
            },
            "mode": {
                "type": "string",
                "enum": ["single", "set"],
                "description": "single=단품 추천, set=1식3찬 한식 세트 추천 (기본 set)",
                "default": "set",
            },
        },
        "required": ["meal_type"],
    }

    async def execute(self, params: dict, context: dict) -> Any:
        db: AsyncSession = context["db"]
        req = RecommendRequest(
            guest_id=context["guest_id"],
            meal_type=params["meal_type"],
            top_n=params.get("top_n", 5),
            mode=params.get("mode", "set"),
        )
        try:
            result = await run_recommendation(req, db)
            return result.model_dump(mode="json")
        except UserNotFoundError:
            return {"error": "사용자 프로필을 찾을 수 없습니다. 온보딩을 먼저 완료해주세요."}
