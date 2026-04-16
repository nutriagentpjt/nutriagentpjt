# NutriAgent Frontend 시스템 설계

## 1. 기술 스택

| 구분 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **Framework** | React.js | 18.x | UI 라이브러리 |
| **Language** | TypeScript | 5.x | 타입 안정성 |
| **Build Tool** | Vite | 5.x | 빠른 개발 서버 및 번들링 |
| **Styling** | Tailwind CSS / Styled Components / CSS Modules | - | 유틸리티 기반 스타일링 (TBD) |
| **State** | Zustand | 4.x | 클라이언트 상태 관리 |
| **Server State** | TanStack Query (React Query) | 5.x | 서버 상태 관리, 캐싱 |
| **Routing** | React Router | 6.x | SPA 라우팅 |
| **HTTP Client** | Axios | 1.x | API 통신 |
| **Form** | React Hook Form | 7.x | 폼 상태 관리 |
| **Validation** | Zod | 3.x | 스키마 기반 유효성 검사 |
| **Charts** | Recharts / Chart.js | - | 영양소 시각화 (TBD) |
| **Camera** | react-webcam | - | 카메라 기능 |

---

## 2. 프로젝트 디렉토리 구조

```
src/
├── app/                        # 앱 초기화 및 프로바이더
│   ├── App.tsx                 # 메인 App 컴포넌트
│   ├── providers/              # Context Providers
│   │   ├── QueryProvider.tsx   # TanStack Query 설정
│   │   └── index.tsx           # Provider 통합
│   └── router/                 # 라우터 설정
│       ├── routes.tsx          # 라우트 정의
│       ├── ProtectedRoute.tsx  # 온보딩 확인 라우트 가드 (선택적)
│       └── index.tsx
│
├── components/                 # 재사용 가능한 컴포넌트
│   ├── common/                 # 공통 컴포넌트
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Badge/
│   │   ├── Spinner/
│   │   ├── Skeleton/
│   │   ├── Modal/
│   │   ├── Toast/
│   │   ├── ProgressBar/
│   │   └── index.ts
│   │
│   ├── food/                   # 음식 관련 컴포넌트
│   │   ├── FoodSearchInput.tsx
│   │   ├── FoodCard.tsx
│   │   ├── FoodList.tsx
│   │   └── index.ts
│   │
│   ├── meal/                   # 식단 관련 컴포넌트
│   │   ├── MealTypeSelector.tsx
│   │   ├── MealCard.tsx
│   │   ├── MealTimeline.tsx
│   │   ├── NutritionSummaryCard.tsx
│   │   ├── NutritionPreview.tsx
│   │   └── index.ts
│   │
│   ├── recommendation/         # 추천 관련 컴포넌트
│   │   ├── NutritionGapChart.tsx
│   │   ├── CoachingMessage.tsx
│   │   ├── RecommendationCard.tsx
│   │   ├── FeedbackButtons.tsx
│   │   └── index.ts
│   │
│   ├── camera/                 # 카메라 관련 컴포넌트
│   │   ├── CameraCapture.tsx
│   │   ├── ImagePreview.tsx
│   │   └── index.ts
│   │
│   └── chart/                  # 차트 컴포넌트
│       ├── DonutChart.tsx
│       ├── BarChart.tsx
│       ├── ProgressCircle.tsx
│       └── index.ts
│
├── pages/                      # 페이지 컴포넌트
│   ├── HomePage.tsx
│   ├── MealRecording/
│   │   ├── FoodSearchPage.tsx
│   │   ├── ImageUploadPage.tsx
│   │   ├── MealSavePage.tsx
│   │   └── index.ts
│   ├── MealView/
│   │   ├── DailyMealViewPage.tsx
│   │   └── index.ts
│   ├── Recommendation/
│   │   ├── RecommendationPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── index.ts
│   ├── Onboarding/
│   │   ├── WelcomePage.tsx
│   │   ├── TDEECalculatorPage.tsx
│   │   ├── GoalSettingPage.tsx
│   │   └── index.ts
│   ├── MyPage/
│   │   ├── MyPage.tsx
│   │   └── index.ts
│   └── NotFoundPage.tsx
│
├── hooks/                      # 커스텀 훅
│   ├── useFoodSearch.ts
│   ├── useDebounce.ts
│   ├── useMeals.ts
│   ├── useAddMeal.ts
│   ├── useUpdateMeal.ts
│   ├── useDeleteMeal.ts
│   ├── useRecommendations.ts
│   ├── useCamera.ts
│   ├── useImageUpload.ts
│   ├── useOnboarding.ts
│   ├── useMealSummary.ts
│   ├── useToast.ts
│   ├── useModal.ts
│   └── index.ts
│
├── services/                   # API 서비스 레이어
│   ├── api.ts                  # Axios 인스턴스
│   ├── foodService.ts
│   ├── mealService.ts
│   ├── recommendationService.ts
│   ├── onboardingService.ts
│   └── index.ts
│
├── store/                      # Zustand 스토어
│   ├── mealStore.ts            # 선택된 음식, 날짜
│   ├── uiStore.ts              # UI 상태 (모달, 토스트)
│   ├── settingsStore.ts        # UI 설정
│   └── index.ts
│
├── types/                      # 타입 정의
│   ├── food.ts
│   ├── meal.ts
│   ├── recommendation.ts
│   ├── onboarding.ts
│   ├── api.ts
│   └── index.ts
│
├── utils/                      # 유틸리티 함수
│   ├── nutritionCalculator.ts  # 영양소 계산
│   ├── tdeeCalculator.ts       # TDEE 계산
│   ├── dateFormatter.ts        # 날짜 포맷팅
│   ├── validation.ts           # 공통 유효성 검사
│   └── index.ts
│
├── layouts/                    # 레이아웃 컴포넌트
│   ├── MainLayout.tsx          # 메인 레이아웃 (하단 탭)
│   ├── Header.tsx
│   ├── TabNavigation.tsx
│   └── index.ts
│
├── constants/                  # 상수
│   ├── routes.ts
│   ├── queryKeys.ts
│   └── index.ts
│
├── styles/                     # 전역 스타일
│   ├── globals.css
│   └── fonts.css
│
└── main.tsx                    # 앱 진입점
```

---

## 3. 컴포넌트 설계

### 3.1 공통 컴포넌트 (Common)

| 컴포넌트 | 설명 | Props |
|---------|------|-------|
| `Button` | 버튼 | `variant` (primary, secondary, outline, danger), `size`, `loading`, `disabled` |
| `Input` | 텍스트 입력 | `type`, `placeholder`, `error`, `value`, `onChange` |
| `Card` | 카드 컨테이너 | `children`, `className` |
| `Badge` | 태그 표시 | `variant` (success, warning, info), `children` |
| `Spinner` | 로딩 스피너 | `size`, `color` |
| `Skeleton` | 로딩 플레이스홀더 | `width`, `height`, `variant` |
| `Modal` | 모달 | `isOpen`, `onClose`, `title`, `children` |
| `Toast` | 토스트 알림 | `message`, `type` (success, error, info) |
| `ProgressBar` | 진행률 바 | `value`, `max`, `color`, `label` |

### 3.2 음식 관련 컴포넌트 (Food)

| 컴포넌트 | 설명 | Props |
|---------|------|-------|
| `FoodSearchInput` | 검색창 (디바운싱 적용) | `value`, `onChange`, `onSearch` |
| `FoodCard` | 음식 카드 | `food: Food`, `onClick` |
| `FoodList` | 음식 리스트 | `foods: Food[]`, `onFoodClick` |

### 3.3 식단 관련 컴포넌트 (Meal)

| 컴포넌트 | 설명 | Props |
|---------|------|-------|
| `MealTypeSelector` | 식사 시간대 선택 | `value`, `onChange`, `options` |
| `MealCard` | 개별 식단 카드 | `meal: Meal`, `onEdit`, `onDelete` |
| `MealTimeline` | 시간대별 식단 목록 | `meals: Meal[]`, `onMealAction` |
| `NutritionSummaryCard` | 영양소 요약 카드 | `summary: NutritionSummary`, `goal?: Goal` |
| `NutritionPreview` | 예상 영양소 표시 | `nutrients: Nutrients` |

### 3.4 추천 관련 컴포넌트 (Recommendation)

| 컴포넌트 | 설명 | Props |
|---------|------|-------|
| `NutritionGapChart` | 영양소 갭 시각화 (바 차트) | `gap: NutritionGap` |
| `CoachingMessage` | AI 코칭 메시지 | `message: string` |
| `RecommendationCard` | 추천 음식 카드 | `recommendation: Recommendation`, `onSave`, `onFeedback` |
| `FeedbackButtons` | 👍/👎 버튼 | `onLike`, `onDislike` |

### 3.5 카메라 관련 컴포넌트 (Camera)

| 컴포넌트 | 설명 | Props |
|---------|------|-------|
| `CameraCapture` | 카메라 컴포넌트 | `onCapture`, `onCancel` |
| `ImagePreview` | 이미지 미리보기 | `image`, `onConfirm`, `onRetake` |

### 3.6 차트 컴포넌트 (Chart)

| 컴포넌트 | 설명 | Props |
|---------|------|-------|
| `DonutChart` | 도넛 차트 | `value`, `max`, `label` |
| `BarChart` | 바 차트 | `data`, `xKey`, `yKey` |
| `ProgressCircle` | 큰 프로그레스 서클 | `value`, `max`, `size` |

---

## 4. 상태 관리 설계

### 4.1 Zustand Store 구조

```typescript
// store/mealStore.ts
interface MealState {
  selectedFood: Food | null;
  selectedDate: string;
  selectedMealType: MealType | null;

  // Actions
  setSelectedFood: (food: Food | null) => void;
  setSelectedDate: (date: string) => void;
  setSelectedMealType: (type: MealType | null) => void;
  clearSelection: () => void;
}

// store/uiStore.ts
interface UIState {
  // Toast
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Modal
  activeModal: string | null;
  modalProps: Record<string, unknown>;
  openModal: (name: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;
}

// store/settingsStore.ts
interface SettingsState {
  theme: 'light' | 'dark';
  language: 'ko' | 'en';

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'ko' | 'en') => void;
}
```

### 4.2 TanStack Query 활용

서버 상태는 TanStack Query로 관리:

```typescript
// constants/queryKeys.ts
export const queryKeys = {
  foods: {
    all: ['foods'] as const,
    search: (keyword: string) => ['foods', 'search', keyword] as const,
  },
  meals: {
    all: ['meals'] as const,
    byDate: (userId: number, date: string) => ['meals', 'byDate', userId, date] as const,
    summary: (userId: number, date: string) => ['meals', 'summary', userId, date] as const,
  },
  recommendations: {
    all: ['recommendations'] as const,
    list: (userId: number, mealType: MealType, date: string) =>
      ['recommendations', 'list', userId, mealType, date] as const,
    settings: (userId: number) => ['recommendations', 'settings', userId] as const,
  },
  onboarding: {
    all: ['onboarding'] as const,
    byUser: (userId: number) => ['onboarding', 'byUser', userId] as const,
  },
  goals: {
    byUser: (userId: number) => ['goals', 'byUser', userId] as const,
  },
};

// 캐시 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5분
      gcTime: 1000 * 60 * 30,    // 30분
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 5. API 레이어 설계

### 5.1 Axios 인스턴스 설정

```typescript
// services/api.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (필요 시 토큰 첨부)
apiClient.interceptors.request.use((config) => {
  // 토큰이 있다면 첨부 (선택적)
  // const token = localStorage.getItem('token');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 에러 로깅 또는 공통 처리
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

### 5.2 API 함수 패턴

```typescript
// services/foodService.ts
export const foodService = {
  searchFoods: (keyword: string) =>
    apiClient.get<FoodSearchResponse>('/foods/search', { params: { keyword } }),
};

// services/mealService.ts
export const mealService = {
  getMeals: (userId: number, date: string) =>
    apiClient.get<MealListResponse>('/meals', { params: { userId, date } }),

  getMealSummary: (userId: number, date: string) =>
    apiClient.get<MealSummaryResponse>('/meals/summary', { params: { userId, date } }),

  createMeal: (data: CreateMealRequest) =>
    apiClient.post<CreateMealResponse>('/meals', data),

  updateMeal: (id: number, data: UpdateMealRequest) =>
    apiClient.put<UpdateMealResponse>(`/meals/${id}`, data),

  deleteMeal: (id: number) =>
    apiClient.delete(`/meals/${id}`),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post<ImageUploadResponse>('/meals/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// services/recommendationService.ts
export const recommendationService = {
  getRecommendations: (userId: number, mealType: MealType, date?: string, limit?: number) =>
    apiClient.get<RecommendationResponse>('/recommendations', {
      params: { userId, mealType, date, limit },
    }),

  saveRecommendation: (data: SaveRecommendationRequest) =>
    apiClient.post<SaveRecommendationResponse>('/recommendations/save', data),

  getSettings: (userId: number) =>
    apiClient.get<SettingsResponse>('/recommendations/settings', { params: { userId } }),

  saveSettings: (data: SaveSettingsRequest) =>
    apiClient.post<SaveSettingsResponse>('/recommendations/settings', data),

  submitFeedback: (data: FeedbackRequest) =>
    apiClient.post<FeedbackResponse>('/recommendations/feedback', data),

  recordEvent: (data: EventRequest) =>
    apiClient.post<EventResponse>('/recommendations/events', data),
};

// services/onboardingService.ts
export const onboardingService = {
  saveOnboarding: (data: OnboardingRequest) =>
    apiClient.post<OnboardingResponse>('/onboarding', data),

  getOnboarding: (userId: number) =>
    apiClient.get<OnboardingResponse>('/onboarding', { params: { userId } }),

  deleteOnboarding: (userId: number) =>
    apiClient.delete(`/onboarding?userId=${userId}`),
};
```

---

## 6. 라우팅 설계

### 6.1 라우트 정의

```typescript
// app/router/routes.tsx
export const routes = [
  // 홈
  { path: '/', element: <HomePage /> },

  // 온보딩
  { path: '/onboarding/welcome', element: <WelcomePage /> },
  { path: '/onboarding/tdee', element: <TDEECalculatorPage /> },
  { path: '/onboarding/goal', element: <GoalSettingPage /> },

  // 식단 기록
  { path: '/meals/search', element: <FoodSearchPage /> },
  { path: '/meals/upload', element: <ImageUploadPage /> },
  { path: '/meals/save', element: <MealSavePage /> },
  { path: '/meals', element: <DailyMealViewPage /> },

  // 식단 추천
  { path: '/recommendations', element: <RecommendationPage /> },
  { path: '/recommendations/settings', element: <SettingsPage /> },

  // 마이페이지
  { path: '/mypage', element: <MyPage /> },

  // 404
  { path: '*', element: <NotFoundPage /> },
];
```

### 6.2 라우트 상수

```typescript
// constants/routes.ts
export const ROUTES = {
  HOME: '/',

  // 온보딩
  ONBOARDING_WELCOME: '/onboarding/welcome',
  ONBOARDING_TDEE: '/onboarding/tdee',
  ONBOARDING_GOAL: '/onboarding/goal',

  // 식단 기록
  MEAL_SEARCH: '/meals/search',
  MEAL_UPLOAD: '/meals/upload',
  MEAL_SAVE: '/meals/save',
  MEAL_VIEW: '/meals',

  // 식단 추천
  RECOMMENDATION: '/recommendations',
  RECOMMENDATION_SETTINGS: '/recommendations/settings',

  // 마이페이지
  MYPAGE: '/mypage',
} as const;
```

---

## 7. 유틸리티 함수 설계

### 7.1 영양소 계산

```typescript
// utils/nutritionCalculator.ts
export const calculateNutrients = (
  baseNutrients: Nutrients,
  amount: number,
  servingSize: number
): Nutrients => {
  const ratio = amount / servingSize;
  return {
    calories: Math.round(baseNutrients.calories * ratio),
    carbs: parseFloat((baseNutrients.carbs * ratio).toFixed(1)),
    protein: parseFloat((baseNutrients.protein * ratio).toFixed(1)),
    fat: parseFloat((baseNutrients.fat * ratio).toFixed(1)),
  };
};

export const sumNutrients = (mealList: Meal[]): Nutrients => {
  return mealList.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      carbs: acc.carbs + meal.carbs,
      protein: acc.protein + meal.protein,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );
};

export const calculateAchievementRate = (
  consumed: number,
  goal: number
): number => {
  return Math.round((consumed / goal) * 100);
};
```

### 7.2 TDEE 계산

```typescript
// utils/tdeeCalculator.ts
export const calculateBMR = (
  gender: 'male' | 'female',
  weight: number,
  height: number,
  age: number
): number => {
  // Mifflin-St Jeor 공식
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

export const calculateTDEE = (
  bmr: number,
  activityLevel: ActivityLevel
): number => {
  const activityMultiplier = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return Math.round(bmr * activityMultiplier[activityLevel]);
};
```

---

## 8. 타입 정의 예시

```typescript
// types/food.ts
export interface Food {
  id: number;
  name: string;
  servingSize: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export interface FoodSearchResponse {
  foods: Food[];
  total: number;
}

// types/meal.ts
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: number;
  userId: number;
  foodId: number;
  foodName: string;
  mealType: MealType;
  amount: number;
  date: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  createdAt: string;
}

export interface CreateMealRequest {
  userId: number;
  foodId: number;
  mealType: MealType;
  amount: number;
  date: string;
}

export interface MealSummaryResponse {
  date: string;
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  meals: Meal[];
}

// types/recommendation.ts
export interface Recommendation {
  setId: string;
  foodId: number;
  foodName: string;
  recommendedAmount: number;
  score: number;
  reasons: string[];
  nutrients: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
}

export interface RecommendationResponse {
  setId: string;
  mealType: MealType;
  recommendations: Recommendation[];
  gap: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
  coachingMessage?: string;
}

// types/onboarding.ts
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface OnboardingRequest {
  userId: number;
  gender: 'male' | 'female';
  age: number;
  weight: number;
  height: number;
  activityLevel: ActivityLevel;
  goalCalories: number;
  goalCarbs: number;
  goalProtein: number;
  goalFat: number;
}

export interface OnboardingResponse {
  userId: number;
  gender: 'male' | 'female';
  age: number;
  weight: number;
  height: number;
  activityLevel: ActivityLevel;
  tdee: number;
  goalCalories: number;
  goalCarbs: number;
  goalProtein: number;
  goalFat: number;
}
```

---

## 9. 구현 우선순위

| 우선순위 | 영역 | 설명 |
|---------|------|------|
| P0 | 프로젝트 초기 설정 | Vite, React, TypeScript, 의존성 설치 |
| P0 | 디렉토리 구조 | 폴더 생성 |
| P0 | API 레이어 | Axios 설정, 인터셉터 |
| P0 | TanStack Query | QueryClient 설정 |
| P0 | Zustand | 스토어 생성 |
| P0 | 라우터 | React Router 설정 |
| P0 | 타입 정의 | 주요 타입 정의 |
| P1 | 공통 컴포넌트 | Button, Input, Card, Spinner 등 |
| P1 | 레이아웃 | MainLayout, Header, TabNavigation |
| P1 | 온보딩 | 온보딩 플로우 구현 |
| P2 | 식단 기록 | 음식 검색, 저장, 조회 |
| P2 | 식단 추천 | 추천 조회, 저장 |
| P2 | 홈 화면 | 대시보드 |
| P3 | 카메라 | 이미지 업로드 |
| P3 | 마이페이지 | 프로필, 설정 |
