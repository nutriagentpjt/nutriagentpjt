from pathlib import Path

import yaml

from app.chatbot.persona.base import PersonaConfig

PRESETS_DIR = Path(__file__).parent / "presets"


class PersonaManager:
    def __init__(self) -> None:
        self._personas: dict[str, PersonaConfig] = {}
        self._load_presets()

    def _load_presets(self) -> None:
        for path in PRESETS_DIR.glob("*.yaml"):
            with open(path, encoding="utf-8") as f:
                data = yaml.safe_load(f)
            self._personas[data["name"]] = PersonaConfig(
                name=data["name"],
                display_name=data["display_name"],
                description=data["description"],
                system_prompt=data["system_prompt"].strip(),
                max_length=data.get("max_length", 300),
                tone=data.get("tone", "neutral"),
                use_emoji=data.get("use_emoji", False),
                emoji_set=data.get("emoji_set", []),
            )

    def get(self, name: str) -> PersonaConfig:
        if name not in self._personas:
            raise KeyError(f"Unknown persona: {name}")
        return self._personas[name]

    def list_all(self) -> list[dict]:
        return [
            {
                "name": p.name,
                "display_name": p.display_name,
                "description": p.description,
            }
            for p in self._personas.values()
        ]
