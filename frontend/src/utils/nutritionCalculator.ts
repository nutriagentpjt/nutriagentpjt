import type { Meal } from '../types';

interface NutrientValues {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export function calculateNutrients(baseNutrients: NutrientValues, amount: number, servingSize: number): NutrientValues {
  if (!servingSize || servingSize <= 0 || amount <= 0) {
    return {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
    };
  }

  const ratio = amount / servingSize;

  return {
    calories: Math.round(baseNutrients.calories * ratio),
    carbs: Math.round(baseNutrients.carbs * ratio * 10) / 10,
    protein: Math.round(baseNutrients.protein * ratio * 10) / 10,
    fat: Math.round(baseNutrients.fat * ratio * 10) / 10,
  };
}

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

export function calculatePercentage(current: number, goal: number): number {
  if (goal === 0) return 0;
  return Math.round((current / goal) * 100);
}

export function formatNutrition(value: number, unit: string): string {
  return `${Math.round(value)}${unit}`;
}
