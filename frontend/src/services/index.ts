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
export * from './profileService';
export * from './preferenceService';
export * from './sessionService';

// recommendation
export * from './recommendationService';

// ai agent
export * from './aiAgentService';
