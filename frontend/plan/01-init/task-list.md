# NutriAgent Frontend Task List

## Phase 1: 프로젝트 초기 설정

### 1.1 프로젝트 생성 및 기본 설정

- [ ] Vite + React + TypeScript 프로젝트 생성
- [ ] ESLint + Prettier 설정
- [ ] tsconfig.json 경로 별칭 설정 (`@/` → `src/`)
- [ ] .gitignore 설정
- [ ] 환경 변수 설정 (`.env.example`, `.env.local`)
  - [ ] `VITE_API_URL`

### 1.2 핵심 의존성 설치

- [ ] Tailwind CSS 설치 및 설정
  - [ ] `tailwind.config.js` 커스텀 설정 (색상 팔레트)
  - [ ] `globals.css` 설정
- [ ] React Router v6 설치
- [ ] Zustand 설치
- [ ] TanStack Query 설치
- [ ] Axios 설치
- [ ] React Hook Form + Zod 설치
- [ ] Recharts 또는 Chart.js 설치 (영양소 차트)
- [ ] react-webcam 설치 (카메라 기능)

### 1.3 디렉토리 구조 생성

- [ ] `src/components/` 구조 생성
  - [ ] `common/` - 재사용 컴포넌트
  - [ ] `food/` - 음식 관련
  - [ ] `meal/` - 식단 관련
  - [ ] `recommendation/` - 추천 관련
  - [ ] `camera/` - 카메라 관련
  - [ ] `chart/` - 차트 관련
- [ ] `src/pages/` 생성
- [ ] `src/hooks/` 생성
- [ ] `src/services/` 생성
- [ ] `src/store/` 생성
- [ ] `src/types/` 생성
- [ ] `src/utils/` 생성
- [ ] `src/layouts/` 생성

---

## Phase 2: 공통 인프라 구축

### 2.1 API 레이어 설정

- [ ] Axios 인스턴스 생성 (`services/api.ts`)
- [ ] 요청 인터셉터 설정
- [ ] 응답 인터셉터 설정 (에러 처리)
- [ ] API 에러 타입 정의 (`types/api.ts`)

### 2.2 TanStack Query 설정

- [ ] QueryClient 생성 및 설정
- [ ] QueryProvider 컴포넌트 생성
- [ ] 공통 Query Keys 정의

### 2.3 Zustand 스토어 생성

- [ ] `authStore.ts` - 인증 상태 (선택적)
- [ ] `mealStore.ts` - 선택된 음식, 날짜
- [ ] `settingsStore.ts` - UI 설정

### 2.4 라우터 설정

- [ ] 라우트 정의 (`App.tsx` 또는 `router.tsx`)
- [ ] 라우트 경로 상수 정의

### 2.5 레이아웃 컴포넌트

- [ ] `MainLayout` 템플릿 구현
- [ ] `TabNavigation` 컴포넌트 구현 (하단 탭)
- [ ] `Header` 컴포넌트 구현

### 2.6 타입 정의

- [ ] `types/food.ts` - Food, FoodSearchResponse
- [ ] `types/meal.ts` - Meal, MealType, CreateMealRequest
- [ ] `types/recommendation.ts` - Recommendation, RecommendationResponse
- [ ] `types/onboarding.ts` - UserProfile, OnboardingRequest

---

## Phase 3: 공통 컴포넌트 구현

### 3.1 기본 컴포넌트

- [ ] `Button` - variant(primary, secondary, outline), size, loading, disabled
- [ ] `Input` - type, placeholder, error 상태
- [ ] `Card` - 기본 카드 컨테이너
- [ ] `Badge` - 태그 표시 (추천 사유)
- [ ] `Spinner` - 로딩 인디케이터
- [ ] `Skeleton` - 로딩 플레이스홀더

### 3.2 유틸리티 컴포넌트

- [ ] `Toast` - 알림 토스트 (success, error, info)
- [ ] `Modal` - 공통 모달
- [ ] `BottomSheet` - 하단 시트
- [ ] `ProgressBar` - 진행률 바 (영양소 달성률)

---

## Phase 4: 식단 기록 - 음식 검색 (UC-004)

### 4.1 API 및 타입

- [ ] `services/foodService.ts` 구현
  - [ ] `searchFoods(keyword)` - GET /api/foods/search

### 4.2 훅 구현

- [ ] `hooks/useFoodSearch.ts` - 음식 검색 쿼리 (디바운싱)
- [ ] `hooks/useDebounce.ts` - 디바운싱 유틸 훅

### 4.3 컴포넌트

- [ ] `components/food/FoodSearchInput.tsx` - 검색창
- [ ] `components/food/FoodCard.tsx` - 음식 카드
- [ ] `components/food/FoodList.tsx` - 음식 리스트

### 4.4 페이지

- [ ] `pages/MealRecording/FoodSearchPage.tsx` - 음식 검색 페이지
  - [ ] 검색창
  - [ ] 검색 결과 리스트
  - [ ] 빈 상태 UI
  - [ ] 로딩 상태
  - [ ] 음식 선택 → state 저장 → 다음 화면

---

## Phase 5: 식단 기록 - 이미지 업로드 (UC-005)

### 5.1 API

- [ ] `services/mealService.ts` - `uploadImage(file)` - POST /api/meals/upload/image

### 5.2 훅

- [ ] `hooks/useCamera.ts` - 카메라 권한, 스트림 관리
- [ ] `hooks/useImageUpload.ts` - 이미지 업로드 뮤테이션

### 5.3 컴포넌트

- [ ] `components/camera/CameraCapture.tsx` - 카메라 컴포넌트
- [ ] `components/camera/ImagePreview.tsx` - 이미지 미리보기

### 5.4 페이지

- [ ] `pages/MealRecording/ImageUploadPage.tsx`
  - [ ] 바텀 시트 (카메라/갤러리 선택)
  - [ ] 카메라 화면
  - [ ] 미리보기 화면
  - [ ] 로딩 오버레이
  - [ ] OCR/분류 결과 모달 (신뢰도별 UI)
  - [ ] 에러 처리 (파일 크기, 형식, 인식 실패)

---

## Phase 6: 식단 기록 - 식단 저장 (UC-006)

### 6.1 API

- [ ] `services/mealService.ts`
  - [ ] `createMeal(data)` - POST /api/meals

### 6.2 훅

- [ ] `hooks/useAddMeal.ts` - 식단 저장 뮤테이션

### 6.3 컴포넌트

- [ ] `components/meal/MealTypeSelector.tsx` - 식사 시간대 선택
- [ ] `components/meal/NutritionPreview.tsx` - 예상 영양소 표시

### 6.4 페이지

- [ ] `pages/MealRecording/MealSavePage.tsx`
  - [ ] 선택된 음식 정보 표시
  - [ ] 섭취량 입력 (숫자 키패드)
  - [ ] 실시간 영양소 계산 (`utils/nutritionCalculator.ts`)
  - [ ] 식사 시간대 선택 (버튼 그룹)
  - [ ] 날짜 선택 (날짜 피커)
  - [ ] 저장 버튼
  - [ ] 유효성 검증 (React Hook Form + Zod)
  - [ ] 저장 후 일간 조회 화면으로 이동

---

## Phase 7: 식단 기록 - 식단 조회 (UC-007)

### 7.1 API

- [ ] `services/mealService.ts`
  - [ ] `getMeals(userId, date)` - GET /api/meals
  - [ ] `updateMeal(id, data)` - PUT /api/meals/:id
  - [ ] `deleteMeal(id)` - DELETE /api/meals/:id

### 7.2 훅

- [ ] `hooks/useMeals.ts` - 식단 조회 쿼리
- [ ] `hooks/useUpdateMeal.ts` - 식단 수정 뮤테이션
- [ ] `hooks/useDeleteMeal.ts` - 식단 삭제 뮤테이션

### 7.3 컴포넌트

- [ ] `components/meal/NutritionSummaryCard.tsx` - 영양소 요약 카드
  - [ ] 총 칼로리, 탄단지
  - [ ] 목표 대비 달성률 (프로그레스 바)
- [ ] `components/meal/MealCard.tsx` - 개별 식단 카드
  - [ ] 음식명, 섭취량, 영양소
  - [ ] [...] 메뉴 (수정/삭제)
- [ ] `components/meal/MealTimeline.tsx` - 시간대별 식단 목록

### 7.4 페이지

- [ ] `pages/MealView/DailyMealViewPage.tsx`
  - [ ] 헤더 (날짜, 좌우 화살표, 오늘 버튼)
  - [ ] 영양소 요약 카드
  - [ ] 시간대별 식단 목록 (아침/점심/저녁/간식)
  - [ ] 빈 상태 UI
  - [ ] Pull-to-refresh
  - [ ] 수정/삭제 기능

---

## Phase 8: 식단 추천 - 추천 조회 (UC-010)

### 8.1 API

- [ ] `services/recommendationService.ts`
  - [ ] `getRecommendations(userId, mealType, date, limit)` - GET /api/recommendations

### 8.2 훅

- [ ] `hooks/useRecommendations.ts` - 추천 조회 쿼리

### 8.3 컴포넌트

- [ ] `components/chart/DonutChart.tsx` - 도넛 차트 (칼로리 달성률)
- [ ] `components/chart/BarChart.tsx` - 바 차트 (영양소 갭)
- [ ] `components/recommendation/NutritionGapChart.tsx` - 갭 시각화
- [ ] `components/recommendation/CoachingMessage.tsx` - AI 코칭 메시지
- [ ] `components/recommendation/RecommendationCard.tsx` - 추천 음식 카드
  - [ ] 음식명, 추천 섭취량, 영양소
  - [ ] 추천 점수, 사유 태그
  - [ ] [저장하기] 버튼
  - [ ] 👍/👎 피드백 버튼

### 8.4 페이지

- [ ] `pages/Recommendation/RecommendationPage.tsx`
  - [ ] 식사 시간대 선택
  - [ ] 현재 상태 요약 카드
  - [ ] 영양소 갭 시각화
  - [ ] AI 코칭 메시지
  - [ ] 추천 음식 리스트
  - [ ] 온보딩 미완료 처리 (409 에러)

---

## Phase 9: 식단 추천 - 추가 기능 (UC-011~013)

### 9.1 API

- [ ] `services/recommendationService.ts`
  - [ ] `saveRecommendation(data)` - POST /api/recommendations/save
  - [ ] `saveSettings(data)` - POST /api/recommendations/settings
  - [ ] `getSettings(userId)` - GET /api/recommendations/settings
  - [ ] `submitFeedback(data)` - POST /api/recommendations/feedback
  - [ ] `recordEvent(data)` - POST /api/recommendations/events

### 9.2 훅

- [ ] `hooks/useSaveRecommendation.ts` - 추천 저장 뮤테이션
- [ ] `hooks/useRecommendationSettings.ts` - 설정 조회/저장
- [ ] `hooks/useSubmitFeedback.ts` - 피드백 제출

### 9.3 컴포넌트

- [ ] `components/recommendation/FeedbackButtons.tsx` - 👍/👎 버튼

### 9.4 페이지

- [ ] `pages/Recommendation/SettingsPage.tsx` - 추천 설정
  - [ ] 알레르기 음식 태그 입력
  - [ ] 비선호 음식 입력
  - [ ] 선호 음식 입력
  - [ ] 저장 버튼

---

## Phase 10: 온보딩 (UC-001)

### 10.1 API

- [ ] `services/onboardingService.ts`
  - [ ] `saveOnboarding(data)` - POST /api/onboarding
  - [ ] `getOnboarding(userId)` - GET /api/onboarding
  - [ ] `deleteOnboarding(userId)` - DELETE /api/onboarding

### 10.2 훅

- [ ] `hooks/useOnboarding.ts` - 온보딩 정보 조회
- [ ] `hooks/useSaveOnboarding.ts` - 온보딩 저장

### 10.3 유틸리티

- [ ] `utils/tdeeCalculator.ts` - TDEE 계산 함수

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

## Phase 11: 홈 화면

### 11.1 API

- [ ] `services/mealService.ts`
  - [ ] `getMealSummary(userId, date)` - GET /api/meals/summary

### 11.2 훅

- [ ] `hooks/useMealSummary.ts` - 식사 요약 조회

### 11.3 컴포넌트

- [ ] `components/chart/ProgressCircle.tsx` - 큰 프로그레스 서클

### 11.4 페이지

- [ ] `pages/Home/HomePage.tsx`
  - [ ] 오늘 날짜
  - [ ] 총 칼로리 / 목표 칼로리 (큰 프로그레스 서클)
  - [ ] 빠른 액션 버튼 ([식단 기록하기], [추천 받기])
  - [ ] 최근 식단 미리보기 (3개)
  - [ ] [전체 보기] 버튼
  - [ ] 주간 통계 (선택적)

---

## Phase 12: 마이페이지

### 12.1 페이지

- [ ] `pages/MyPage/MyPage.tsx`
  - [ ] 프로필 정보 표시
  - [ ] 목표 설정 수정 버튼 → 온보딩 플로우
  - [ ] 설정 메뉴
    - [ ] 알림 설정
    - [ ] 추천 설정 → SettingsPage
    - [ ] 로그아웃

---

## Phase 13: 테스트 및 최적화

### 13.1 테스트

- [ ] Vitest 설정
- [ ] React Testing Library 설정
- [ ] 주요 컴포넌트 단위 테스트
- [ ] 주요 훅 테스트

### 13.2 성능 최적화

- [ ] React.lazy 코드 스플리팅
- [ ] 이미지 최적화 (WebP, lazy loading)
- [ ] 번들 사이즈 분석
- [ ] Lighthouse 성능 점검

### 13.3 접근성

- [ ] ARIA 레이블 추가
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
