# State Management

## 1. 상태 관리 전략

### 추천: Zustand 사용

**이유:**
- 간단한 API
- TypeScript 완벽 지원
- 보일러플레이트 최소화
- React Query와 잘 호환

**대안:** Context API (간단한 앱), Redux Toolkit (복잡한 앱)

## 2. Store 구조

### authStore.ts
```typescript
import create from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (credentials) => {
    const user = await authService.login(credentials);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },
}));
```

### mealStore.ts
```typescript
interface MealState {
  selectedFood: Food | null;
  selectedDate: string;
  setSelectedFood: (food: Food | null) => void;
  setSelectedDate: (date: string) => void;
}

export const useMealStore = create<MealState>((set) => ({
  selectedFood: null,
  selectedDate: new Date().toISOString().split('T')[0],

  setSelectedFood: (food) => set({ selectedFood: food }),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
```

### settingsStore.ts
```typescript
interface SettingsState {
  theme: 'light' | 'dark';
  notifications: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleNotifications: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'light',
  notifications: true,

  setTheme: (theme) => set({ theme }),
  toggleNotifications: () => set((state) => ({
    notifications: !state.notifications
  })),
}));
```

## 3. 서버 상태 관리: React Query

### 설치
```bash
npm install @tanstack/react-query
```

### 설정
```typescript
// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5분
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}
```

### Custom Hooks

#### useMeals
```typescript
export const useMeals = (userId: number, date: string) => {
  return useQuery({
    queryKey: ['meals', userId, date],
    queryFn: () => mealService.getMeals(userId, date),
  });
};
```

#### useAddMeal
```typescript
export const useAddMeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meal: CreateMealRequest) => mealService.createMeal(meal),
    onSuccess: (data, variables) => {
      // 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ['meals', variables.userId, variables.date]
      });

      toast.success('식단이 저장되었습니다');
    },
    onError: (error) => {
      toast.error('저장에 실패했습니다');
    },
  });
};
```

#### useRecommendations
```typescript
export const useRecommendations = (
  userId: number,
  mealType: MealType,
  date: string
) => {
  return useQuery({
    queryKey: ['recommendations', userId, mealType, date],
    queryFn: () => recommendationService.getRecommendations(userId, mealType, date),
    enabled: !!userId, // userId가 있을 때만 실행
  });
};
```

#### useFoodSearch
```typescript
export const useFoodSearch = (keyword: string) => {
  const debouncedKeyword = useDebounce(keyword, 300);

  return useQuery({
    queryKey: ['foods', 'search', debouncedKeyword],
    queryFn: () => foodService.searchFoods(debouncedKeyword),
    enabled: debouncedKeyword.length > 0,
  });
};
```

## 4. 로컬 상태 vs 서버 상태

### 로컬 상태 (Zustand)
- UI 상태 (모달 열림/닫힘, 선택된 탭)
- 임시 폼 데이터
- 사용자 설정
- 인증 상태

### 서버 상태 (React Query)
- API 데이터 (식단, 추천, 음식 검색)
- 캐싱이 필요한 데이터
- 무효화/재조회가 필요한 데이터

## 5. 폼 상태: React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const mealSchema = z.object({
  foodId: z.number(),
  amount: z.number().min(1).max(10000),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  date: z.string(),
});

type MealFormData = z.infer<typeof mealSchema>;

const MealSaveForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<MealFormData>({
    resolver: zodResolver(mealSchema),
  });

  const addMeal = useAddMeal();

  const onSubmit = (data: MealFormData) => {
    addMeal.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="number" {...register('amount')} />
      {errors.amount && <span>{errors.amount.message}</span>}

      <button type="submit">저장</button>
    </form>
  );
};
```

## 6. 상태 흐름 예시

### 식단 기록 플로우
```
1. FoodSearchPage
   ↓ (음식 선택)
   useMealStore.setSelectedFood(food)

2. MealSavePage
   ↓ (useMealStore.selectedFood 읽기)
   폼에 기본값 표시

3. 사용자 입력 (React Hook Form)

4. 저장 버튼 클릭
   ↓
   useAddMeal.mutate(data)

5. React Query
   ↓ (성공 시)
   - invalidateQueries(['meals'])
   - 토스트 표시
   - 라우팅 이동
```

## 7. 최적화 팁

### 메모이제이션
```typescript
const expensiveValue = useMemo(() => {
  return calculateNutrition(meals);
}, [meals]);
```

### 선택적 리렌더링
```typescript
// Zustand에서 특정 값만 구독
const selectedFood = useMealStore(state => state.selectedFood);
```

### React Query 프리페칭
```typescript
const queryClient = useQueryClient();

// 다음 페이지 데이터 미리 가져오기
queryClient.prefetchQuery({
  queryKey: ['meals', userId, nextDate],
  queryFn: () => mealService.getMeals(userId, nextDate),
});
```
