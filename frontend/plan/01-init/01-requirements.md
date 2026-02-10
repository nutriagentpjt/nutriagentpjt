# NutriAgent Frontend 요구사항 정리

## 1. 기능 요구사항 (UseCase 기반)

### 1.1 식단 기록 (Meal Recording)

| UseCase ID | UseCase 명 | 설명 | 프론트엔드 요구사항 |
|------------|-----------|------|-------------------|
| **UC-004** | 음식 검색 | 키워드로 음식 데이터베이스 검색 | - 실시간 검색 입력<br>- 디바운싱 (300ms)<br>- 검색 결과 리스트<br>- 음식 카드 (음식명, 칼로리, 탄단지, 제공량)<br>- 빈 상태 UI |
| **UC-005** | 이미지 기반 음식 입력 | 카메라/갤러리로 음식 사진 업로드 후 OCR/분류 | - 카메라 권한 요청<br>- 카메라 컴포넌트 (프리뷰, 촬영, 취소)<br>- 이미지 미리보기<br>- 로딩 오버레이<br>- OCR/분류 결과 모달 (신뢰도별 UI)<br>- 에러 처리 (파일 크기, 형식, 인식 실패) |
| **UC-006** | 식단 저장 | 선택한 음식의 섭취량과 시간대 입력 후 저장 | - 음식 정보 표시<br>- 섭취량 입력 (숫자 키패드)<br>- 실시간 영양소 계산<br>- 식사 시간대 선택 (버튼 그룹)<br>- 날짜 선택 (날짜 피커)<br>- 유효성 검증 (React Hook Form + Zod) |
| **UC-007** | 식단 조회 | 날짜별 섭취한 식단 목록 및 영양소 요약 조회 | - 날짜 선택 (좌우 화살표, 오늘 버튼)<br>- 영양소 요약 카드 (칼로리, 탄단지, 목표 대비 달성률)<br>- 시간대별 식단 목록<br>- 수정/삭제 액션<br>- Pull-to-refresh<br>- 빈 상태 UI |

### 1.2 식단 추천 (Meal Recommendation)

| UseCase ID | UseCase 명 | 설명 | 프론트엔드 요구사항 |
|------------|-----------|------|-------------------|
| **UC-010** | 식단 추천 조회 | 목표 대비 부족한 영양소 기반 추천 | - 식사 시간대 선택<br>- 현재 상태 요약 (도넛 차트)<br>- 영양소 갭 시각화 (바 차트)<br>- AI 코칭 메시지<br>- 추천 음식 카드 리스트<br>- 온보딩 미완료 처리 |
| **UC-011** | 추천 항목 저장 | 추천 받은 음식을 식단에 저장 | - 추천 음식 → 식단 저장 화면 이동<br>- 자동 입력 (음식, 섭취량, 시간대)<br>- 이벤트 기록 (save) |
| **UC-012** | 추천 설정 | 알레르기, 선호/비선호 음식 설정 | - 태그 입력 컴포넌트<br>- 알레르기/비선호/선호 음식 목록<br>- 저장 버튼 |
| **UC-013** | 추천 피드백 | 추천 결과에 대한 긍정/부정 피드백 제출 | - 👍/👎 버튼<br>- 피드백 제출 API<br>- 피드백 토스트 |

### 1.3 온보딩 (Onboarding)

| UseCase ID | UseCase 명 | 설명 | 프론트엔드 요구사항 |
|------------|-----------|------|-------------------|
| **UC-001** | 온보딩 플로우 | TDEE 계산 및 목표 설정 | - Step 1: 환영 화면<br>- Step 2: TDEE 계산기 (성별, 나이, 체중, 신장, 활동량)<br>- Step 3: 목표 설정 (칼로리, 탄단지 비율 슬라이더)<br>- 진행률 표시<br>- 실시간 계산 및 표시 |

### 1.4 대시보드 / 홈

| 기능 | 설명 | 프론트엔드 요구사항 |
|------|------|-------------------|
| 홈 화면 | 오늘의 영양소 요약 및 빠른 액션 | - 오늘 날짜<br>- 총 칼로리/목표 칼로리 (큰 프로그레스 서클)<br>- 빠른 액션 버튼 ([식단 기록하기], [추천 받기])<br>- 최근 식단 미리보기 (3개)<br>- 주간 통계 (선택적) |

### 1.5 마이페이지

| 기능 | 설명 | 프론트엔드 요구사항 |
|------|------|-------------------|
| 마이페이지 | 프로필 정보 및 설정 | - 프로필 정보 표시<br>- 목표 설정 수정 버튼<br>- 추천 설정 링크<br>- 로그아웃 |

---

## 2. 비기능 요구사항

### 2.1 성능

- **초기 로딩**: LCP(Largest Contentful Paint) 2.5초 이내
- **라우팅 전환**: 200ms 이내
- **API 응답 대기**: Skeleton UI 또는 로딩 스피너 표시
- **이미지 최적화**: 업로드 전 리사이징, WebP 변환 지원
- **번들 최적화**: Code splitting, Tree shaking, 초기 번들 < 200KB

### 2.2 UX/UI

- **Design Philosophy**: "Healthy & Motivating" - 건강하고 동기부여되는 느낌
- **색상 팔레트**:
  - Primary: 초록색 계열 (건강, 성장)
  - Secondary: 오렌지 계열 (에너지, 비타민)
  - Accent: 파란색 (신뢰)
  - Danger: 빨간색 (초과, 경고)
- **타이포그래피**: 읽기 편한 Sans-serif, 숫자는 Monospace
- **Clean, modern design**: Bootstrap 스타일 지양

### 2.3 접근성 (a11y)

- **키보드 네비게이션**: 모든 인터랙티브 요소 키보드 접근 가능
- **스크린 리더 지원**: ARIA 레이블 적용
- **색상 대비**: WCAG 2.1 AA 기준 충족
- **터치 영역**: 최소 44x44px

### 2.4 반응형 디자인

- **Mobile First**: 320px ~ 768px (모바일)
- **Tablet**: 768px ~ 1024px
- **Desktop**: 1024px 이상

### 2.5 상태 관리

- **클라이언트 상태**: Zustand (UI 상태, 폼 상태)
- **서버 상태**: TanStack Query (API 데이터, 캐싱, 동기화)

---

## 3. 페이지별 요구사항

### 3.1 공통

- **헤더**: 페이지 제목, 뒤로가기 버튼
- **하단 탭 네비게이션**: 홈, 기록, 추천, 마이페이지
- **토스트 알림**: 성공/에러 메시지 표시
- **모달**: 확인/경고/정보 모달

### 3.2 식단 기록 페이지

| 페이지 | 경로 | 주요 요소 |
|-------|------|----------|
| 음식 검색 | `/meals/search` | 검색창, 검색 결과 리스트, 사진 업로드 버튼 |
| 이미지 업로드 | `/meals/upload` | 카메라 컴포넌트, 이미지 미리보기, OCR 결과 모달 |
| 식단 저장 | `/meals/save` | 음식 정보, 섭취량 입력, 식사 시간대 선택, 날짜 선택, 저장 버튼 |
| 식단 조회 | `/meals` | 날짜 선택, 영양소 요약 카드, 시간대별 식단 목록 |

### 3.3 식단 추천 페이지

| 페이지 | 경로 | 주요 요소 |
|-------|------|----------|
| 추천 조회 | `/recommendations` | 식사 시간대 선택, 현재 상태 요약, 영양소 갭 차트, AI 코칭, 추천 음식 리스트 |
| 추천 설정 | `/recommendations/settings` | 알레르기/비선호/선호 음식 입력, 저장 버튼 |

### 3.4 온보딩 페이지

| 페이지 | 경로 | 주요 요소 |
|-------|------|----------|
| 환영 화면 | `/onboarding/welcome` | 환영 메시지, 일러스트, [시작하기] 버튼 |
| TDEE 계산 | `/onboarding/tdee` | 성별, 나이, 체중, 신장, 활동량 입력, 실시간 TDEE 표시 |
| 목표 설정 | `/onboarding/goal` | 목표 칼로리, 탄단지 비율 슬라이더, 실시간 그램 표시 |

### 3.5 홈 페이지

| 페이지 | 경로 | 주요 요소 |
|-------|------|----------|
| 홈 | `/` | 오늘 날짜, 칼로리 프로그레스 서클, 빠른 액션, 최근 식단, 주간 통계 |

### 3.6 마이페이지

| 페이지 | 경로 | 주요 요소 |
|-------|------|----------|
| 마이페이지 | `/mypage` | 프로필 정보, 목표 설정 수정, 추천 설정, 로그아웃 |

---

## 4. API 연동 요약

| 영역 | 주요 엔드포인트 |
|------|----------------|
| **음식 검색** | `GET /api/foods/search` |
| **이미지 업로드** | `POST /api/meals/upload/image` |
| **음식 분류** | `POST /api/foods/classify` |
| **식단 기록** | `POST /api/meals` |
| **식단 조회** | `GET /api/meals` |
| **식단 수정** | `PUT /api/meals/:id` |
| **식단 삭제** | `DELETE /api/meals/:id` |
| **식사 요약** | `GET /api/meals/summary` |
| **추천 조회** | `GET /api/recommendations` |
| **추천 저장** | `POST /api/recommendations/save` |
| **추천 설정 저장** | `POST /api/recommendations/settings` |
| **추천 설정 조회** | `GET /api/recommendations/settings` |
| **추천 피드백** | `POST /api/recommendations/feedback` |
| **추천 이벤트 기록** | `POST /api/recommendations/events` |
| **온보딩 정보 저장** | `POST /api/onboarding` |
| **온보딩 정보 조회** | `GET /api/onboarding` |
| **목표 정보 조회** | `GET /api/goals` |
| **AI 코칭** | `GET /api/coaching` |

---

## 5. 데이터 타입 정의 (주요)

### 5.1 음식 (Food)

```typescript
interface Food {
  id: number;
  name: string;
  servingSize: number;  // 1회 제공량 (g)
  calories: number;     // kcal
  carbs: number;        // 탄수화물 (g)
  protein: number;      // 단백질 (g)
  fat: number;          // 지방 (g)
}
```

### 5.2 식단 (Meal)

```typescript
interface Meal {
  id: number;
  userId: number;
  foodId: number;
  foodName: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  amount: number;       // 섭취량 (g)
  date: string;         // YYYY-MM-DD
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  createdAt: string;
}
```

### 5.3 추천 (Recommendation)

```typescript
interface Recommendation {
  setId: string;
  foodId: number;
  foodName: string;
  recommendedAmount: number;  // 추천 섭취량 (g)
  score: number;              // 추천 점수 (0-100)
  reasons: string[];          // 추천 사유 태그
  nutrients: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
}
```

### 5.4 온보딩 (Onboarding)

```typescript
interface OnboardingData {
  userId: number;
  gender: 'male' | 'female';
  age: number;
  weight: number;       // kg
  height: number;       // cm
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  tdee: number;         // 계산된 TDEE (kcal)
  goalCalories: number;
  goalCarbs: number;    // g
  goalProtein: number;  // g
  goalFat: number;      // g
}
```

---

## 6. 우선순위 정리

| 우선순위 | 기능 | 비고 |
|---------|------|------|
| **P0** | 프로젝트 초기 설정, 공통 컴포넌트 | Phase 1-3 |
| **P1** | 온보딩 (목표 설정) | 다른 기능의 전제 조건 |
| **P1** | 식단 기록 (검색, 저장, 조회) | 핵심 기능 |
| **P2** | 식단 기록 (이미지 업로드) | OCR/분류 의존 |
| **P2** | 식단 추천 (조회, 저장) | 식단 기록 후 가능 |
| **P2** | 홈 화면 | 대시보드 |
| **P3** | 추천 설정, 피드백 | 부가 기능 |
| **P3** | 마이페이지 | 프로필 관리 |
| **P4** | 테스트 및 최적화 | 기능 완성 후 |
