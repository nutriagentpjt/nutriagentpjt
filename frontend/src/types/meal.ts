export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: number;
  userId: number;
  foodId: number | string;
  foodName: string;
  mealType: MealType;
  amount: number;
  date: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  createdAt: string;
}

export interface CreateMealRequest {
  userId: number;
  foodId: number | string;
  mealType: MealType;
  amount: number;
  date: string;
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
