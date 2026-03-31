# NutriAgent Frontend Task List

## Phase 1: 프로젝트 초기 설정

### 1.1 프로젝트 생성 및 기본 설정

- [x] Vite + React + TypeScript 프로젝트 생성
- [x] ESLint + Prettier 설정
- [x] tsconfig.json 경로 별칭 설정 (`@/` → `src/`)
- [x] .gitignore 설정
- [x] 환경 변수 설정 (`.env.example`, `.env.local`)
  - [x] `VITE_API_URL`

### 1.2 핵심 의존성 설치

- [x] Tailwind CSS 설치 및 설정
  - [x] `tailwind.config.js` 커스텀 설정 (색상 팔레트)
  - [x] `globals.css` 설정
- [x] React Router v6 설치
- [x] Zustand 설치
- [x] TanStack Query 설치
- [x] Axios 설치
- [x] React Hook Form + Zod 설치
- [x] Recharts 또는 Chart.js 설치 (영양소 차트)
- [x] react-webcam 설치 (카메라 기능)

### 1.3 디렉토리 구조 생성

- [x] `src/components/` 구조 생성
  - [x] `common/` - 재사용 컴포넌트
  - [x] `food/` - 음식 관련
  - [x] `meal/` - 식단 관련
  - [x] `recommendation/` - 추천 관련
  - [x] `camera/` - 카메라 관련
  - [x] `chart/` - 차트 관련
- [x] `src/pages/` 생성
- [x] `src/hooks/` 생성
- [x] `src/services/` 생성
- [x] `src/store/` 생성
- [x] `src/types/` 생성
- [x] `src/utils/` 생성
- [x] `src/layouts/` 생성

---

## Phase 2: 공통 인프라 구축

### 2.1 API 레이어 설정

- [x] Axios 인스턴스 생성 (`services/api.ts`)
- [x] 요청 인터셉터 설정
- [x] 응답 인터셉터 설정 (에러 처리)
- [x] API 에러 타입 정의 (`types/api.ts`)

### 2.2 TanStack Query 설정

- [x] QueryClient 생성 및 설정
- [x] QueryProvider 컴포넌트 생성
- [x] 공통 Query Keys 정의

### 2.3 Zustand 스토어 생성

- [ ] `authStore.ts` - 인증 상태 (선택적)
- [x] `mealStore.ts` - 선택된 음식, 날짜
- [x] `settingsStore.ts` - UI 설정

### 2.4 라우터 설정

- [x] 라우트 정의 (`App.tsx` 또는 `router.tsx`)
- [x] 라우트 경로 상수 정의

### 2.5 레이아웃 컴포넌트

- [x] `MainLayout` 템플릿 구현
- [x] `TabNavigation` 컴포넌트 구현 (하단 탭)
- [x] `Header` 컴포넌트 구현

### 2.6 타입 정의

- [x] `types/food.ts` - Food, FoodSearchResponse
- [x] `types/meal.ts` - Meal, MealType, CreateMealRequest
- [x] `types/recommendation.ts` - Recommendation, RecommendationResponse
- [x] `types/onboarding.ts` - UserProfile, OnboardingRequest

---

## Phase 3: 공통 컴포넌트 구현

### 3.1 기본 컴포넌트

- [x] `Button` - variant(primary, secondary, outline), size, loading, disabled
- [x] `Input` - type, placeholder, error 상태
- [x] `Card` - 기본 카드 컨테이너
- [x] `Badge` - 태그 표시 (추천 사유)
- [x] `Spinner` - 로딩 인디케이터
- [x] `Skeleton` - 로딩 플레이스홀더

### 3.2 유틸리티 컴포넌트

- [x] `Toast` - 알림 토스트 (success, error, info)
- [x] `Modal` - 공통 모달
- [x] `BottomSheet` - 하단 시트
- [x] `ProgressBar` - 진행률 바 (영양소 달성률)

---

## Phase 4: 식단 기록 - 음식 검색 (UC-004)

### 4.1 API 및 타입

- [x] `services/foodService.ts` 구현
  - [x] `searchFoods(keyword)` - GET /api/foods/search

### 4.2 훅 구현

- [x] `hooks/useFoodSearch.ts` - 음식 검색 쿼리 (디바운싱)
- [x] `hooks/useDebounce.ts` - 디바운싱 유틸 훅

### 4.3 컴포넌트

- [x] `components/food/FoodSearchInput.tsx` - 검색창
- [x] `components/food/FoodCard.tsx` - 음식 카드
- [x] `components/food/FoodList.tsx` - 음식 리스트

### 4.4 페이지

- [x] `pages/MealRecording/FoodSearchPage.tsx` - 음식 검색 페이지
  - [x] 검색창
  - [x] 검색 결과 리스트
  - [x] 빈 상태 UI
  - [x] 로딩 상태
  - [x] 음식 선택 → state 저장 → 다음 화면

---

## Phase 5: 식단 기록 - 이미지 업로드 (UC-005)

### 5.1 API

- [x] `services/mealService.ts` - `uploadImage(file)` - POST /api/meals/upload/image

### 5.2 훅

- [ ] `hooks/useCamera.ts` - 카메라 권한, 스트림 관리
- [x] `hooks/useImageUpload.ts` - 이미지 업로드 뮤테이션

### 5.3 컴포넌트

- [ ] `components/camera/CameraCapture.tsx` - 카메라 컴포넌트
- [x] `components/camera/ImagePreview.tsx` - 이미지 미리보기

### 5.4 페이지

- [x] `pages/MealRecording/ImageUploadPage.tsx`
  - [x] 바텀 시트 (카메라/갤러리 선택)
  - [x] 카메라 화면
  - [x] 미리보기 화면
  - [ ] 로딩 오버레이
  - [ ] OCR/분류 결과 모달 (신뢰도별 UI)
  - [x] 에러 처리 (파일 크기, 형식, 인식 실패)

---

현재 기기의 기본 카메라/갤러리를 여는 방식을 우선 사용하고 있음. 
`hooks/useCamera.ts` - 카메라 권한, 스트림 관리
`components/camera/CameraCapture.tsx` - 카메라 컴포넌트
의 경우 구현은 되어있으나, 메인 플로우에 적용되지 않음. 이 부분은 추후 논의를 통해
앱 내부 스트림 카메라를 사용할지, 사용자 기기의 기본 카메라/갤러리를 사용할지 결정이 필요함.

로딩 오버레이 및 OCR/분류 결과 모달은 해당 파트와 병합이 이루어진 뒤 진행할 예정

## Phase 6: 식단 기록 - 식단 저장 (UC-006)

### 6.1 API

- [x] `services/mealService.ts`
  - [x] `createMeal(data)` - POST /api/meals

### 6.2 훅

- [x] `hooks/useAddMeal.ts` - 식단 저장 뮤테이션

### 6.3 컴포넌트

- [x] `components/meal/MealTypeSelector.tsx` - 식사 시간대 선택
- [x] `components/meal/NutritionPreview.tsx` - 예상 영양소 표시

### 6.4 페이지

- [x] `pages/MealRecording/MealSavePage.tsx`
  - [x] 선택된 음식 정보 표시
  - [x] 섭취량 입력 (숫자 키패드)
  - [x] 실시간 영양소 계산 (`utils/nutritionCalculator.ts`)
  - [x] 식사 시간대 선택 (버튼 그룹)
  - [x] 날짜 선택 (날짜 피커)
  - [x] 저장 버튼
  - [x] 유효성 검증 (React Hook Form + Zod)
  - [ ] 저장 후 일간 조회 화면으로 이동

---

저장 후 일간 조회 화면으로 이동의 경우 현재 UX대로 홈에 이미 위치해 있는 상태


## Phase 7: 식단 기록 - 식단 조회 (UC-007)

### 7.1 API

- [x] `services/mealService.ts`
  - [x] `getMeals(userId, date)` - GET /api/meals
  - [x] `updateMeal(id, data)` - PUT /api/meals/:id
  - [x] `deleteMeal(id)` - DELETE /api/meals/:id

### 7.2 훅

- [x] `hooks/useMeals.ts` - 식단 조회 쿼리
- [x] `hooks/useUpdateMeal.ts` - 식단 수정 뮤테이션
- [x] `hooks/useDeleteMeal.ts` - 식단 삭제 뮤테이션

### 7.3 컴포넌트

- [x] `components/meal/NutritionSummaryCard.tsx` - 영양소 요약 카드
  - [x] 총 칼로리, 탄단지
  - [x] 목표 대비 달성률 (프로그레스 바)
- [x] `components/meal/MealCard.tsx` - 개별 식단 카드
  - [x] 음식명, 섭취량, 영양소
  - [x] [...] 메뉴 (수정/삭제)
- [x] `components/meal/MealTimeline.tsx` - 시간대별 식단 목록

### 7.4 페이지

- [x] `pages/MealView/DailyMealViewPage.tsx`
  - [x] 헤더 (날짜, 좌우 화살표, 오늘 버튼)
  - [x] 영양소 요약 카드
  - [x] 시간대별 식단 목록 (아침/점심/저녁/간식)
  - [x] 빈 상태 UI
  - [x] Pull-to-refresh
  - [x] 수정/삭제 기능

---

## Phase 8: 식단 추천 - 추천 조회 (UC-010)

### 8.1 API

- [x] `services/recommendationService.ts`
  - [x] `getRecommendations(userId, mealType, date, limit)` - GET /api/recommendations

### 8.2 훅

- [x] `hooks/useRecommendations.ts` - 추천 조회 쿼리

### 8.3 컴포넌트

- [ ] `components/chart/DonutChart.tsx` - 도넛 차트 (칼로리 달성률)
- [ ] `components/chart/BarChart.tsx` - 바 차트 (영양소 갭)
- [ ] `components/recommendation/NutritionGapChart.tsx` - 갭 시각화
- [x] `components/recommendation/CoachingMessage.tsx` - AI 코칭 메시지
- [x] `components/recommendation/RecommendationCard.tsx` - 추천 음식 카드
  - [x] 음식명, 추천 섭취량, 영양소
  - [x] 추천 점수, 사유 태그
  - [x] [저장하기] 버튼
  - [x] 👍/👎 피드백 버튼

### 8.4 페이지

- [x] `pages/Recommendation/RecommendationPage.tsx`
  - [x] 식사 시간대 선택
  - [ ] 현재 상태 요약 카드
  - [ ] 영양소 갭 시각화
  - [ ] AI 코칭 메시지
  - [x] 추천 음식 리스트
  - [x] 온보딩 미완료 처리 (409 에러)

---

## Phase 9: 식단 추천 - 추가 기능 (UC-011~013)

### 9.1 API

- [x] `services/recommendationService.ts`
  - [x] `saveRecommendation(data)` - POST /api/recommendations/save
  - [x] `saveSettings(data)` - POST /api/recommendations/settings
  - [x] `getSettings(userId)` - GET /api/recommendations/settings
  - [x] `submitFeedback(data)` - POST /api/recommendations/feedback
  - [x] `recordEvent(data)` - POST /api/recommendations/events

### 9.2 훅

- [x] `hooks/useSaveRecommendation.ts` - 추천 저장 뮤테이션
- [x] `hooks/useRecommendationSettings.ts` - 설정 조회/저장
- [x] `hooks/useSubmitFeedback.ts` - 피드백 제출

### 9.3 컴포넌트

- [x] `components/recommendation/FeedbackButtons.tsx` - 👍/👎 버튼

### 9.4 페이지

- [ ] `pages/Recommendation/SettingsPage.tsx` - 추천 설정
  - [ ] 알레르기 음식 태그 입력
  - [ ] 비선호 음식 입력
  - [ ] 선호 음식 입력
  - [ ] 저장 버튼

---

추천 설정은 프로필(마이페이지)에서 수정을 가능하게 할지 고민 중

## Phase 10: 온보딩 (UC-001)

### 10.1 API

- [x] `services/onboardingService.ts`
  - [x] `saveOnboarding(data)` - POST /api/onboarding
  - [x] `getOnboarding(userId)` - GET /api/onboarding
  - [x] `deleteOnboarding(userId)` - DELETE /api/onboarding

### 10.2 훅

- [x] `hooks/useOnboarding.ts` - 온보딩 정보 조회
- [x] `hooks/useSaveOnboarding.ts` - 온보딩 저장

### 10.3 유틸리티

- [x] `utils/tdeeCalculator.ts` - TDEE 계산 함수

### 10.4 페이지

- [ ] `pages/Onboarding/WelcomePage.tsx` - Step 1
  - [ ] 환영 메시지, 일러스트
  - [ ] [시작하기] 버튼
- [ ] `pages/Onboarding/TDEECalculatorPage.tsx` - Step 2
  - [ ] 성별, 나이, 체중, 신장, 활동량 입력
  - [ ] 실시간 TDEE 계산 및 표시
  - [ ] [다음] 버튼
- [ ] `pages/Onboarding/GoalSettingPage.tsx` - Step 3
  - [ ] 목표 칼로리 입력
  - [ ] 영양소 비율 슬라이더 (탄단지)
  - [ ] 실시간 그램 계산
  - [ ] [완료] 버튼
  - [ ] 저장 후 메인 화면으로 이동

---

온보딩 페이지는 명세보다 세분화 및 구체화 된 상태

## Phase 11: 홈 화면

### 11.1 API

- [x] `services/mealService.ts`
  - [x] `getMealSummary(userId, date)` - GET /api/meals/summary

### 11.2 훅

- [x] `hooks/useMealSummary.ts` - 식사 요약 조회

### 11.3 컴포넌트

- [x] `components/chart/ProgressCircle.tsx` - 큰 프로그레스 서클

### 11.4 페이지

- [x] `pages/Home/HomePage.tsx`
  - [x] 오늘 날짜
  - [x] 총 칼로리 / 목표 칼로리 (큰 프로그레스 서클)
  - [x] 빠른 액션 버튼 ([식단 기록하기], [추천 받기])
  - [x] 최근 식단 미리보기 (3개)
  - [x] [전체 보기] 버튼
  - [ ] 주간 통계 (선택적)

---
최근 식단 미리보기는 홈 페이지에서 즉시 확인 혹은 헤더를 터치해 편집 가능

## Phase 12: 마이페이지

### 12.1 페이지

- [x] `pages/MyPage/MyPage.tsx`
  - [x] 프로필 정보 표시
  - [ ] 목표 설정 수정 버튼 → 온보딩 플로우
  - [x] 설정 메뉴
    - [x] 알림 설정
    - [x] 개인 설정 → SettingsPage
    - [x] 로그아웃

---

## Phase 13: 테스트 및 최적화

### 13.1 테스트

- [x] Vitest 설정
- [x] React Testing Library 설정
- [x] 주요 컴포넌트 단위 테스트
- [x] 주요 훅 테스트

### 13.2 성능 최적화

- [x] React.lazy 코드 스플리팅
- [ ] 이미지 최적화 (WebP, lazy loading)
- [x] 번들 사이즈 분석
- [ ] Lighthouse 성능 점검

### 13.3 접근성

- [x] ARIA 레이블 추가
- [ ] 키보드 네비게이션 점검
- [ ] 색상 대비 점검 (WCAG AA)
- [ ] 스크린 리더 테스트

---

## Phase 14: 배포 준비

### 14.1 빌드 설정

- [ ] 프로덕션 빌드 최적화
- [ ] 환경별 설정 분리

### 14.2 배포

- [ ] Docker 설정
- [ ] Vercel/Netlify 배포 설정
- [ ] CI/CD 파이프라인

---

## 우선순위 정리

| 우선순위 | Phase | 설명 |
|---------|-------|------|
| P0 | Phase 1-3 | 프로젝트 초기 설정 및 공통 컴포넌트 |
| P1 | Phase 4-7 | 식단 기록 (핵심 기능) |
| P1 | Phase 10 | 온보딩 (목표 설정) |
| P2 | Phase 8-9 | 식단 추천 |
| P2 | Phase 11 | 홈 화면 |
| P2 | Phase 12 | 마이페이지 |
| P3 | Phase 13 | 테스트 및 최적화 |
| P3 | Phase 14 | 배포 준비 |
