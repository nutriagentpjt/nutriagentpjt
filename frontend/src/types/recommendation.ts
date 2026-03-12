import type { MealType } from './meal';

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

export interface NutritionGap {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export interface RecommendationResponse {
  setId: string;
  mealType: MealType;
  recommendations: Recommendation[];
  gap: NutritionGap;
  coachingMessage?: string;
}

export interface SaveRecommendationRequest {
  setId: string;
  foodId: number;
  mealType: MealType;
  date: string;
}

export interface RecommendationSettings {
  preferredMealTypes?: MealType[];
  excludedFoodIds?: number[];
}
