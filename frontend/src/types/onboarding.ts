export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface UserProfile {
  userId: number;
  gender: 'male' | 'female';
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
}

export interface OnboardingResponse extends OnboardingRequest {
  tdee: number;
  completed?: boolean;
}
