# NutriAgent Vision API

음식 이미지를 업로드하면 DINOv2 임베딩 + pgvector 유사도 검색으로 음식 후보와 영양정보를 반환하는 FastAPI 서비스입니다.

## 동작 흐름

```
이미지 업로드
    → DINOv2로 query embedding 생성
    → PostgreSQL + pgvector에서 유사 이미지 top-k 검색
    → 음식 후보 집계 + 영양정보 조인
    → JSON 응답 반환
```

---

## 사전 요구사항

- Python 3.11+
- **pgvector가 설치된 PostgreSQL 15+**
  - 일반 `postgres:15` 이미지에는 pgvector가 없습니다.
  - Docker 사용 시 반드시 `pgvector/pgvector:pg15` 이미지를 사용하세요.
- (선택) CUDA / Apple MPS — 없으면 CPU로 동작

---

## 데이터 파일 확인

scripts 실행 전 아래 두 파일이 반드시 존재해야 합니다.

```
data/merged_food_db_keyword_avg.csv   ← 음식 영양정보 DB (load_foods.py 가 읽음)
data/pgvector_rows.parquet            ← 이미지 임베딩 데이터 (load_embeddings.py 가 읽음)
```

Docker 환경에서는 이 파일들을 이미지에 포함하거나 볼륨으로 마운트해야 합니다.

---

## 설치

```bash
pip install -r requirements.txt
```

---

## 환경변수 설정

```bash
cp .env.example .env
```

`.env`를 열고 최소한 `DATABASE_URL`을 채워주세요:

```
DATABASE_URL=postgresql://user:password@localhost:5432/nutriagent
```

나머지 항목은 `.env.example`의 주석을 참고하세요.

---

## DB 초기화 및 데이터 적재 (최초 1회)

**순서를 반드시 지켜야 합니다.**

### 1단계 — 스키마 생성

```bash
python scripts/init_db.py --schema-only --db-url "$DATABASE_URL"
```

### 2단계 — 음식 데이터 적재

```bash
python scripts/load_foods.py --db-url "$DATABASE_URL" --verbose
```

### 3단계 — 이미지 임베딩 적재

> `load_foods.py`가 먼저 완료되어 있어야 합니다. (FK 제약)

```bash
python scripts/load_embeddings.py --db-url "$DATABASE_URL" --verbose
```

### 4단계 — 벡터 인덱스 생성 (필수)

> **이 단계를 빠뜨리면 모든 벡터 검색이 전체 테이블 스캔이 됩니다.**
> 데이터 적재 후 반드시 실행하세요.

```bash
python scripts/init_db.py --create-vector-index --db-url "$DATABASE_URL"
```

---

## API 서버 실행

### 개발 환경

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 운영 환경 (Docker 포함)

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

> `--reload`는 개발 전용입니다. Docker 컨테이너에서는 사용하지 마세요.
> `--workers`는 서버 CPU 코어 수에 맞게 조정하세요. 단, 워커 수만큼 DINOv2 모델이 메모리에 로드됩니다 (워커당 약 330MB).

서버가 기동되면 HNSW 인덱스 유무를 자동으로 확인합니다.
인덱스가 없으면 WARNING 로그가 출력됩니다.

---

## 모델 가중치 (오프라인 환경)

기본 설정에서는 서버 최초 기동 시 DINOv2 가중치를 torch.hub에서 자동 다운로드합니다 (약 330MB).

**인터넷이 없는 폐쇄망 환경**에서는 `.env`에 로컬 가중치 경로를 지정하세요:

```
MODEL_WEIGHTS_PATH=/path/to/dinov2_vitb14.pth
```

비워두면 torch.hub에서 자동 다운로드합니다.

---

## 주요 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/health` | 서비스 상태 확인 |
| GET | `/health/model` | 모델 메타데이터 확인 |
| POST | `/v1/meals/upload/image` | 음식 이미지 업로드 → 후보 반환 |

> `/health`, `/health/model` 은 버전 prefix 없이 유지합니다 (k8s probe 등 인프라 사용).
> API 엔드포인트는 `/v1/` prefix를 사용합니다.

### `/v1/meals/upload/image` 요청 형식

```
POST /v1/meals/upload/image?top_k=5&min_similarity=0.6

Content-Type: multipart/form-data
file: (필수) 이미지 파일 — JPEG / PNG / WebP
```

| 파라미터 | 위치 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|------|--------|------|
| `file` | form-data | binary | ✅ | - | 이미지 파일 |
| `top_k` | query param | int | ❌ | 5 | 검색할 이웃 수 (1~20) |
| `min_similarity` | query param | float | ❌ | 없음 | 최소 유사도 필터 (0.0~1.0) |

> `top_k`와 `min_similarity`는 URL 쿼리 파라미터로 전달합니다.
> 파일은 multipart/form-data 본문으로 전달합니다.

### 응답 헤더

| 헤더 | 설명 |
|------|------|
| `X-Request-ID` | 요청의 correlation ID. Spring이 보낸 값을 그대로 반사하거나, 없으면 UUID를 생성해 반환합니다. Spring 로그와 FastAPI 로그 연결에 사용하세요. |

### 응답 예시 — 결과 있을 때

```json
{
  "matched": true,
  "prediction": {
    "top1_food_name": "김치찌개",
    "top1_similarity": 0.923
  },
  "candidates": [
    {
      "rank": 1,
      "food_id": 42,
      "food_name": "김치찌개",
      "similarity": 0.923,
      "nutrition": {
        "serving_basis": 100.0,
        "calories_kcal": 48.0,
        "protein_g": 3.4,
        "fat_g": 1.8,
        "carbs_g": 4.2,
        "sugars_g": 1.1,
        "fiber_g": 0.9,
        "sodium_mg": 420.0,
        "potassium_mg": 210.0,
        "cholesterol_mg": 12.0,
        "sat_fat_g": 0.6,
        "caffeine_mg": null
      }
    },
    {
      "rank": 2,
      "food_id": 87,
      "food_name": "순두부찌개",
      "similarity": 0.871,
      "nutrition": { "...": "..." }
    },
    {
      "rank": 3,
      "food_id": 15,
      "food_name": "된장찌개",
      "similarity": 0.834,
      "nutrition": { "...": "..." }
    }
  ],
  "top_k_used": 5,
  "returned_candidates": 3,
  "model_name": "dinov2_vitb14",
  "distance_metric": "cosine"
}
```

> `food_id` — `vision_foods` 테이블의 PK. Spring이 자체 food DB와 매핑할 때 사용하세요.
> `nutrition` 필드는 데이터가 없으면 `null`로 반환됩니다.
> `serving_basis` — 100g 기준 함량입니다.

### 응답 예시 — 결과 없을 때 (에러 아님)

```json
{
  "matched": false,
  "prediction": null,
  "candidates": [],
  "top_k_used": 5,
  "returned_candidates": 0,
  "model_name": "dinov2_vitb14",
  "distance_metric": "cosine"
}
```

> `matched: false`는 에러가 아닙니다. Spring은 이 필드로 인식 실패 여부를 판단하세요.

---

## 에러 응답

모든 에러는 동일한 포맷으로 반환됩니다:

```json
{ "detail": "에러 메시지" }
```

| 상태코드 | 발생 조건 |
|---------|---------|
| `400` | 빈 파일 / 이미지 읽기 실패 / 인식 처리 오류 |
| `413` | 파일 크기 초과 (기본 10MB) |
| `415` | 지원하지 않는 파일 형식 (JPEG/PNG/WebP 외) |
| `422` | `top_k` 또는 `min_similarity` 범위 오류 |
| `500` | DB 장애 / 서버 내부 오류 |

---

## 기타 운영 명령

### 벡터 인덱스 재생성

```bash
python scripts/init_db.py --create-vector-index --force-vector-index --db-url "$DATABASE_URL"
```

### API 문서 (Swagger UI)

```
http://localhost:8000/docs
```
