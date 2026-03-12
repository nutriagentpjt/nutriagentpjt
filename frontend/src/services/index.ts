// food
import { foodService } from './foodService';
import { mockFoodService } from './mockFoodService';

export const activeFoodService =
    import.meta.env.DEV ? mockFoodService : foodService;

export * from './foodService';

// meal
export * from './mealService';

// onboarding
export * from './onboardingService';

// recommendation
export * from './recommendationService';