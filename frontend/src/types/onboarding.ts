export type Gender = 'MALE' | 'FEMALE';
export type HealthGoal =
  | 'DIET'
  | 'BULK_UP'
  | 'LEAN_MASS_UP'
  | 'MAINTAIN'
  | 'GENERAL_HEALTH';
export type OnboardingSaveHealthGoal = 'DIET' | 'BULK_UP' | 'LEAN_MASS_UP';
export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE';
export type ExerciseTime = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
export type MealPattern =
  | 'TWO_MEALS'
  | 'THREE_MEALS'
  | 'INTERMITTENT_FASTING'
  | 'MULTIPLE_SMALL_MEALS';
export type DietStyle =
  | 'VEGAN'
  | 'VEGETARIAN'
  | 'KETO'
  | 'LOW_CARB'
  | 'LOW_FAT'
  | 'HIGH_PROTEIN'
  | 'MEDITERRANEAN'
  | 'PALEO'
  | 'GLUTEN_FREE'
  | 'NONE';
export type Disease =
  | 'NONE'
  | 'ALLERGY'
  | 'DIABETES'
  | 'HYPERTENSION'
  | 'HYPERLIPIDEMIA'
  | 'HEART_DISEASE'
  | 'GOUT'
  | 'KIDNEY_DISEASE'
  | 'LIVER_DISEASE'
  | 'THYROID_DISEASE'
  | 'DIGESTIVE_DISORDER'
  | 'ANEMIA'
  | 'OSTEOPOROSIS';

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

export interface OnboardingDislikedFood {
  foodName: string;
  reason: string;
}

export interface OnboardingRequest {
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  healthGoal: OnboardingSaveHealthGoal;
  activityLevel: ActivityLevel;
  exerciseFrequency: number;
  exerciseTime?: ExerciseTime;
  mealPattern: MealPattern;
  preferredFoods: string[];
  dislikedFoods: string[];
  diseases: Disease[];
}

export interface OnboardingResponse {
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  healthGoal: HealthGoal;
  activityLevel: ActivityLevel;
  exerciseFrequency: number;
  exerciseTime?: ExerciseTime;
  mealPattern: MealPattern;
  preferredFoods: string[];
  dislikedFoods: OnboardingDislikedFood[];
  allergies: string[];
  diseases: Disease[];
  dietStyles: DietStyle[];
  waterIntakeGoal: number;
  constraints: OnboardingConstraints;
  completed?: boolean;
}

export interface SaveOnboardingInput {
  data: OnboardingRequest;
}
