import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface MealState {
    // 선택된 날짜 (ISO string)
    selectedDate: string;
    setSelectedDate: (date: string) => void;

    // 선택된 음식 ID
    selectedFoodId: string | null;
    setSelectedFoodId: (id: string | null) => void;

    // 섭취량
    servings: number;
    setServings: (servings: number) => void;

    // 식사 시간 (ISO string)
    mealTime: string;
    setMealTime: (time: string) => void;

    resetMealInput: () => void;
}

export const useMealStore = create<MealState>()(
    devtools(
        (set) => ({
            selectedDate: new Date().toISOString().split('T')[0],

            setSelectedDate: (date) => set({ selectedDate: date }),

            selectedFoodId: null,
            setSelectedFoodId: (id) => set({ selectedFoodId: id }),

            servings: 1,
            setServings: (servings) => set({ servings }),

            mealTime: new Date().toISOString(),
            setMealTime: (time) => set({ mealTime: time }),

            resetMealInput: () =>
                set({
                    selectedFoodId: null,
                    servings: 1,
                    mealTime: new Date().toISOString(),
                }),
        }),
        { name: 'MealStore' }
    )
);