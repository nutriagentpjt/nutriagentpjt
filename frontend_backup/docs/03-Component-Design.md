# Component Design

## 1. 디렉토리 구조

```
src/
├── components/            # 재사용 가능한 컴포넌트
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Skeleton.tsx
│   ├── food/
│   │   ├── FoodCard.tsx
│   │   ├── FoodSearchInput.tsx
│   │   └── FoodList.tsx
│   ├── meal/
│   │   ├── MealCard.tsx
│   │   ├── MealTypeSelector.tsx
│   │   ├── MealTimeline.tsx
│   │   └── NutritionSummaryCard.tsx
│   ├── recommendation/
│   │   ├── RecommendationCard.tsx
│   │   ├── NutritionGapChart.tsx
│   │   ├── CoachingMessage.tsx
│   │   └── FeedbackButtons.tsx
│   ├── camera/
│   │   ├── CameraCapture.tsx
│   │   └── ImagePreview.tsx
│   └── chart/
│       ├── DonutChart.tsx
│       ├── BarChart.tsx
│       └── ProgressCircle.tsx
│
├── pages/                 # 페이지 컴포넌트
│   ├── Home/
│   │   └── HomePage.tsx
│   ├── MealRecording/
│   │   ├── FoodSearchPage.tsx
│   │   ├── ImageUploadPage.tsx
│   │   └── MealSavePage.tsx
│   ├── MealView/
│   │   └── DailyMealViewPage.tsx
│   ├── Recommendation/
│   │   ├── RecommendationPage.tsx
│   │   └── SettingsPage.tsx
│   ├── Onboarding/
│   │   ├── WelcomePage.tsx
│   │   ├── TDEECalculatorPage.tsx
│   │   └── GoalSettingPage.tsx
│   └── MyPage/
│       └── MyPage.tsx
│
├── layouts/              # 레이아웃 컴포넌트
│   ├── MainLayout.tsx
│   ├── TabNavigation.tsx
│   └── Header.tsx
│
├── hooks/                # Custom Hooks
│   ├── useApi.ts
│   ├── useMeals.ts
│   ├── useRecommendations.ts
│   ├── useDebounce.ts
│   └── useCamera.ts
│
├── services/             # API 서비스
│   ├── api.ts
│   ├── foodService.ts
│   ├── mealService.ts
│   └── recommendationService.ts
│
├── store/                # 상태 관리
│   ├── authStore.ts
│   ├── mealStore.ts
│   └── settingsStore.ts
│
├── types/                # TypeScript 타입
│   ├── food.ts
│   ├── meal.ts
│   ├── recommendation.ts
│   └── api.ts
│
└── utils/                # 유틸리티 함수
    ├── nutritionCalculator.ts
    ├── dateFormatter.ts
    └── validators.ts
```

## 2. 주요 컴포넌트 설계

### 2-1. FoodCard

```tsx
interface FoodCardProps {
  food: Food;
  onSelect: (food: Food) => void;
}

const FoodCard: React.FC<FoodCardProps> = ({ food, onSelect }) => {
  return (
    <Card onClick={() => onSelect(food)}>
      <h3>{food.name}</h3>
      <p>{food.calories} kcal ({food.weight}g 기준)</p>
      <NutrientBadges
        carbs={food.carbs}
        protein={food.protein}
        fat={food.fat}
      />
    </Card>
  );
};
```

### 2-2. MealCard

```tsx
interface MealCardProps {
  meal: Meal;
  onEdit?: (meal: Meal) => void;
  onDelete?: (mealId: number) => void;
}

const MealCard: React.FC<MealCardProps> = ({ meal, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Card>
      <div className="meal-header">
        <h4>{meal.foodName}</h4>
        <IconButton onClick={() => setShowMenu(true)}>•••</IconButton>
      </div>
      <p>{meal.amount}g</p>
      <NutritionInfo
        calories={meal.calories}
        carbs={meal.carbs}
        protein={meal.protein}
        fat={meal.fat}
      />
      {showMenu && (
        <BottomSheet onClose={() => setShowMenu(false)}>
          <MenuItem onClick={() => onEdit?.(meal)}>수정하기</MenuItem>
          <MenuItem onClick={() => onDelete?.(meal.id)}>삭제하기</MenuItem>
        </BottomSheet>
      )}
    </Card>
  );
};
```

### 2-3. NutritionSummaryCard

```tsx
interface NutritionSummaryCardProps {
  summary: NutritionSummary;
  target?: NutritionTarget;
}

const NutritionSummaryCard: React.FC<NutritionSummaryCardProps> = ({
  summary,
  target
}) => {
  return (
    <Card className="nutrition-summary">
      <h3>오늘의 영양소</h3>
      <div className="calories">
        <span className="value">{summary.totalCalories}</span>
        <span className="unit">kcal</span>
        {target && <span className="target">/ {target.calories}</span>}
      </div>

      {target && (
        <div className="progress-bars">
          <ProgressBar
            label="탄수화물"
            value={summary.totalCarbs}
            target={target.carbs}
          />
          <ProgressBar
            label="단백질"
            value={summary.totalProtein}
            target={target.protein}
          />
          <ProgressBar
            label="지방"
            value={summary.totalFat}
            target={target.fat}
          />
        </div>
      )}
    </Card>
  );
};
```

### 2-4. RecommendationCard

```tsx
interface RecommendationCardProps {
  recommendation: Recommendation;
  onSave: (recommendation: Recommendation) => void;
  onFeedback: (foodId: number, type: 'like' | 'dislike') => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onSave,
  onFeedback
}) => {
  return (
    <Card className="recommendation">
      <div className="header">
        <h4>{recommendation.foodName}</h4>
        <div className="score">⭐ {recommendation.score}</div>
      </div>

      <p className="amount">추천 섭취량: {recommendation.recommendedAmount}g</p>

      <NutritionInfo
        calories={recommendation.calories}
        carbs={recommendation.carbs}
        protein={recommendation.protein}
        fat={recommendation.fat}
      />

      <div className="reasons">
        {recommendation.reasons.map(reason => (
          <Badge key={reason}>#{reason}</Badge>
        ))}
      </div>

      <div className="actions">
        <FeedbackButtons
          onLike={() => onFeedback(recommendation.foodId, 'like')}
          onDislike={() => onFeedback(recommendation.foodId, 'dislike')}
        />
        <Button onClick={() => onSave(recommendation)}>저장하기</Button>
      </div>
    </Card>
  );
};
```

### 2-5. CameraCapture

```tsx
interface CameraCaptureProps {
  onCapture: (image: File) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(setStream)
      .catch(console.error);

    return () => stream?.getTracks().forEach(track => track.stop());
  }, []);

  const capture = () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    if (!video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      if (blob) onCapture(new File([blob], 'photo.jpg'));
    }, 'image/jpeg');
  };

  return (
    <div className="camera">
      <video ref={videoRef} autoPlay playsInline />
      <div className="controls">
        <Button onClick={onCancel}>취소</Button>
        <Button onClick={capture}>촬영</Button>
      </div>
    </div>
  );
};
```

## 3. 공통 컴포넌트

### Button
- variants: primary, secondary, outline, ghost
- sizes: sm, md, lg
- states: loading, disabled

### Input
- types: text, number, date
- validation states
- label, error message

### Modal
- overlay with backdrop
- close button
- custom content

### Toast
- positions: top, bottom
- types: success, error, info
- auto dismiss

### BottomSheet
- swipe to close
- backdrop
- custom height

## 4. 컴포넌트 패턴

### Composition Pattern
```tsx
<Card>
  <Card.Header>제목</Card.Header>
  <Card.Body>내용</Card.Body>
  <Card.Footer>버튼</Card.Footer>
</Card>
```

### Render Props Pattern
```tsx
<DataFetcher url="/api/meals">
  {({ data, loading, error }) => (
    loading ? <Skeleton /> : <MealList meals={data} />
  )}
</DataFetcher>
```

### Custom Hooks Pattern
```tsx
const { meals, loading, addMeal, deleteMeal } = useMeals(userId, date);
```

## 5. 스타일링 가이드

### Tailwind CSS (추천)
- 유틸리티 클래스 사용
- 커스텀 테마 설정
- 반응형 디자인

### CSS Modules (대안)
- 컴포넌트별 스타일 격리
- TypeScript 지원

### 색상 팔레트
```css
:root {
  --color-primary: #4CAF50;       /* 초록 */
  --color-secondary: #FF9800;     /* 오렌지 */
  --color-accent: #2196F3;        /* 파란색 */
  --color-danger: #F44336;        /* 빨간색 */
  --color-success: #8BC34A;       /* 밝은 초록 */
  --color-gray-100: #F5F5F5;
  --color-gray-900: #212121;
}
```
