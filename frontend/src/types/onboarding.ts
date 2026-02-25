export type ActivityLevel =
    | "sedentary"
    | "light"
    | "moderate"
    | "active"
    | "very_active";

export interface OnboardingRequest {
    userId: number;
    gender: "male" | "female";
    age: number;
    weight: number;
    height: number;
    activityLevel: ActivityLevel;

    goalCalories: number;
    goalCarbs: number;
    goalProtein: number;
    goalFat: number;
}

export interface OnboardingResponse {
    userId: number;
    gender: "male" | "female";
    age: number;
    weight: number;
    height: number;
    activityLevel: ActivityLevel;

    tdee: number;

    goalCalories: number;
    goalCarbs: number;
    goalProtein: number;
    goalFat: number;

    completed?: boolean; // 백엔드에서 해당 필드를 주는 경우
}