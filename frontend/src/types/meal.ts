// src/types/meal.ts

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
    id: number;
    userId: number;

    foodId: number;
    foodName: string;

    mealType: MealType;
    amount: number;

    date: string;       // YYYY-MM-DD
    createdAt: string;  // ISO timestamp

    calories: number;
    carbs: number;
    protein: number;
    fat: number;
}

export interface CreateMealRequest {
    userId: number;
    foodId: string;
    servings: number;
    date: string;
    mealTime: string;
}

export type UpdateMealRequest = Partial<CreateMealRequest>;

export interface MealSummaryResponse {
    date: string;
    totalCalories: number;
    totalCarbs: number;
    totalProtein: number;
    totalFat: number;
    meals: Meal[];
}