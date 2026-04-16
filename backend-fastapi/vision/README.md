# 🥗 NutriAgent Hybrid Vision API

음식 이미지를 업로드하면 **DINOv3 + CLIP 하이브리드 임베딩**과  
**pgvector 기반 유사도 검색**을 통해 음식 후보와 영양 정보를 반환하는 고성능 비전 API입니다.

---

## 🚀 Overview

- **Hybrid Embedding**
  - DINOv3 (768-dim) + CLIP (512-dim)
  - → 총 **1280-dim 벡터**

- **검색 방식**
  - PostgreSQL + pgvector
  - HNSW 인덱스 기반 고속 검색

- **결과**
  - Top-K 음식 후보
  - 148종 영양 정보 반환

---

## 🔄 Pipeline

```text
이미지 업로드
    → DINOv3 + CLIP 인코딩
    → 1280-dim Query 생성
    → pgvector HNSW 검색
    → 음식 후보 매칭
    → 영양 정보 JOIN
    → JSON 반환
```

---

## 🛠️ Requirements

- Python **3.12+**
- PostgreSQL **15+**
- pgvector (Docker 이미지 권장)

```bash
pgvector/pgvector:pg15
```

- Hugging Face Access Token (DINOv3 접근 필수)

### Optional

- CUDA / Apple MPS (없으면 CPU 실행)

---

## 📂 Data Files

`scripts` 실행 전에 반드시 준비:

```
data/
├── vision_nutrition_148.csv     # 음식 영양 DB
└── pgvector_export.parquet      # 1280-dim 임베딩 (36,824개)
```

---

## ⚙️ Environment Setup

`backend-fastapi/vision/.env`

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/NutriAgent

# App
APP_ENV=dev
DEBUG=True

# Model
HF_TOKEN=hf_your_access_token_here
EMBEDDING_DIM=1280
MODEL_NAME=hybrid_dinov3_clip
MODEL_DEVICE=cpu   # cuda / mps 가능
```

---

## 🏗️ Database Setup (최초 1회)

⚠️ 반드시 순서 지켜야 함

### 1. Schema 생성

```bash
python scripts/init_db.py --schema-only
```

> 기존 vector(1536) 테이블이 있다면 삭제 후 진행

---

### 2. 음식 데이터 적재

```bash
python scripts/load_foods.py --verbose
```

---

### 3. 임베딩 데이터 적재

```bash
python scripts/load_embeddings.py --verbose --expected-dim 1280
```

---

### 4. 벡터 인덱스 생성 (필수)

```bash
python scripts/init_db.py --create-vector-index
```

---

## 🏃 Run Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✔️ 정상 실행 시:

```
✅ Hybrid 모델 적재 완료!
```

---

## 🔍 API Endpoints

### 1. Model Health Check

```
GET /health/model
```

- 모델 로딩 상태 확인
- embedding_dim = 1280 확인

---

### 2. 음식 이미지 분석

```
POST /v1/meals/upload/image
```

---

## 📦 Response Example

```json
{
  "matched": true,
  "prediction": {
    "top1_food_name": "호두",
    "top1_similarity": 0.9996
  },
  "candidates": [
    {
      "rank": 1,
      "food_id": 123,
      "food_name": "호두",
      "similarity": 0.9996,
      "nutrition": {
        "calories_kcal": 348.56,
        "protein_g": 7.82,
        "fat_g": 17.9,
        "carbs_g": 40.13,
        "sodium_mg": 200.0,
        "cholesterol_mg": 28.91
      }
    }
  ],
  "model_name": "hybrid_dinov3_clip",
  "embedding_dim": 1280,
  "distance_metric": "cosine"
}
```

---

## ⚠️ Troubleshooting

### 1. GatedRepoError (401)

- DINOv3 접근 권한 없음
- 해결:
  - Hugging Face 승인 받기
  - HF_TOKEN 확인

---

### 2. ValidationError (Pydantic)

- 원인: `EMBEDDING_DIM != 1280`
- 해결:
  - `.env` 확인

---

### 3. Dimension Mismatch

- DB가 `vector(1536)`로 생성된 경우 발생
- 해결:

```bash
python scripts/init_db.py --schema-only
```

---

## 💡 Notes

- 반드시 **1280-dim 고정**
- HNSW 인덱스 생성 안 하면 성능 급락
- CPU 환경에서도 동작 가능 (속도 차이 있음)
