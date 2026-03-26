# Apidog 테스트 시나리오

## 실행 환경

### 로컬 (직접 실행)
| 서비스 | 실행 명령 | 포트 |
|--------|-----------|------|
| PostgreSQL | `docker-compose up -d postgres` | 5432 |
| FastAPI | `cd backend-fastapi && uv run uvicorn main:app --reload` | 8000 |
| Spring Boot | `cd backend-spring && ./gradlew bootRun` | 8080 |

### Docker 전체 실행
```bash
# 프로젝트 루트에서
docker-compose up --build
```

---

## Apidog 사전 설정

### Environment Variables
```
baseUrl    = http://localhost:8080
fastapiUrl = http://localhost:8000
today      = 2026-03-26
```

### 전역 설정
- **Auto-store Cookies**: ON (Settings → Cookie)
- **Follow Redirects**: ON

---

## 시나리오 1: Happy Path (기본 플로우)

### Step 1 — 게스트 세션 발급

```
POST {{baseUrl}}/guest/session
```

**Body:** 없음

**Post-script:**
```javascript
pm.environment.set("guestId", pm.response.json().guestId);
```

**기대 응답:** `200 OK`
```json
"guest_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

### Step 2 — 온보딩

```
POST {{baseUrl}}/onboarding
```

**Body (JSON):**
```json
{
  "age": 25,
  "gender": "MALE",
  "height": 175.0,
  "weight": 70.0,
  "healthGoal": "DIET",
  "activityLevel": "MODERATELY_ACTIVE",
  "exerciseFrequency": 3,
  "exerciseTime": "MORNING",
  "mealPattern": "THREE_MEALS",
  "preferredFoods": ["닭가슴살", "현미밥"],
  "dislikedFoods": [
    { "foodName": "삼겹살", "reason": "기름짐" }
  ],
  "allergies": [],
  "diseases": ["NONE"],
  "dietStyles": [],
  "waterIntakeGoal": 2.0,
  "constraints": {
    "lowSodium": false,
    "lowSugar": false,
    "maxCaloriesPerMeal": null
  }
}
```

**기대 응답:** `200 OK`
```json
{
  "target": {
    "calories": 1700.0,
    "protein": 140.0,
    "carbs": 170.0,
    "fat": 47.0,
    "manualOverride": false
  }
}
```

> **검증 포인트**
> - `calories` > 0
> - `manualOverride: false`

---

### Step 3 — 목표 영양소 조회

```
GET {{baseUrl}}/profiles/targets
```

**기대 응답:** `200 OK` — Step 2 값과 동일

---

### Step 4 — 식단 기록 (점심 일부)

```
POST {{baseUrl}}/meals
```

**Body (JSON):**
```json
{
  "foodName": "현미밥",
  "amount": 200.0,
  "mealType": "LUNCH",
  "date": "{{today}}",
  "source": "MANUAL"
}
```

**Post-script:**
```javascript
pm.environment.set("mealId", pm.response.json().id);
```

**기대 응답:** `201 Created`

---

### Step 5 — ⭐ 추천 API (핵심)

```
GET {{baseUrl}}/recommendations?mealType=LUNCH&limit=5
```

**기대 응답:** `200 OK`
```json
{
  "setId": "uuid...",
  "date": "2026-03-26",
  "mealType": "LUNCH",
  "dailyTarget": {
    "calories": 1700.0,
    "protein": 140.0,
    "carbs": 170.0,
    "fat": 47.0
  },
  "mealTarget": {
    "calories": 595.0,
    "protein": 49.0,
    "carbs": 59.5,
    "fat": 16.45
  },
  "consumed": {
    "calories": 312.0,
    "protein": 6.4,
    "carbs": 65.2,
    "fat": 1.8
  },
  "gap": {
    "calories": 283.0,
    "protein": 42.6,
    "carbs": 0.0,
    "fat": 14.65
  },
  "recommendations": [
    {
      "foodId": 123,
      "foodName": "닭가슴살",
      "score": 85.5,
      "scoreBreakdown": {
        "gapMatch": 40.0,
        "goalAlignment": 15.0,
        "diseaseCompliance": 15.0,
        "preference": 8.0,
        "feedback": 5.0
      },
      "recommendedAmountG": 150.0,
      "amountRatio": 1.5,
      "nutrientsPerServing": {
        "calories": 165.0,
        "protein": 31.0,
        "carbs": 0.0,
        "fat": 3.6
      },
      "reasonTags": ["단백질 보충", "저칼로리"]
    }
  ]
}
```

> **검증 포인트**
> - `mealTarget.calories` ≈ `dailyTarget.calories × 0.35` (THREE_MEALS 점심 비율)
> - `gap` 모든 값 ≥ 0
> - `recommendations` 배열 길이 ≤ 5
> - `scoreBreakdown` 모든 항목 ≥ 0

---

## 시나리오 2: mealType별 끼니 비율 검증

> **THREE_MEALS 기준 끼니 비율**
> | mealType | 비율 |
> |----------|------|
> | BREAKFAST | 25% |
> | LUNCH | 35% |
> | DINNER | 30% |
> | SNACK | 10% |

### Step 5-A — BREAKFAST
```
GET {{baseUrl}}/recommendations?mealType=BREAKFAST
```
**검증:** `mealTarget.calories ≈ dailyTarget.calories × 0.25`

### Step 5-B — DINNER
```
GET {{baseUrl}}/recommendations?mealType=DINNER
```
**검증:** `mealTarget.calories ≈ dailyTarget.calories × 0.30`

### Step 5-C — SNACK
```
GET {{baseUrl}}/recommendations?mealType=SNACK
```
**검증:** `mealTarget.calories ≈ dailyTarget.calories × 0.10`

---

## 시나리오 3: 에러 케이스

### Case A — 세션 없이 추천 요청
```
GET {{baseUrl}}/recommendations?mealType=LUNCH
```
쿠키를 수동으로 제거 후 요청

**기대:** `401 Unauthorized`

---

### Case B — 온보딩 전 추천 요청

1. `POST {{baseUrl}}/guest/session` (새 세션)
2. 바로 `GET {{baseUrl}}/recommendations?mealType=LUNCH`

**기대:** `409 Conflict`
```json
{ "error": "목표 영양소가 설정되지 않았습니다. 온보딩을 먼저 완료해주세요." }
```

---

### Case C — 잘못된 mealType
```
GET {{baseUrl}}/recommendations?mealType=BRUNCH
```
**기대:** `400 Bad Request`

---

## 시나리오 4: 수동 영양소 설정 후 추천

### Step 6 — 목표 수동 조절
```
PATCH {{baseUrl}}/profiles/targets
```

**Body (JSON):**
```json
{
  "calories": 2000.0,
  "protein": 150.0,
  "carbs": 200.0,
  "fat": 65.0
}
```

**기대 응답:** `200 OK`, `manualOverride: true`

---

### Step 7 — 수동 설정 반영된 추천
```
GET {{baseUrl}}/recommendations?mealType=LUNCH
```

**검증:** `dailyTarget.calories ≈ 2000.0`

---

## 시나리오 5: FastAPI 직접 호출 (내부 API 검증)

> FastAPI 내부 API는 `X-Internal-Key` 헤더 필요

### FastAPI 추천 직접 호출
```
POST {{fastapiUrl}}/api/v1/recommend
Headers:
  X-Internal-Key: local-dev-secret
  Content-Type: application/json
```

**Body (JSON):**
```json
{
  "guest_id": "{{guestId}}",
  "meal_type": "LUNCH",
  "top_n": 5
}
```

**기대 응답:** `200 OK` (Spring Boot 경유 없이 FastAPI 직접 응답)

---

### FastAPI 피드백 저장
```
POST {{fastapiUrl}}/api/v1/feedback
Headers:
  X-Internal-Key: local-dev-secret
```

**Body (JSON):**
```json
{
  "guest_id": "{{guestId}}",
  "food_id": 123,
  "feedback_type": "like"
}
```

**기대:** `201 Created`

---

### 피드백 반영된 추천 재요청
```
GET {{baseUrl}}/recommendations?mealType=LUNCH
```

**검증:** liked 음식의 `scoreBreakdown.feedback > 5.0` (기본 5점 + like 가산점)

---

## 실행 순서 체크리스트

```
시나리오 1 (Happy Path)
  [ ] Step 1: POST /guest/session         → 200
  [ ] Step 2: POST /onboarding            → 200
  [ ] Step 3: GET /profiles/targets       → 200
  [ ] Step 4: POST /meals (LUNCH 일부)    → 201
  [ ] Step 5: GET /recommendations LUNCH  → 200, recommendations 배열 존재

시나리오 2 (mealType 비율)
  [ ] Step 5-A: BREAKFAST → mealTarget ≈ daily × 0.25
  [ ] Step 5-B: DINNER    → mealTarget ≈ daily × 0.30
  [ ] Step 5-C: SNACK     → mealTarget ≈ daily × 0.10

시나리오 3 (에러)
  [ ] Case A: 세션 없음  → 401
  [ ] Case B: 온보딩 전  → 409
  [ ] Case C: 잘못된 mealType → 400

시나리오 4 (수동 설정)
  [ ] Step 6: PATCH /profiles/targets → manualOverride: true
  [ ] Step 7: GET /recommendations    → dailyTarget 수동 값 반영

시나리오 5 (FastAPI 직접)
  [ ] FastAPI 직접 추천 호출
  [ ] 피드백 저장
  [ ] 피드백 반영 추천 확인
```
