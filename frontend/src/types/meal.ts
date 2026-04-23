export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ApiMealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
export type MealSource = 'manual' | 'recommendation';

export interface Meal {
  id: number;
  userId?: string;
  foodName: string;
  mealType: MealType;
  amount: number;
  date: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMealRequest {
  foodName: string;
  mealType: MealType;
  amount: number;
  date: string;
  source?: MealSource;
  setId?: string;
}

export interface UpdateMealRequest {
  amount?: number;
  mealType?: MealType;
  date?: string;
}

export interface MealListSummary {
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  targetCalories: number | null;
  targetCarbs: number | null;
  targetProtein: number | null;
  targetFat: number | null;
  caloriesAchievement: number | null;
  carbsAchievement: number | null;
  proteinAchievement: number | null;
  fatAchievement: number | null;
}

export interface MealListResponse {
  date: string;
  summary: MealListSummary;
  meals: Meal[];
}

export interface MealSummaryResponse {
  consumed: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
}

export interface MealImageRecognitionCandidate {
  id?: number | string;
  name: string;
  brand?: string;
  confidence?: number;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  servingSize?: number;
  servingUnit?: string;
}

export interface MealImageUploadResponse {
  imageUrl?: string;
  message?: string;
  confidence?: number;
  recognizedFoods: MealImageRecognitionCandidate[];
}
