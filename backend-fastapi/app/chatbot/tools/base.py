from abc import ABC, abstractmethod
from typing import Any


class BaseTool(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Claude에게 노출할 tool 이름"""

    @property
    @abstractmethod
    def description(self) -> str:
        """Claude가 언제 이 tool을 쓸지 판단하는 설명"""

    @property
    @abstractmethod
    def input_schema(self) -> dict:
        """JSON Schema for tool parameters"""

    @abstractmethod
    async def execute(self, params: dict, context: dict) -> Any:
        """실제 API 호출 로직. context에는 guest_id 등 세션 정보가 포함됨."""

    def to_bedrock_spec(self) -> dict:
        """Bedrock Converse API toolSpec 형식으로 변환"""
        return {
            "toolSpec": {
                "name": self.name,
                "description": self.description,
                "inputSchema": {"json": self.input_schema},
            }
        }
