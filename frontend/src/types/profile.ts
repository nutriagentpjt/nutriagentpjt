import type {
  ActivityLevel,
  DietStyle,
  Disease,
  ExerciseTime,
  Gender,
  HealthGoal,
  MealPattern,
  OnboardingConstraints,
} from './onboarding';

export interface ProfileResponse {
  userId: string;
  age: number | null;
  gender: Gender | null;
  height: number | null;
  weight: number | null;
  healthGoal?: HealthGoal | null;
  activityLevel: ActivityLevel | null;
  exerciseFrequency?: number | null;
  exerciseTime?: ExerciseTime | null;
  mealPattern: MealPattern | null;
  allergies: string[] | null;
  diseases: Disease[] | null;
  dietStyles: DietStyle[] | null;
  waterIntakeGoal: number | null;
  constraints: OnboardingConstraints | null;
  preferredFoods?: string[] | null;
  dislikedFoods?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProfileUpdateRequest {
  age?: number;
  gender?: Gender;
  height?: number;
  weight?: number;
  activityLevel?: ActivityLevel;
  diseases?: Disease[];
}

export interface NutritionTargetResponse {
  target: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface NutritionTargetUpdateRequest {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface PreferenceResponse {
  mealPattern: MealPattern | null;
  preferredFoods: string[] | null;
  dislikedFoods: Array<{
    foodName: string;
    reason: string;
  }> | null;
  allergies: string[] | null;
  dietStyles: DietStyle[] | null;
  waterIntakeGoal: number | null;
  constraints: OnboardingConstraints | null;
  updatedAt?: string | null;
}

export type FoodPreferenceType = 'PREFERRED' | 'DISLIKED';

export interface AddPreferenceFoodRequest {
  type: FoodPreferenceType;
  foodName: string;
  reason?: string;
}

export interface RemovePreferenceFoodRequest {
  type: FoodPreferenceType;
  foodName: string;
}

export interface PreferenceUpdateRequest {
  mealPattern?: MealPattern;
  allergies?: string[];
  dietStyles?: DietStyle[];
  waterIntakeGoal?: number;
  constraints?: OnboardingConstraints;
}
