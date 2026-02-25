import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mealService } from '../services';
import { queryKeys } from '../constants/queryKeys';
import { useAuthStore } from '../store/authStore';
import type { Meal } from '../types/';

/**
 * 식단 수정 훅
 * - 수정 후 해당 날짜 + summary invalidate
 */
export function useUpdateMeal() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId) ?? 1;

  return useMutation({
    mutationFn: ({
                   id,
                   meal,
                 }: {
      id: number;
      meal: Partial<Meal>;
    }) => mealService.updateMeal(id, meal),

    onSuccess: (_data, variables) => {
      const date = variables.meal.date;

      if (!date) return;

      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.byDate(userId, date),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.summary(userId, date),
      });
    },
  });
}