// src/utils/tdeeCalculator.ts

import type { ActivityLevel } from "../types/onboarding";

/**
 * BMR 계산 (Mifflin-St Jeor 공식)
 */
export const calculateBMR = (
    gender: "MALE" | "FEMALE",
    weight: number,
    height: number,
    age: number
): number => {
    if (gender === "MALE") {
        return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        return 10 * weight + 6.25 * height - 5 * age - 161;
    }
};

/**
 * TDEE 계산
 */
export const calculateTDEE = (
    bmr: number,
    activityLevel: ActivityLevel
): number => {
    const activityMultiplier: Record<ActivityLevel, number> = {
        SEDENTARY: 1.2,
        LIGHTLY_ACTIVE: 1.375,
        MODERATELY_ACTIVE: 1.55,
        VERY_ACTIVE: 1.725,
        EXTRA_ACTIVE: 1.9,
    };

    return Math.round(bmr * activityMultiplier[activityLevel]);
};
