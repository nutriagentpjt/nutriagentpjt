// src/utils/tdeeCalculator.ts

import type { ActivityLevel } from "../types/onboarding";

/**
 * BMR 계산 (Mifflin-St Jeor 공식)
 */
export const calculateBMR = (
    gender: "male" | "female",
    weight: number,
    height: number,
    age: number
): number => {
    if (gender === "male") {
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
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
    };

    return Math.round(bmr * activityMultiplier[activityLevel]);
};