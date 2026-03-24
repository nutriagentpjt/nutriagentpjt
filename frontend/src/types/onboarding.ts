export type Gender = 'MALE' | 'FEMALE';
export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE'
  | 'EXTRA_ACTIVE';
export type DietStyle =
  | 'LEAN_MASS_UP'
  | 'CLEAN_BULK'
  | 'DIRTY_BULK'
  | 'CUTTING'
  | 'LOW_CARB';

export interface UserProfile {
  userId: number;
  gender: Gender;
  age: number;
  weight: number;
  height: number;
  activityLevel: ActivityLevel;
}

export interface OnboardingRequest extends UserProfile {
  goalCalories: number;
  goalCarbs: number;
  goalProtein: number;
  goalFat: number;
  dietStyles?: DietStyle[];
}

export interface OnboardingResponse extends OnboardingRequest {
  tdee: number;
  completed?: boolean;
}
