from typing import Any

import httpx

from app.chatbot.tools.base import BaseTool
from app.core.config import settings


SPRING_BASE_URL = settings.SPRING_BASE_URL


class GetOnboardingTool(BaseTool):
    name = "get_onboarding"
    description = (
        "사용자의 온보딩 정보(나이, 성별, 키, 몸무게, 건강 목표, 질병, 알레르기 등)를 조회합니다. "
        "사용자의 프로필이나 건강 정보를 확인해야 할 때 사용하세요."
    )
    input_schema = {
        "type": "object",
        "properties": {},
        "required": [],
    }

    async def execute(self, params: dict, context: dict) -> Any:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{SPRING_BASE_URL}/onboarding",
                    cookies={"JSESSIONID": context.get("jsessionid", "")},
                    headers={"X-Guest-Id": context["guest_id"]},
                    timeout=10.0,
                )
                if resp.status_code == 200:
                    return resp.json()
                return {"error": f"온보딩 정보 조회 실패 (status={resp.status_code})"}
        except httpx.TimeoutException:
            return {"error": "온보딩 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요."}
        except httpx.ConnectError:
            return {"error": "온보딩 서버에 연결할 수 없습니다. 서버 상태를 확인해주세요."}


class UpdateOnboardingTool(BaseTool):
    name = "update_onboarding"
    description = (
        "사용자의 온보딩 정보를 업데이트합니다. "
        "사용자가 몸무게 변경, 건강 목표 수정, 알레르기 추가 등을 요청할 때 사용하세요."
    )
    input_schema = {
        "type": "object",
        "properties": {
            "age": {"type": "integer", "description": "나이"},
            "gender": {"type": "string", "enum": ["MALE", "FEMALE"], "description": "성별"},
            "height": {"type": "number", "description": "키 (cm)"},
            "weight": {"type": "number", "description": "몸무게 (kg)"},
            "healthGoal": {
                "type": "string",
                "enum": ["DIET", "BULK_UP", "LEAN_MASS_UP", "MAINTAIN", "GENERAL_HEALTH"],
                "description": "건강 목표",
            },
            "activityLevel": {
                "type": "string",
                "enum": ["SEDENTARY", "LIGHTLY_ACTIVE", "MODERATELY_ACTIVE", "VERY_ACTIVE"],
                "description": "활동 수준",
            },
            "diseases": {
                "type": "array",
                "items": {"type": "string"},
                "description": "질병 목록",
            },
            "preferredFoods": {
                "type": "array",
                "items": {"type": "string"},
                "description": "선호 음식 목록",
            },
            "dislikedFoods": {
                "type": "array",
                "items": {"type": "string"},
                "description": "비선호 음식 목록",
            },
        },
        "required": [],
    }

    async def execute(self, params: dict, context: dict) -> Any:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{SPRING_BASE_URL}/onboarding",
                    json=params,
                    cookies={"JSESSIONID": context.get("jsessionid", "")},
                    headers={"X-Guest-Id": context["guest_id"]},
                    timeout=10.0,
                )
                if resp.status_code == 200:
                    return resp.json()
                return {"error": f"온보딩 정보 업데이트 실패 (status={resp.status_code})"}
        except httpx.TimeoutException:
            return {"error": "온보딩 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요."}
        except httpx.ConnectError:
            return {"error": "온보딩 서버에 연결할 수 없습니다. 서버 상태를 확인해주세요."}
