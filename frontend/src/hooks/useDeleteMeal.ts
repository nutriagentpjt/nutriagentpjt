import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mealService } from '../services';
import { queryKeys } from '../constants/queryKeys';
import { useAuthStore } from '../store/authStore';

/**
 * 식단 삭제 훅
 * - userId는 authStore에서 자동 사용
 * - 해당 날짜 + summary만 invalidate
 */
export function useDeleteMeal() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId) ?? 1;

  return useMutation({
    mutationFn: ({
                   id,
                   date,
                 }: {
      id: number;
      date: string;
    }) => mealService.deleteMeal(id),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.byDate(userId, variables.date),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.summary(userId, variables.date),
      });
    },
  });
}