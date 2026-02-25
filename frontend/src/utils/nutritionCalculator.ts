import type { Meal } from '../types';

/**
 * 여러 식단의 영양소 합계 계산
 */
export function calculateTotalNutrition(meals: Meal[]) {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
      fiber: acc.fiber + meal.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

/**
 * 목표 대비 섭취량 퍼센트 계산
 */
export function calculatePercentage(current: number, goal: number): number {
  if (goal === 0) return 0;
  return Math.round((current / goal) * 100);
}

/**
 * 영양소 단위 포맷팅
 */
export function formatNutrition(value: number, unit: string): string {
  return `${Math.round(value)}${unit}`;
}
