import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mealService } from '../services';
import { QUERY_KEYS } from '../constants/queryKeys';
import type { Meal } from '../types';

/**
 * 식단 수정 훅
 */
export function useUpdateMeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, meal }: { id: string; meal: Partial<Meal> }) => 
      mealService.updateMeal(id, meal),
    onSuccess: (data) => {
      // 해당 날짜의 식단 목록 갱신
      const dateStr = new Date(data.timestamp).toISOString().split('T')[0];
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MEALS.BY_DATE(dateStr),
      });
    },
  });
}
