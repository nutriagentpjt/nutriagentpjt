from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.chatbot.tools.base import BaseTool
from app.models.feedback import UserFoodFeedback


class SaveFeedbackTool(BaseTool):
    name = "save_feedback"
    description = (
        "사용자가 추천받은 음식에 대해 좋아요/싫어요 등의 피드백을 남길 때 사용합니다. "
        "사용자가 '이 음식 좋아', '별로야', '저장해줘' 같은 반응을 보일 때 호출하세요."
    )
    input_schema = {
        "type": "object",
        "properties": {
            "food_id": {
                "type": "integer",
                "description": "피드백 대상 음식 ID",
            },
            "feedback_type": {
                "type": "string",
                "enum": ["like", "dislike", "saved", "ignored"],
                "description": "피드백 종류",
            },
        },
        "required": ["food_id", "feedback_type"],
    }

    async def execute(self, params: dict, context: dict) -> Any:
        db: AsyncSession = context["db"]
        fb = UserFoodFeedback(
            guest_id=context["guest_id"],
            food_id=params["food_id"],
            feedback_type=params["feedback_type"],
        )
        db.add(fb)
        return {"status": "ok", "message": "피드백이 저장되었습니다."}
