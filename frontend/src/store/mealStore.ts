import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Food } from '@/types/food';
import type { MealType } from '@/types/meal';

interface MealState {
  selectedFood: Food | null;
  selectedFoodId: number | string | null;
  selectedDate: string;
  selectedMealType: MealType | null;
  amount: number;
  setSelectedFood: (food: Food | null) => void;
  setSelectedFoodId: (id: number | string | null) => void;
  setSelectedDate: (date: string) => void;
  setSelectedMealType: (type: MealType | null) => void;
  setAmount: (amount: number) => void;
  clearSelection: () => void;
  resetMealInput: () => void;
}

const today = new Date().toISOString().split('T')[0] ?? '';

export const useMealStore = create<MealState>()(
  devtools(
    (set) => ({
      selectedFood: null,
      selectedFoodId: null,
      selectedDate: today,
      selectedMealType: null,
      amount: 1,
      setSelectedFood: (food) =>
        set({ selectedFood: food, selectedFoodId: food?.id ?? null }),
      setSelectedFoodId: (id) => set({ selectedFoodId: id }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setSelectedMealType: (type) => set({ selectedMealType: type }),
      setAmount: (amount) => set({ amount }),
      clearSelection: () =>
        set({
          selectedFood: null,
          selectedFoodId: null,
          selectedMealType: null,
        }),
      resetMealInput: () =>
        set({
          selectedDate: today,
          amount: 1,
        }),
    }),
    { name: 'MealStore' },
  ),
);
