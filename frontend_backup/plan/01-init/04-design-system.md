# NutriAgent Design System

## 1. Design Philosophy

### 1.1 Core Aesthetic: "Healthy & Motivating"

NutriAgent는 사용자가 건강한 식단을 관리하고 목표를 달성하도록 돕는 앱입니다. 디자인은 **활력 있고, 동기부여되며, 성장하는** 느낌을 전달해야 합니다.

**Vibe Keywords:**
- Fresh & Energetic (신선하고 에너지 넘치는)
- Growth & Achievement (성장과 성취)
- Clean & Modern (깔끔하고 현대적인)
- Supportive & Friendly (지원적이고 친근한)

**Visual Inspiration:**
- 비타민 병의 밝은 색상
- 신선한 채소와 과일의 생동감
- 성장하는 식물 (Progress)
- 모던한 헬스케어 앱 (MyFitnessPal, Noom의 깔끔함)

**Avoid:**
- Bootstrap-like generic styles (범용적인 부트스트랩 스타일)
- 무거운 다크 테마
- 과도한 그라데이션 또는 시각적 소음
- 차갑고 임상적인 느낌

---

## 2. Color Palette

### 2.1 Primary Colors

```css
:root {
  /* Primary - Fresh Green (성장, 건강, 활력) */
  --color-green-50: #F0FDF4;         /* 매우 밝은 배경 */
  --color-green-100: #DCFCE7;        /* 밝은 배경 */
  --color-green-200: #BBF7D0;        /* 강조 배경 */
  --color-green-500: #22C55E;        /* 메인 그린 */
  --color-green-600: #16A34A;        /* 그린 호버 */
  --color-green-700: #15803D;        /* 그린 액티브 */

  /* Secondary - Vibrant Orange (에너지, 비타민, 따뜻함) */
  --color-orange-50: #FFF7ED;
  --color-orange-100: #FFEDD5;
  --color-orange-200: #FED7AA;
  --color-orange-500: #F97316;       /* 메인 오렌지 */
  --color-orange-600: #EA580C;       /* 오렌지 호버 */
  --color-orange-700: #C2410C;       /* 오렌지 액티브 */

  /* Accent - Calm Blue (신뢰, 안정감) */
  --color-blue-50: #EFF6FF;
  --color-blue-100: #DBEAFE;
  --color-blue-500: #3B82F6;         /* 메인 블루 */
  --color-blue-600: #2563EB;         /* 블루 호버 */

  /* Neutrals - Clean & Modern */
  --color-gray-50: #F9FAFB;          /* 메인 배경 */
  --color-gray-100: #F3F4F6;         /* 섹션 구분 */
  --color-gray-200: #E5E7EB;         /* 보더 */
  --color-gray-300: #D1D5DB;         /* 디바이더 */
  --color-gray-400: #9CA3AF;         /* 비활성 텍스트 */
  --color-gray-600: #4B5563;         /* 보조 텍스트 */
  --color-gray-800: #1F2937;         /* 주요 텍스트 */
  --color-gray-900: #111827;         /* 강조 텍스트 */

  /* Semantic Colors */
  --color-success: #22C55E;          /* 성공, 목표 달성 */
  --color-warning: #F59E0B;          /* 경고, 주의 */
  --color-danger: #EF4444;           /* 위험, 초과 */
  --color-info: #3B82F6;             /* 정보 */

  /* White & Black */
  --color-white: #FFFFFF;
  --color-black: #000000;
}
```

### 2.2 Nutrition-specific Colors

영양소별로 일관된 색상을 사용하여 사용자가 빠르게 인식할 수 있도록 합니다.

```css
:root {
  /* Macronutrient Colors */
  --color-carbs: #3B82F6;            /* 탄수화물 - 파란색 */
  --color-protein: #22C55E;          /* 단백질 - 녹색 */
  --color-fat: #F97316;              /* 지방 - 오렌지색 */

  /* Achievement Status */
  --color-achievement-low: #EF4444;      /* 부족 - 빨간색 */
  --color-achievement-good: #22C55E;     /* 적정 - 녹색 */
  --color-achievement-over: #F59E0B;     /* 초과 - 주황색 */
}
```

---

## 3. Typography

### 3.1 Font Stack

```css
:root {
  /* Headings & Body - Clean Sans-serif */
  --font-primary: 'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Numbers - Monospace for alignment */
  --font-mono: 'SF Mono', 'Roboto Mono', 'Consolas', monospace;
}
```

**Font Loading:**
- Pretendard (Variable Font) - 한글 최적화
- Inter (Google Fonts) - 영문 fallback

### 3.2 Type Scale

```css
:root {
  /* Mobile-first 기준 */
  --text-xs: 0.75rem;     /* 12px - 캡션, 레이블 */
  --text-sm: 0.875rem;    /* 14px - 보조 텍스트 */
  --text-base: 1rem;      /* 16px - 본문 */
  --text-lg: 1.125rem;    /* 18px - 강조 본문 */
  --text-xl: 1.25rem;     /* 20px - 소제목 */
  --text-2xl: 1.5rem;     /* 24px - 제목 */
  --text-3xl: 1.875rem;   /* 30px - 대제목 */
  --text-4xl: 2.25rem;    /* 36px - 히어로 */

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### 3.3 Typography Styles

```css
/* 제목 - 깔끔하고 대담하게 */
.heading-1 {
  font-family: var(--font-primary);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: -0.02em;
  color: var(--color-gray-900);
}

.heading-2 {
  font-family: var(--font-primary);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  letter-spacing: -0.01em;
  color: var(--color-gray-800);
}

/* 본문 */
.body-text {
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--color-gray-800);
}

/* 숫자 (칼로리, 영양소) - Monospace로 정렬 */
.number-display {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--color-gray-900);
  letter-spacing: -0.02em;
}

.number-label {
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-gray-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
}
```

### 4.2 Border Radius

```css
:root {
  --radius-sm: 8px;     /* 작은 요소 (버튼, 인풋) */
  --radius-md: 12px;    /* 중간 요소 (카드) */
  --radius-lg: 16px;    /* 큰 요소 (섹션) */
  --radius-xl: 20px;    /* 매우 큰 요소 (모달) */
  --radius-full: 9999px; /* 완전 둥근 (아바타, 태그) */
}
```

### 4.3 Shadows

```css
:root {
  /* Soft, subtle shadows */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.10), 0 1px 2px -1px rgba(0, 0, 0, 0.10);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.10), 0 2px 4px -2px rgba(0, 0, 0, 0.10);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.10), 0 4px 6px -4px rgba(0, 0, 0, 0.10);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.10), 0 8px 10px -6px rgba(0, 0, 0, 0.10);

  /* Colored glow for emphasis */
  --shadow-green: 0 8px 16px -4px rgba(34, 197, 94, 0.3);
  --shadow-orange: 0 8px 16px -4px rgba(249, 115, 22, 0.3);
}
```

---

## 5. Components

### 5.1 Button

```css
/* Primary Button - Green (CTA) */
.btn-primary {
  background-color: var(--color-green-500);
  color: var(--color-white);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-sm);
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.btn-primary:hover {
  background-color: var(--color-green-600);
}

.btn-primary:active {
  transform: scale(0.98);
}

/* Secondary Button - Outline */
.btn-secondary {
  background-color: transparent;
  color: var(--color-green-600);
  border: 2px solid var(--color-green-500);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-sm);
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.btn-secondary:hover {
  background-color: var(--color-green-50);
}

/* Danger Button */
.btn-danger {
  background-color: var(--color-danger);
  color: var(--color-white);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-sm);
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  border: none;
  cursor: pointer;
}
```

### 5.2 Input

```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-sm);
  font-family: var(--font-primary);
  font-size: var(--text-base);
  color: var(--color-gray-900);
  background-color: var(--color-white);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-green-500);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.input.error {
  border-color: var(--color-danger);
}

.input.error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}
```

### 5.3 Card

```css
.card {
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* Food Card */
.food-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.food-card:hover {
  border-color: var(--color-green-500);
  box-shadow: var(--shadow-md);
}
```

### 5.4 Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-family: var(--font-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: 1;
}

/* Recommendation Reason Badges */
.badge-protein {
  background-color: var(--color-green-100);
  color: var(--color-green-700);
}

.badge-low-cal {
  background-color: var(--color-blue-100);
  color: var(--color-blue-700);
}

.badge-high-fiber {
  background-color: var(--color-orange-100);
  color: var(--color-orange-700);
}
```

### 5.5 Progress Bar

```css
.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

/* Nutrient-specific colors */
.progress-fill.carbs {
  background-color: var(--color-carbs);
}

.progress-fill.protein {
  background-color: var(--color-protein);
}

.progress-fill.fat {
  background-color: var(--color-fat);
}
```

### 5.6 Progress Circle

홈 화면의 큰 칼로리 달성률 표시용 컴포넌트.

```typescript
interface ProgressCircleProps {
  value: number;      // 현재 섭취 칼로리
  max: number;        // 목표 칼로리
  size?: number;      // 원 크기 (px)
}
```

```css
.progress-circle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-circle svg {
  transform: rotate(-90deg);
}

.progress-circle-bg {
  fill: none;
  stroke: var(--color-gray-200);
  stroke-width: 8;
}

.progress-circle-fill {
  fill: none;
  stroke: var(--color-green-500);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.progress-circle-text {
  position: absolute;
  text-align: center;
}
```

### 5.7 Nutrition Summary Card

```css
.nutrition-summary {
  background: linear-gradient(135deg, var(--color-green-50) 0%, var(--color-blue-50) 100%);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
}

.nutrition-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-gray-200);
}

.nutrition-item:last-child {
  border-bottom: none;
}
```

---

## 6. Motion & Interactions

### 6.1 Animation Tokens

```css
:root {
  /* Durations */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;

  /* Easings */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 6.2 Page Transitions

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-enter {
  animation: fadeInUp var(--duration-slow) var(--ease-out) forwards;
}
```

### 6.3 Card Interactions

```css
.card-interactive {
  transition:
    transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
}

.card-interactive:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.card-interactive:active {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

### 6.4 Success Animation

저장 성공 시 체크 애니메이션:

```css
@keyframes checkmark {
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

.checkmark-icon {
  animation: checkmark 0.5s var(--ease-out) forwards;
}
```

---

## 7. Mobile-First Breakpoints

```css
:root {
  /* Mobile First - 320px 기준 */
  --breakpoint-sm: 375px;   /* Small Mobile */
  --breakpoint-md: 768px;   /* Tablet */
  --breakpoint-lg: 1024px;  /* Desktop */
  --breakpoint-xl: 1280px;  /* Large Desktop */
}
```

### 7.1 Layout Grid

```css
.container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 768px) {
  .container {
    max-width: 720px;
    padding: 0 var(--space-6);
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 960px;
  }
}
```

---

## 8. Accessibility

### 8.1 Focus States

```css
:focus-visible {
  outline: 2px solid var(--color-green-500);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### 8.2 Color Contrast

모든 텍스트는 WCAG 2.1 AA 기준(4.5:1)을 충족:
- `--color-gray-900` (#111827) on `--color-white` (#FFFFFF): 16.7:1
- `--color-gray-600` (#4B5563) on `--color-white` (#FFFFFF): 7.2:1

### 8.3 Touch Targets

모바일에서 최소 터치 영역 44px 보장:

```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

---

## 9. Tailwind CSS Configuration

```js
// tailwind.config.js
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        blue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
        },
        // Nutrition-specific
        carbs: '#3B82F6',
        protein: '#22C55E',
        fat: '#F97316',
      },
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'sans-serif'],
        mono: ['SF Mono', 'Roboto Mono', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.10), 0 1px 2px -1px rgba(0, 0, 0, 0.10)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.10), 0 2px 4px -2px rgba(0, 0, 0, 0.10)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.10), 0 4px 6px -4px rgba(0, 0, 0, 0.10)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.10), 0 8px 10px -6px rgba(0, 0, 0, 0.10)',
        'green': '0 8px 16px -4px rgba(34, 197, 94, 0.3)',
        'orange': '0 8px 16px -4px rgba(249, 115, 22, 0.3)',
      },
    },
  },
  plugins: [],
};
```

---

## 10. Implementation Checklist

### Phase 1: 기본 설정
- [ ] Google Fonts 연결 (Pretendard)
- [ ] CSS 변수 설정
- [ ] Tailwind 커스텀 테마 적용

### Phase 2: Atoms
- [ ] Button (primary, secondary, outline, danger)
- [ ] Input, Textarea
- [ ] Card
- [ ] Badge (영양소 태그)
- [ ] Spinner
- [ ] Skeleton
- [ ] ProgressBar
- [ ] ProgressCircle

### Phase 3: Molecules
- [ ] FoodCard
- [ ] MealCard
- [ ] NutritionSummaryCard
- [ ] RecommendationCard

### Phase 4: Organisms
- [ ] Header
- [ ] TabNavigation
- [ ] FoodList
- [ ] MealTimeline
- [ ] NutritionGapChart
- [ ] CoachingMessage

### Phase 5: Charts
- [ ] DonutChart (Recharts)
- [ ] BarChart (Recharts)
- [ ] ProgressCircle (Custom SVG)

---

## 11. UI 패턴 가이드

### 11.1 빈 상태 (Empty State)

```html
<div class="empty-state">
  <img src="/illustrations/empty-meals.svg" alt="" />
  <h3>아직 기록된 식단이 없습니다</h3>
  <p>오늘의 첫 식단을 기록해보세요!</p>
  <button class="btn-primary">+ 식단 추가하기</button>
</div>
```

### 11.2 로딩 상태

- **초기 로딩**: Skeleton UI (카드 형태)
- **액션 로딩**: 버튼 내 스피너
- **전체 화면 로딩**: 오버레이 + 스피너

### 11.3 에러 상태

- **필드 에러**: 빨간색 테두리 + 인라인 메시지
- **네트워크 에러**: 토스트 알림 + 재시도 버튼
- **서버 에러**: 모달 또는 토스트

### 11.4 성공 피드백

- 토스트 메시지 (2초)
- 체크 애니메이션
- 햅틱 피드백 (모바일)
