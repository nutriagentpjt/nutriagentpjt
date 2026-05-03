# 프로젝트 구조

## 개요
모바일 영양 추적 프로젝트 NutriAgent의 구조 문서입니다.

## 디렉토리 구조

```
/
src
│
├── main.tsx                # 앱 엔트리
├── App.tsx                 # (구) 루트
│
├── app/                    # 🔵 앱 코어 레이어
│   ├── providers/          # 전역 Provider 모음
│   │   ├── QueryProvider.tsx
│   │   └── index.tsx
│   │
│   └── router/             # 라우팅 설정
│       ├── routes.tsx
│       ├── ProtectedRoute.tsx
│       └── index.ts
│
├── layouts/                # 🟢 레이아웃 계층
│   ├── MainLayout.tsx
│   └── index.ts
│
├── pages/                  # 🟡 페이지 (Route 단위)
│   ├── HomePage.tsx
│   ├── AIAgentPage.tsx
│   ├── StatsPage.tsx
│   └── ProfilePage.tsx
│
├── components/             # 🟣 UI + 도메인 컴포넌트
│   ├── ui/                 # shadcn UI
│   ├── meal/
│   ├── chart/
│   ├── common/
│   └── figma/
│
├── hooks/                  # 🟠 비즈니스 훅
│   ├── useMeals.ts
│   ├── useAddMeal.ts
│   ├── useUpdateMeal.ts
│   ├── useDeleteMeal.ts
│   ├── useFoodSearch.ts
│   └── ...
│
├── services/               # 🔴 API 계층
│   ├── api.ts
│   ├── mealService.ts
│   ├── foodService.ts
│   └── mockFoodService.ts
│
├── store/                  # 🟤 Zustand
│   ├── mealStore.ts
│   ├── settingsStore.ts
│   └── uiStore.ts
│
├── types/                  # 🟢 타입 정의
│   ├── meal.ts
│   ├── food.ts
│   └── api.ts
│
├── constants/              # 🟡 상수
│   ├── routes.ts
│   ├── queryKeys.ts
│   └── foodDatabase.ts
│
├── utils/                  # 🔵 순수 함수
│   ├── nutritionCalculator.ts
│   ├── validation.ts
│   └── dateFormatter.ts
│
├── data/                   # (임시 더미 데이터)
└── styles/
```
## 엔트리포인트

- src/main.tsx → React DOM 진입점
- src/app/App.tsx → 애플리케이션 루트
- /App.tsx (Figma Make 환경) → src/app/App.tsx로 위임

## 라우팅

- 모든 라우트는 /src/app/router/routes.tsx에서 관리
- react-router-dom 사용
- Layout 기반 중첩 라우팅 구조

import { createBrowserRouter } from "react-router-dom";

## 상태 관리
🔹 서버 상태 — TanStack Query
- API 데이터 캐싱
- 자동 리페치 및 무효화
- /src/hooks/에서 커스텀 훅으로 사용

🔹 클라이언트 상태 — Zustand
- UI 상태 (모달, 토스트 등)
- 사용자 설정
- /src/store/에서 관리

## API 레이어
- 모든 API 호출은 /src/services/를 통해 수행

export const activeFoodService =
  import.meta.env.DEV ? mockFoodService : foodService;

- 개발 환경에서는 Mock 사용
- 실제 API 전환은 한 줄 수정으로 가능

## 주요 디렉토리
src/
 ├─ app/         # 앱 루트, 라우터, 프로바이더
 ├─ pages/       # 페이지 컴포넌트
 ├─ components/  # 재사용 UI 컴포넌트
 ├─ services/    # API 레이어
 ├─ hooks/       # React Query 기반 커스텀 훅
 ├─ store/       # Zustand 스토어
 ├─ types/       # 타입 정의
 ├─ utils/       # 유틸 함수
```
```
## 마이그레이션 계획

### P0 완료
- [x] 프로젝트 초기 설정
- [x] API 레이어 (Axios)
- [x] TanStack Query 설정
- [x] Zustand 스토어
- [x] React Router 설정
- [x] 타입 정의
- [x] 커스텀 훅
- [x] 유틸리티 함수

### P1 진행 중
- [ ] 공통 컴포넌트
- [ ] 온보딩 플로우

### P2 예정
- [ ] 식단 기록 페이지
- [ ] 음식 검색
- [ ] 식단 편집

### P3 예정
- [ ] 카메라 기능
- [ ] 마이페이지
```
