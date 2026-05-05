import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { mealService } from '../services';
import type { UpdateMealRequest } from '../types';

/**
 * 식단 수정 훅
 * - 수정 후 해당 날짜 + summary invalidate
 */
export function useUpdateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      meal,
    }: {
      id: number;
      meal: UpdateMealRequest;
    }) => mealService.updateMeal(id, meal),

    onSuccess: (_data, variables) => {
      const date = variables.meal.date;

      if (!date) return;

      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.byDate(date),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.summary(date),
      });
    },
  });
}
