from functools import lru_cache

from app.chatbot.engine import ConversationEngine
from app.chatbot.persona.manager import PersonaManager
from app.chatbot.tools.onboarding import GetOnboardingTool, UpdateOnboardingTool
from app.chatbot.tools.recommend import RecommendMealTool
from app.chatbot.tools.registry import ToolRegistry


@lru_cache
def get_engine() -> ConversationEngine:
    persona_manager = PersonaManager()

    tool_registry = ToolRegistry()
    tool_registry.register(RecommendMealTool())
    tool_registry.register(GetOnboardingTool())
    tool_registry.register(UpdateOnboardingTool())

    return ConversationEngine(persona_manager, tool_registry)
