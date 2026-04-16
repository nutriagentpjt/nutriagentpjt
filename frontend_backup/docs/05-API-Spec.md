# API Specification

## 공통 사항

**Base URL:** `/api`

**Content-Type:** `application/json`

**공통 에러 응답 형식:**
```json
{
  "code": "ERROR_CODE",
  "message": "에러 상세 메시지"
}
```

**공통 HTTP 상태 코드:**
- `200 OK`: 성공 (조회)
- `201 Created`: 성공 (생성)
- `400 Bad Request`: 잘못된 요청 (Validation 실패)
- `404 Not Found`: 리소스 없음
- `409 Conflict`: 중복 또는 충돌
- `500 Internal Server Error`: 서버 오류

---

## 1. 식단 기록 (Meal Recording)

### 1-1. 음식 검색

**Endpoint:** `GET /api/foods/search`

**Description:** 키워드 기반 음식 검색 (최대 20개 결과)

**Query Parameters:**
| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `keyword` | String | Y | 검색할 음식명 (최소 1자) | 김치찌개 |

**Response (200 OK):**
```json
{
  "foods": [
    {
      "id": 1,
      "name": "김치찌개",
      "weight": 250,
      "calories": 179,
      "carbs": 25.78,
      "protein": 6.46,
      "fat": 5.56,
      "sodium": 820
    }
  ],
  "total": 1
}
```

**Error Cases:**
- `400 Bad Request`: "검색어를 입력해주세요"
- `500 Internal Server Error`: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요"
- `504 Gateway Timeout`: "검색 시간이 초과되었습니다. 다시 시도해주세요"

---

### 1-2. 이미지 업로드

**Endpoint:** `POST /api/meals/upload/image`

**Description:** 음식 사진 업로드 및 OCR/분류 처리

**Request (multipart/form-data):**
| Field | Type | Required | Description |
|---|---|---|---|
| `image` | File | Y | 이미지 파일 (JPEG/PNG/WebP, 최대 5MB) |

**Response (200 OK) - OCR 성공:**
```json
{
  "method": "ocr",
  "foodName": "김치찌개",
  "amount": 250.0,
  "matchedFood": {
    "id": 1,
    "name": "김치찌개",
    "weight": 250,
    "calories": 179,
    "carbs": 25.78,
    "protein": 6.46,
    "fat": 5.56
  }
}
```

**Response (200 OK) - 이미지 분류:**
```json
{
  "method": "classification",
  "autoSelected": true,
  "selectedFood": {
    "id": 1,
    "name": "김치찌개",
    "weight": 250,
    "calories": 179,
    "carbs": 25.78,
    "protein": 6.46,
    "fat": 5.56
  },
  "confidence": 0.85,
  "candidates": [
    {"name": "김치찌개", "confidence": 0.85},
    {"name": "된장찌개", "confidence": 0.12}
  ]
}
```

**Error Cases:**
- `400 Bad Request`: "이미지 크기는 5MB 이하여야 합니다" / "JPEG, PNG, WebP 형식만 지원합니다"
- `500 Internal Server Error`: "음식을 인식할 수 없습니다"

---

### 1-3. 음식 분류

**Endpoint:** `POST /api/classify/food`

**Description:** 이미지 분류 모델을 통한 음식 인식 (내부 전용)

**Request (multipart/form-data):**
| Field | Type | Required | Description |
|---|---|---|---|
| `image` | File | Y | 이미지 파일 |

**Response (200 OK):**
```json
{
  "predictions": [
    {"name": "김치찌개", "confidence": 0.85},
    {"name": "된장찌개", "confidence": 0.12},
    {"name": "순두부찌개", "confidence": 0.03}
  ]
}
```

---

### 1-4. 식단 기록

**Endpoint:** `POST /api/meals`

**Description:** 사용자가 섭취한 음식 기록 (영양소 자동 계산)

**Request Body:**
```json
{
  "userId": 123,
  "foodId": 1,
  "amount": 250,
  "mealType": "lunch",
  "date": "2025-01-26"
}
```

**Field Details:**
| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `userId` | Integer | Y | - | 사용자 ID |
| `foodId` | Integer | Y | - | 음식 ID |
| `amount` | Float | Y | 1 ~ 10,000 | 섭취량 (g) |
| `mealType` | Enum | Y | breakfast, lunch, dinner, snack | 식사 시간대 |
| `date` | String | Y | YYYY-MM-DD, 과거 30일 ~ 오늘 | 날짜 |

**Response (201 Created):**
```json
{
  "id": 456,
  "userId": 123,
  "foodId": 1,
  "foodName": "김치찌개",
  "amount": 250,
  "calories": 179,
  "protein": 6.46,
  "carbs": 25.78,
  "fat": 5.56,
  "mealType": "lunch",
  "date": "2025-01-26",
  "createdAt": "2025-01-26T12:34:56Z"
}
```

**Error Cases:**
- `400 Bad Request`: "섭취량을 입력해주세요" / "섭취량은 1~10,000g 사이여야 합니다" / "과거 30일 ~ 오늘까지만 기록 가능합니다"
- `404 Not Found`: "음식 정보를 찾을 수 없습니다"
- `500 Internal Server Error`: "일시적인 오류로 저장에 실패했습니다"

---

### 1-5. 식단 조회

**Endpoint:** `GET /api/meals`

**Description:** 특정 날짜의 식단 기록 조회 (일간 영양소 요약 포함)

**Query Parameters:**
| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `userId` | Integer | Y | 사용자 ID | 123 |
| `date` | String | Y | 조회 날짜 (YYYY-MM-DD) | 2025-01-26 |

**Response (200 OK):**
```json
{
  "date": "2025-01-26",
  "summary": {
    "totalCalories": 1850,
    "totalProtein": 85.5,
    "totalCarbs": 220.3,
    "totalFat": 62.7
  },
  "target": {
    "calories": 2000,
    "protein": 100,
    "carbs": 250,
    "fat": 66.7
  },
  "achievementRate": {
    "calories": 92.5,
    "protein": 85.5,
    "carbs": 88.1,
    "fat": 94.0
  },
  "meals": [
    {
      "id": 456,
      "foodId": 1,
      "foodName": "김치찌개",
      "amount": 250,
      "calories": 179,
      "protein": 6.46,
      "carbs": 25.78,
      "fat": 5.56,
      "mealType": "lunch",
      "createdAt": "2025-01-26T12:34:56Z"
    }
  ]
}
```

**Error Cases:**
- `400 Bad Request`: "날짜 형식이 올바르지 않습니다"
- `500 Internal Server Error`: "데이터를 불러올 수 없습니다"

---

### 1-6. 식단 수정

**Endpoint:** `PUT /api/meals/{mealId}`

**Description:** 기록한 식단 수정

**Request Body:**
```json
{
  "amount": 300,
  "mealType": "dinner",
  "date": "2025-01-26"
}
```

**Response (200 OK):**
```json
{
  "id": 456,
  "userId": 123,
  "foodId": 1,
  "foodName": "김치찌개",
  "amount": 300,
  "calories": 214.8,
  "protein": 7.75,
  "carbs": 30.94,
  "fat": 6.67,
  "mealType": "dinner",
  "date": "2025-01-26",
  "updatedAt": "2025-01-26T14:00:00Z"
}
```

**Error Cases:**
- `403 Forbidden`: "본인의 기록만 수정할 수 있습니다"
- `404 Not Found`: "존재하지 않는 기록입니다"

---

### 1-7. 식단 삭제

**Endpoint:** `DELETE /api/meals/{mealId}`

**Description:** 기록한 식단 삭제

**Response (200 OK):**
```json
{
  "message": "식단 기록이 삭제되었습니다",
  "mealId": 456
}
```

**Error Cases:**
- `403 Forbidden`: "본인의 기록만 삭제할 수 있습니다"
- `404 Not Found`: "존재하지 않는 기록입니다"

---

## 2. 식단 추천 (Meal Recommendation)

### 2-1. 식단 추천 조회

**Endpoint:** `GET /api/recommendations`

**Description:** 목표/섭취량 기반 개인화 추천

**Query Parameters:**
| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `userId` | Integer | Y | 사용자 ID | 123 |
| `date` | String | N | 추천 날짜 (기본값: 오늘) | 2025-01-26 |
| `mealType` | Enum | Y | 식사 시간대 | lunch |
| `limit` | Integer | N | 추천 개수 (1~20, 기본값: 10) | 10 |

**Response (200 OK):**
```json
{
  "setId": "abc-123-def-456",
  "date": "2025-01-26",
  "mealType": "lunch",
  "summary": {
    "consumed": {
      "calories": 850,
      "protein": 35.5,
      "carbs": 120.3,
      "fat": 28.7
    },
    "target": {
      "calories": 2000,
      "protein": 100,
      "carbs": 250,
      "fat": 66.7
    }
  },
  "gap": {
    "calories": 1150,
    "protein": 64.5,
    "carbs": 129.7,
    "fat": 38.0
  },
  "recommendations": [
    {
      "foodId": 42,
      "foodName": "닭가슴살 샐러드",
      "recommendedAmount": 200,
      "calories": 180,
      "protein": 28.5,
      "carbs": 12.3,
      "fat": 5.2,
      "score": 85.5,
      "reasons": ["단백질 보충", "저칼로리"]
    }
  ],
  "coachText": "단백질이 64.5g 부족해요. 닭가슴살 샐러드를 추천드려요!"
}
```

**Error Cases:**
- `400 Bad Request`: "요청값이 올바르지 않습니다"
- `409 Conflict`: "목표 설정이 필요합니다" (code: TARGET_REQUIRED)
- `500 Internal Server Error`: "추천을 불러올 수 없습니다"
- `502 Bad Gateway`: "요약 정보를 불러오지 못했습니다"

---

### 2-2. 추천 식단 저장

**Endpoint:** `POST /api/recommendations/save`

**Description:** 추천 받은 음식을 식단에 저장

**Request Body:**
```json
{
  "userId": 123,
  "setId": "abc-123-def-456",
  "foodId": 42,
  "amount": 200,
  "mealType": "lunch",
  "date": "2025-01-26"
}
```

**Response (201 Created):**
```json
{
  "id": 789,
  "userId": 123,
  "foodId": 42,
  "foodName": "닭가슴살 샐러드",
  "amount": 200,
  "calories": 180,
  "protein": 28.5,
  "carbs": 12.3,
  "fat": 5.2,
  "mealType": "lunch",
  "date": "2025-01-26",
  "createdAt": "2025-01-26T13:00:00Z"
}
```

---

### 2-3. 추천 설정 저장

**Endpoint:** `POST /api/recommendations/settings`

**Description:** 사용자 추천 필터/제약 조건 설정

**Request Body:**
```json
{
  "userId": 123,
  "constraints": {
    "allergies": ["땅콩", "우유"],
    "dislikes": ["김치"],
    "preferences": ["닭고기", "샐러드"]
  }
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "userId": 123,
  "constraints": {
    "allergies": ["땅콩", "우유"],
    "dislikes": ["김치"],
    "preferences": ["닭고기", "샐러드"]
  },
  "createdAt": "2025-01-26T10:00:00Z"
}
```

---

### 2-4. 추천 설정 조회

**Endpoint:** `GET /api/recommendations/settings`

**Description:** 사용자 추천 설정 조회

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | Integer | Y | 사용자 ID |

**Response (200 OK):**
```json
{
  "id": 1,
  "userId": 123,
  "constraints": {
    "allergies": ["땅콩", "우유"],
    "dislikes": ["김치"],
    "preferences": ["닭고기", "샐러드"]
  },
  "createdAt": "2025-01-26T10:00:00Z",
  "updatedAt": "2025-01-26T10:00:00Z"
}
```

**Error Cases:**
- `404 Not Found`: "설정 정보가 없습니다"

---

### 2-5. 추천 피드백 제출

**Endpoint:** `POST /api/recommendations/feedback`

**Description:** 추천 음식에 대한 피드백 수집

**Request Body:**
```json
{
  "userId": 123,
  "setId": "abc-123-def-456",
  "foodId": 42,
  "feedbackType": "like"
}
```

**Field Details:**
| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `userId` | Integer | Y | - | 사용자 ID |
| `setId` | String | Y | UUID | 추천 세트 ID |
| `foodId` | Integer | Y | - | 음식 ID |
| `feedbackType` | Enum | Y | like, dislike, saved, ignored | 피드백 타입 |

**Response (201 Created):**
```json
{
  "id": 100,
  "userId": 123,
  "setId": "abc-123-def-456",
  "foodId": 42,
  "feedbackType": "like",
  "createdAt": "2025-01-26T13:30:00Z"
}
```

---

### 2-6. 추천 이벤트 기록

**Endpoint:** `POST /api/recommendations/events`

**Description:** 추천 시스템 이벤트 로그 (분석용)

**Request Body:**
```json
{
  "userId": 123,
  "setId": "abc-123-def-456",
  "foodId": 42,
  "eventType": "click"
}
```

**Field Details:**
| Field | Type | Validation | Description |
|---|---|---|---|
| `eventType` | Enum | view, click, save, ignore | 이벤트 타입 |

**Response (201 Created):**
```json
{
  "message": "이벤트가 기록되었습니다",
  "eventId": 500
}
```

---

## 3. 온보딩 (Onboarding)

### 3-1. 온보딩 정보 저장

**Endpoint:** `POST /api/onboarding`

**Description:** 사용자 목표 설정 (TDEE, 목표 영양소)

**Request Body:**
```json
{
  "userId": 123,
  "tdee": 2000,
  "targetProtein": 100,
  "targetCarbs": 250,
  "targetFat": 66.7
}
```

**Response (201 Created):**
```json
{
  "userId": 123,
  "tdee": 2000,
  "targetProtein": 100,
  "targetCarbs": 250,
  "targetFat": 66.7,
  "createdAt": "2025-01-26T09:00:00Z"
}
```

**Error Cases:**
- `400 Bad Request`: "필수 값이 누락되었습니다"
- `409 Conflict`: "이미 온보딩이 완료되었습니다"

---

### 3-2. 온보딩 정보 조회

**Endpoint:** `GET /api/onboarding`

**Description:** 사용자 목표 정보 조회

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | Integer | Y | 사용자 ID |

**Response (200 OK):**
```json
{
  "userId": 123,
  "tdee": 2000,
  "targetProtein": 100,
  "targetCarbs": 250,
  "targetFat": 66.7,
  "createdAt": "2025-01-26T09:00:00Z",
  "updatedAt": "2025-01-26T09:00:00Z"
}
```

**Error Cases:**
- `404 Not Found`: "온보딩 정보가 없습니다"

---

### 3-3. 온보딩 정보 삭제

**Endpoint:** `DELETE /api/onboarding`

**Description:** 사용자 목표 정보 삭제 (초기화)

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | Integer | Y | 사용자 ID |

**Response (200 OK):**
```json
{
  "message": "온보딩 정보가 삭제되었습니다",
  "userId": 123
}
```

---

## 4. 기타 (Misc)

### 4-1. 목표 정보 조회

**Endpoint:** `GET /api/goals`

**Description:** 사용자 목표 정보 조회 (온보딩 완료 시)

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | Integer | Y | 사용자 ID |

**Response (200 OK):**
```json
{
  "userId": 123,
  "tdee": 2000,
  "targetProtein": 100,
  "targetCarbs": 250,
  "targetFat": 66.7
}
```

---

### 4-2. 식사 요약 조회

**Endpoint:** `GET /api/meals/summary`

**Description:** 특정 날짜의 식사 영양소 요약

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | Integer | Y | 사용자 ID |
| `date` | String | Y | 조회 날짜 (YYYY-MM-DD) |

**Response (200 OK):**
```json
{
  "date": "2025-01-26",
  "totalCalories": 1850,
  "totalProtein": 85.5,
  "totalCarbs": 220.3,
  "totalFat": 62.7,
  "mealCount": 3
}
```

---

### 4-3. AI 코칭 문장 생성

**Endpoint:** `POST /api/coaching/generate`

**Description:** 영양 상태 기반 AI 코칭 문구 생성

**Request Body:**
```json
{
  "userId": 123,
  "date": "2025-01-26",
  "consumed": {
    "calories": 850,
    "protein": 35.5,
    "carbs": 120.3,
    "fat": 28.7
  },
  "target": {
    "calories": 2000,
    "protein": 100,
    "carbs": 250,
    "fat": 66.7
  }
}
```

**Response (200 OK):**
```json
{
  "coachText": "오늘 단백질이 64.5g 부족해요. 닭가슴살이나 두부 요리를 드시는 건 어떨까요?",
  "tone": "friendly",
  "focus": "protein"
}
```

---

## 5. 참고 사항

### 영양소 계산 공식
```
실제 영양소 = (섭취량 / 기본 제공량) × 기본 영양소
```

**예시:**
- 기본 제공량: 250g
- 기본 칼로리: 179 kcal
- 실제 섭취량: 300g
- 실제 칼로리: (300 / 250) × 179 = 214.8 kcal

### Enum 타입

**MealType:**
- `breakfast`: 아침
- `lunch`: 점심
- `dinner`: 저녁
- `snack`: 간식

**FeedbackType:**
- `like`: 좋아요
- `dislike`: 싫어요
- `saved`: 저장함
- `ignored`: 무시함

**EventType:**
- `view`: 조회
- `click`: 클릭
- `save`: 저장
- `ignore`: 무시
