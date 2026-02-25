import type { MealType } from "./meal";

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