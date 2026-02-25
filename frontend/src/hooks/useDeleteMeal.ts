import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mealService } from '../services';
import { QUERY_KEYS } from '../constants/queryKeys';

/**
 * 식단 삭제 훅
 */
export function useDeleteMeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => mealService.deleteMeal(id),
    onSuccess: () => {
      // 모든 식단 목록 갱신
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MEALS.ALL,
      });
    },
  });
}
