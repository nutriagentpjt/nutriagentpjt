from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE), env_file_encoding="utf-8", extra="ignore",
    )

    # Postgres
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "NutriAgent"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""

    # Internal API
    INTERNAL_API_KEY: str = ""

    # Spring Boot backend
    SPRING_BASE_URL: str = "http://localhost:8080"

    # AWS Bedrock
    AWS_REGION: str = "us-east-1"
    BEDROCK_MODEL_ID: str = "anthropic.claude-sonnet-4-20250514"


settings = Settings()
