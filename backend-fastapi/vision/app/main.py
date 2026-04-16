from __future__ import annotations

import asyncio
import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.db import close_pool, fetch_one, init_pool
from app.inference import InferenceError, get_model_metadata, infer_from_image_bytes
from app.model import get_model
from app.schemas import ErrorResponse, HealthResponse, SearchImageResponse

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}

_REQUEST_ID_HEADER = "X-Request-ID"

# Readiness 플래그 — lifespan에서 각 컴포넌트 초기화 성공 시 True로 설정
# /health/ready 가 이 값을 보고 503 vs 200을 결정한다.
# k8s readiness probe, AWS ALB health check, Spring depends_on 모두 이 엔드포인트를 사용해야 한다.
_db_ready: bool = False
_model_ready: bool = False

_HNSW_INDEX_CHECK_SQL = """
SELECT 1
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'image_embeddings'
  AND indexdef ILIKE '%hnsw%'
LIMIT 1;
"""


def _warn_if_hnsw_missing() -> None:
    """
    Log a warning at startup if the HNSW vector index is absent.
    Without it, every similarity search is a full sequential scan — O(N × D).
    Run: python scripts/init_db.py --create-vector-index
    """
    try:
        row = fetch_one(_HNSW_INDEX_CHECK_SQL)
        if row is None:
            logger.warning(
                "HNSW vector index is missing on image_embeddings.embedding. "
                "Vector searches will be extremely slow without it. "
                "Run: python scripts/init_db.py --create-vector-index"
            )
    except Exception:
        logger.warning("Could not verify HNSW index presence.", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    App startup/shutdown lifecycle.

    Startup:
    - Initialize DB connection pool (blocking I/O → thread pool)
    - Warn if HNSW vector index is missing (blocking DB query → thread pool)
    - Preload DINOv2 model (blocking CPU/network → thread pool)

    모든 blocking 작업을 run_in_executor 로 감싸 이벤트 루프를 블로킹하지 않는다.
    이 없으면 DINOv2 로드(최대 60초)가 이벤트 루프를 점유해 /health 포함
    모든 엔드포인트가 응답 불가 상태가 된다.

    get_running_loop() 를 사용한다. get_event_loop() 는 Python 3.10+ deprecated,
    3.12+ 에서 실행 중인 루프 없을 때 RuntimeError.

    Shutdown:
    - Close DB connection pool
    """
    global _db_ready, _model_ready

    loop = asyncio.get_running_loop()

    try:
        await loop.run_in_executor(None, init_pool)
        await loop.run_in_executor(None, _warn_if_hnsw_missing)
        _db_ready = True
    except Exception:
        logger.warning(
            "DB initialization failed at startup. "
            "Server will start in degraded mode — API calls requiring DB will return 500. "
            "Check DATABASE_URL and ensure PostgreSQL is running.",
            exc_info=True,
        )

    try:
        await loop.run_in_executor(None, get_model)
        _model_ready = True
    except Exception:
        logger.warning(
            "Model loading failed at startup. "
            "Server will start in degraded mode — image inference will return 500.",
            exc_info=True,
        )

    yield
    close_pool()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """
    X-Request-ID 헤더를 요청에서 읽거나 없으면 UUID를 생성해 응답 헤더에 반영한다.
    Spring이 X-Request-ID를 포함해 호출하면 FastAPI 응답에도 동일 값이 실린다.
    FastAPI 로그와 Spring 로그를 같은 request_id로 연결해 MSA 트레이싱을 지원한다.
    """

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get(_REQUEST_ID_HEADER) or str(uuid.uuid4())
        response = await call_next(request)
        response.headers[_REQUEST_ID_HEADER] = request_id
        return response


app.add_middleware(CorrelationIdMiddleware)


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["health"],
    summary="Liveness probe",
)
def health_check() -> HealthResponse:
    """
    Liveness probe — 프로세스가 살아있는지만 확인.
    DB/모델 상태와 무관하게 항상 200을 반환한다.

    k8s liveness probe, 단순 생존 확인에 사용.
    실제 서비스 가능 여부는 /health/ready 를 사용할 것.
    """
    return HealthResponse(
        status="ok",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
    )


@app.get(
    "/health/ready",
    tags=["health"],
    summary="Readiness probe",
    responses={503: {"model": ErrorResponse}},
)
def health_ready() -> dict:
    """
    Readiness probe — DB와 모델이 모두 준비됐는지 확인.
    하나라도 준비 안 됐으면 503을 반환한다.

    k8s readiness probe, AWS ALB target health check,
    docker-compose depends_on condition: service_healthy 에 사용.
    Spring이 vision-api를 호출하기 전 이 엔드포인트로 준비 여부를 확인해야 한다.
    """
    if not _db_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not ready. Check DATABASE_URL and PostgreSQL status.",
        )
    if not _model_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not ready. Check MODEL_WEIGHTS_PATH or network access for torch.hub.",
        )
    return {"status": "ready", "db": True, "model": True}


@app.get(
    "/health/model",
    tags=["health"],
    summary="Model metadata",
)
def health_model() -> dict:
    """
    Lightweight model metadata check.
    Useful during deployment/debugging.
    """
    return get_model_metadata()


@app.post(
    "/v1/meals/upload/image",
    response_model=SearchImageResponse,
    response_model_exclude_none=True,
    tags=["meals"],
    responses={
        400: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        415: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
def upload_meal_image(
    request: Request,
    file: UploadFile = File(...),
    top_k: int = Query(default=settings.DEFAULT_TOP_K, ge=1, le=settings.MAX_TOP_K),
    min_similarity: float | None = Query(default=None, ge=0.0, le=1.0),
) -> SearchImageResponse:
    """
    Upload a meal image and return top-3 food candidates with nutrition info.

    This is a sync endpoint — FastAPI runs it in a thread pool automatically,
    so the event loop is never blocked by model inference or DB queries.

    Request:
    - file: image file (multipart/form-data)
    - top_k: (query param) number of raw nearest neighbors to search, default 5, max 20
    - min_similarity: (query param) optional minimum similarity filter, 0.0 ~ 1.0

    Response header:
    - X-Request-ID: correlation ID (echoed from request or newly generated)
    """
    request_id = request.headers.get(_REQUEST_ID_HEADER, "-")

    if file.content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                "Unsupported file type. "
                "Allowed types: image/jpeg, image/jpg, image/png, image/webp"
            ),
        )

    max_upload_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024

    # Content-Length 기반 선행 체크: 전체를 메모리에 올리기 전에 거부한다.
    if file.size is not None and file.size > max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded file exceeds {settings.MAX_UPLOAD_MB}MB limit.",
        )

    try:
        # sync read: safe because this endpoint runs in a thread pool
        image_bytes = file.file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {e}",
        ) from e

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # Content-Length가 없거나 잘못된 경우를 대비한 최종 크기 검사
    if len(image_bytes) > max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded file exceeds {settings.MAX_UPLOAD_MB}MB limit.",
        )

    try:
        result = infer_from_image_bytes(
            image_bytes=image_bytes,
            top_k=top_k,
            min_similarity=min_similarity,
        )
        return result

    except InferenceError as e:
        logger.warning("Inference failed [request_id=%s]: %s", request_id, e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image recognition failed. Please check the image and try again.",
        ) from e

    except Exception:
        logger.exception("Unexpected error during image inference [request_id=%s]", request_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error.",
        )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    FastAPI의 Query/Path/Body 파라미터 자동 검증 실패를 HTTPException과 동일한
    {"detail": "..."} 포맷으로 통일한다.
    Spring이 두 가지 다른 detail 포맷을 처리할 필요 없어진다.
    """
    first = exc.errors()[0] if exc.errors() else {}
    return JSONResponse(
        status_code=422,
        content={"detail": first.get("msg", "Invalid request parameters.")},
    )
