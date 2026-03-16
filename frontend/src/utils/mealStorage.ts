import type { MealType } from '@/types';

export interface StoredMealEntry {
  id: number;
  name: string;
  calories: number;
  time: string;
  protein: number;
  carbs: number;
  fat: number;
  mealType?: MealType;
  amount?: number;
}

export type StoredMealsByDate = Record<string, StoredMealEntry[]>;

const STORAGE_KEY = 'nutriagent_meals_v2';

export function getStoredMeals(): StoredMealsByDate {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as StoredMealsByDate) : {};
  } catch {
    return {};
  }
}

export function saveStoredMeals(mealsByDate: StoredMealsByDate) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mealsByDate));
}

export function appendStoredMeal(date: string, meal: StoredMealEntry) {
  const current = getStoredMeals();
  const next = {
    ...current,
    [date]: [...(current[date] ?? []), meal],
  };

  saveStoredMeals(next);
  return next;
}

export function deleteStoredMeal(date: string, mealId: number) {
  const current = getStoredMeals();
  const nextMeals = (current[date] ?? []).filter((meal) => meal.id !== mealId);
  const next = { ...current, [date]: nextMeals };

  if (nextMeals.length === 0) {
    delete next[date];
  }

  saveStoredMeals(next);
  return next;
}

export function updateStoredMeal(originalDate: string, nextDate: string, meal: StoredMealEntry) {
  const current = getStoredMeals();
  const sourceMeals = (current[originalDate] ?? []).filter((item) => item.id !== meal.id);
  const targetMeals = [...(current[nextDate] ?? []), meal];
  const next: StoredMealsByDate = {
    ...current,
    [nextDate]: targetMeals,
  };

  if (originalDate === nextDate) {
    next[nextDate] = [...sourceMeals, meal].sort((left, right) => left.time.localeCompare(right.time));
  } else {
    if (sourceMeals.length > 0) {
      next[originalDate] = sourceMeals;
    } else {
      delete next[originalDate];
    }
    next[nextDate] = targetMeals.sort((left, right) => left.time.localeCompare(right.time));
  }

  saveStoredMeals(next);
  return next;
}
