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
    APP_NAME: str = "NutriAgent Hybrid Vision API"
    APP_VERSION: str = "0.1.0"
    # "dev" / "staging" / "prod" 외 값은 기동 시 즉시 에러
    APP_ENV: Literal["dev", "staging", "prod"] = "dev"
    DEBUG: bool = False

    # Retrieval
    DEFAULT_TOP_K: int = 5
    DEFAULT_TOP_CANDIDATES: int = 3

    # Model - 하이브리드 모델명으로 업데이트
    MODEL_NAME: str = "hybrid_dinov3_clip"
    MODEL_DEVICE: Literal["cpu", "cuda", "mps"] = "cpu"
    # 비워두면 자동 다운로드 (개발 전용).
    # APP_ENV=prod 에서는 반드시 로컬 경로를 지정해야 한다 — 아래 validator 참조.
    MODEL_WEIGHTS_PATH: str = ""

    # Embedding — DINOv3(768) + CLIP(512) = 1280 차원으로 수정
    # 이 값은 DB의 vector(1280) 규격과 일치해야 함.
    EMBEDDING_DIM: int = 1280
    DISTANCE_METRIC: str = "cosine"

    # API limits
    MAX_TOP_K: int = 20
    MAX_UPLOAD_MB: int = 10

    # DB connection pool
    DB_POOL_MIN_SIZE: int = 2
    DB_POOL_MAX_SIZE: int = 10

    @model_validator(mode="after")
    def validate_settings(self) -> "Settings":
        # 1. 운영 환경(prod) 보안 검증: 가중치 로컬 경로 필수
        if self.APP_ENV == "prod" and not self.MODEL_WEIGHTS_PATH:
            raise ValueError(
                "MODEL_WEIGHTS_PATH must be set when APP_ENV=prod. "
                "torch.hub downloads and executes remote Python code at startup, "
                "which is not acceptable in production. "
                "Download the model weights and point MODEL_WEIGHTS_PATH to the local file."
            )
        
        # 2. 임베딩 차원 검증: 하이브리드 모델 규격(1280) 강제
        if self.EMBEDDING_DIM != 1280:
            raise ValueError(
                "EMBEDDING_DIM must be 1280. "
                "This value is fixed by our 1280-dim Hybrid model architecture (768+512)."
            )
            
        # 3. 거리 측정 방식 검증: pgvector <=> 연산자(cosine)와 동기화
        if self.DISTANCE_METRIC != "cosine":
            raise ValueError(
                "DISTANCE_METRIC must be 'cosine'. "
                "This value is fixed by the <=> pgvector operator in retrieval.py."
            )
        return self


settings = Settings()