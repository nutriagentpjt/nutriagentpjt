import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { mealService } from '../services';

/**
 * 식단 삭제 훅
 * - 해당 날짜 + summary만 invalidate
 */
export function useDeleteMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
    }: {
      id: number;
      date: string;
    }) => mealService.deleteMeal(id),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.byDate(variables.date),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.summary(variables.date),
      });
    },
  });
}
