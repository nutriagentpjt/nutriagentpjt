export type Gender = 'MALE' | 'FEMALE';
export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE'
  | 'EXTRA_ACTIVE';
export type MealPattern =
  | 'ONE_MEAL'
  | 'TWO_MEALS'
  | 'THREE_MEALS'
  | 'FOUR_OR_MORE_MEALS';
export type DietStyle =
  | 'LEAN_MASS_UP'
  | 'CLEAN_BULK'
  | 'DIRTY_BULK'
  | 'CUTTING'
  | 'LOW_CARB';
export type Disease =
  | 'DIABETES'
  | 'HYPERTENSION'
  | 'HYPERLIPIDEMIA'
  | 'HEART_DISEASE'
  | 'LIVER_DISEASE'
  | 'OBESITY';

export interface UserProfile {
  gender: Gender;
  age: number;
  weight: number;
  height: number;
  activityLevel: ActivityLevel;
  tdee: number;
  goalCalories: number;
  goalCarbs: number;
  goalProtein: number;
  goalFat: number;
  dietStyles?: DietStyle[];
  allergies?: string[];
  diseases?: Disease[];
  waterGoal?: number;
  mealsPerDay?: number;
  lowSodium?: boolean;
  lowSugar?: boolean;
  maxCaloriesPerMeal?: number;
}

export interface OnboardingConstraints {
  lowSodium: boolean;
  lowSugar: boolean;
  maxCaloriesPerMeal: number;
}

export interface OnboardingRequest {
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  activityLevel: ActivityLevel;
  mealPattern: MealPattern;
  allergies: string[];
  diseases: Disease[];
  dietStyles: DietStyle[];
  waterIntakeGoal: number;
  constraints: OnboardingConstraints;
}

export interface OnboardingResponse extends OnboardingRequest {
  completed?: boolean;
}

export interface SaveOnboardingInput {
  userId: number;
  data: OnboardingRequest;
}
