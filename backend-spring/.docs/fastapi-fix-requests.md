# FastAPI 수정 요청 사항

## 현재 테스트 결과

| 시나리오 | 상태 | 비고 |
|----------|------|------|
| 시나리오 1 — Happy Path | ✅ | guest/session → onboarding → meals → recommendations |
| 시나리오 2 — mealType 비율 | ✅ | BREAKFAST 25% / LUNCH 35% / DINNER 30% / SNACK 10% |
| 시나리오 3 — 에러 케이스 | ✅ | 401 / 409 / 400 전부 정상 |
| 시나리오 4 — 수동 설정 반영 | ❌ | FastAPI 수정 필요 |

---

## Fix 1. `manual_override` 미반영 (우선순위 높음)

### 증상
`PATCH /profiles/targets`로 목표 수동 설정 후 `GET /recommendations` 호출 시
`dailyTarget`이 수동 설정값이 아닌 BMR 재계산값으로 반환됨.

```
PATCH /profiles/targets  →  { calories: 2000, manualOverride: true }
GET  /recommendations    →  dailyTarget.calories = 2075.5  ← BMR 재계산값 그대로
```

### 원인
`app/services/recommendation.py`의 `run_recommendation()` Step 1이
항상 BMR/TDEE를 재계산하며 `nutrition_targets` 테이블을 읽지 않음.

```python
# 현재 코드 (recommendation.py)
bmr   = calculate_bmr(user.gender, user.weight, user.height, user.age)
tdee  = calculate_tdee(bmr, user.activity_level)
daily = calculate_daily_targets(tdee, user.weight, user.health_goal, user.diseases)
```

### 요청 수정 방향

```python
# Step 1에서 nutrition_targets 먼저 확인
nt = await db.execute(
    text("""
        SELECT nt.calories, nt.protein, nt.carbs, nt.fat, nt.manual_override
        FROM nutrition_targets nt
        JOIN users u ON u.id = nt.user_id
        WHERE u.guest_id = :guest_id
    """),
    {"guest_id": req.guest_id},
)
nt_row = nt.mappings().first()

if nt_row and nt_row["manual_override"]:
    daily = NutrientTarget(
        calories=nt_row["calories"],
        protein=nt_row["protein"],
        carbs=nt_row["carbs"],
        fat=nt_row["fat"],
    )
else:
    bmr   = calculate_bmr(user.gender, user.weight, user.height, user.age)
    tdee  = calculate_tdee(bmr, user.activity_level)
    daily = calculate_daily_targets(tdee, user.weight, user.health_goal, user.diseases)
```

---

## Fix 2. `Food` 모델 컬럼명 불일치 (이미 수정됨)

### 증상
추천 API 호출 시 FastAPI 500 에러 발생.

```
sqlalchemy.exc.ProgrammingError: column foods.sugars does not exist
HINT: Perhaps you meant to reference the column "foods.sugar"
```

### 원인
`app/models/food.py` 속성명과 실제 DB 컬럼명 불일치.

| 모델 속성 | 실제 DB 컬럼 |
|-----------|-------------|
| `sugars` | `sugar` |
| `fiber` | `dietary_fiber` |
| `cholesterol` | 없음 (DB에 존재하지 않음) |
| `trans_fat` | 없음 (DB에 존재하지 않음) |

### 수정 내용 (완료)

```python
# app/models/food.py
sugars: Mapped[float | None] = mapped_column("sugar", Float, nullable=True, comment="g")
fiber:  Mapped[float | None] = mapped_column("dietary_fiber", Float, nullable=True, comment="g")
saturated_fat: Mapped[float | None] = mapped_column(Float, nullable=True, comment="g")
# cholesterol, trans_fat 제거
```

---

## Fix 3. `GetOnboardingTool` URL 버그

### 증상
챗봇에서 온보딩 정보 조회 시 404 응답.

### 원인
`app/chatbot/tools/onboarding.py`에서 Spring Boot 엔드포인트 URL이 잘못됨.

```python
# 현재 (잘못된 URL)
response = requests.get(f"{SPRING_BASE_URL}/onboarding")

# 수정 필요
response = requests.get(f"{SPRING_BASE_URL}/profile")
```

Spring Boot 온보딩 조회 엔드포인트: `GET /profile` (not `/onboarding`)

---

## Fix 4. 음식 데이터 품질 필터링

### 증상
추천 결과에 "멀티 글루타치온 화이트닝"(보충제), "Autumn Park(가을공원)"(카페 메뉴) 등 비식품 항목 포함.

### 원인
`app/services/food_filter.py`가 알레르기·질환·비선호 기준만 필터링하고
보충제/화장품/음료 등 비식품 카테고리를 제외하지 않음.

### 요청 수정 방향
`fetch_and_filter_foods()`에 카테고리 기반 필터 또는 이상값 제외 로직 추가.

```python
# 예시: 100g당 칼로리 이상값 제외 (선택적)
.where(or_(Food.calories == None, Food.calories <= 1000))
```

또는 foods 테이블의 `category` 컬럼을 활용해 허용 카테고리 화이트리스트 적용.
