import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { MealType } from "../types/meal";

interface MealState {
    // -------------------
    //  도메인 선택 상태 (명세 기준)
    // -------------------

    selectedFoodId: number | null;
    selectedMealType: MealType | null;

    setSelectedFoodId: (id: number | null) => void;
    setSelectedMealType: (type: MealType | null) => void;

    clearSelection: () => void;

    // -------------------
    //  입력 UI 상태
    // -------------------

    selectedDate: string;
    amount: number;

    setSelectedDate: (date: string) => void;
    setAmount: (amount: number) => void;

    resetMealInput: () => void;
}

export const useMealStore = create<MealState>()(
    devtools(
        (set) => ({
            // -------------------
            // 선택 상태
            // -------------------
            selectedFoodId: null,
            selectedMealType: null,

            setSelectedFoodId: (id) => set({ selectedFoodId: id }),
            setSelectedMealType: (type) => set({ selectedMealType: type }),

            clearSelection: () =>
                set({
                    selectedFoodId: null,
                    selectedMealType: null,
                }),

            // -------------------
            // 입력 상태
            // -------------------
            selectedDate: new Date().toISOString().split("T")[0],
            amount: 1,

            setSelectedDate: (date) => set({ selectedDate: date }),
            setAmount: (amount) => set({ amount }),

            resetMealInput: () =>
                set({
                    amount: 1,
                }),
        }),
        { name: "MealStore" }
    )
);