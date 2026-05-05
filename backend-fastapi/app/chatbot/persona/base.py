from dataclasses import dataclass, field


@dataclass(frozen=True)
class PersonaConfig:
    name: str
    display_name: str
    description: str
    system_prompt: str
    max_length: int = 300
    tone: str = "neutral"
    use_emoji: bool = False
    emoji_set: list[str] = field(default_factory=list)
