import { foodService } from './foodService';
import { mockFoodService } from './mockFoodService';

// 🔥 환경에 따라 자동 스위칭
export const activeFoodService =
    import.meta.env.DEV ? mockFoodService : foodService;

// 추후 mealService, recommendationService도 동일 패턴 적용 가능