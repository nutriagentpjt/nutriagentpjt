export interface Meal {
    id: string;
    foodId: string;
    foodName: string;
    servings: number;

    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;

    date: string;        // YYYY-MM-DD
    mealTime: string;    // ISO string
}

export interface AddMealRequest {
    foodId: string;
    servings: number;
    date: string;
    mealTime: string;
}

export type UpdateMealRequest = Partial<AddMealRequest>;