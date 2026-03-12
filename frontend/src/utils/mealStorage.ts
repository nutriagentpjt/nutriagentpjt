export interface StoredMealEntry {
  id: number;
  name: string;
  calories: number;
  time: string;
  protein: number;
  carbs: number;
  fat: number;
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
