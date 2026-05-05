from app.chatbot.tools.base import BaseTool


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, BaseTool] = {}

    def register(self, tool: BaseTool) -> None:
        self._tools[tool.name] = tool

    def get(self, name: str) -> BaseTool:
        if name not in self._tools:
            raise KeyError(f"Unknown tool: {name}")
        return self._tools[name]

    def get_bedrock_tools(self) -> list[dict]:
        """Bedrock Converse API에 전달할 toolConfig.tools 리스트"""
        return [t.to_bedrock_spec() for t in self._tools.values()]
