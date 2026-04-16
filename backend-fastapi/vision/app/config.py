from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # .env에 모르는 키가 있어도 에러 내지 않음
    )

    # Database (필수 — 없으면 기동 즉시 명확한 에러. 빈 문자열도 허용 안 함)
    DATABASE_URL: str = Field(min_length=1)

    # App
    APP_NAME: str = "NutriAgent Vision API"
    APP_VERSION: str = "0.1.0"
    # "dev" / "staging" / "prod" 외 값은 기동 시 즉시 에러
    APP_ENV: Literal["dev", "staging", "prod"] = "dev"
    DEBUG: bool = False

    # Retrieval
    DEFAULT_TOP_K: int = 5
    DEFAULT_TOP_CANDIDATES: int = 3

    # Model
    MODEL_NAME: str = "dinov2_vitb14"
    MODEL_DEVICE: Literal["cpu", "cuda", "mps"] = "cpu"
    # 비워두면 torch.hub 자동 다운로드 (개발 전용).
    # APP_ENV=prod 에서는 반드시 로컬 경로를 지정해야 한다 — 아래 validator 참조.
    MODEL_WEIGHTS_PATH: str = ""

    # Embedding — 변경 금지
    # 두 값은 schema.sql(vector(768))과 retrieval.py(<=> 연산자)에 하드코딩되어 있다.
    # .env에서 다른 값을 넣으면 아래 validator가 기동 시 즉시 에러를 낸다.
    EMBEDDING_DIM: int = 768
    DISTANCE_METRIC: str = "cosine"

    # API limits
    MAX_TOP_K: int = 20
    MAX_UPLOAD_MB: int = 10

    # DB connection pool
    DB_POOL_MIN_SIZE: int = 2
    DB_POOL_MAX_SIZE: int = 10

    @model_validator(mode="after")
    def validate_settings(self) -> "Settings":
        if self.APP_ENV == "prod" and not self.MODEL_WEIGHTS_PATH:
            raise ValueError(
                "MODEL_WEIGHTS_PATH must be set when APP_ENV=prod. "
                "torch.hub downloads and executes remote Python code at startup, "
                "which is not acceptable in production. "
                "Download the model weights and point MODEL_WEIGHTS_PATH to the local file."
            )
        if self.EMBEDDING_DIM != 768:
            raise ValueError(
                "EMBEDDING_DIM must be 768. "
                "This value is fixed by schema.sql (vector(768)) and cannot be changed via config."
            )
        if self.DISTANCE_METRIC != "cosine":
            raise ValueError(
                "DISTANCE_METRIC must be 'cosine'. "
                "This value is fixed by the <=> pgvector operator in retrieval.py."
            )
        return self


settings = Settings()
