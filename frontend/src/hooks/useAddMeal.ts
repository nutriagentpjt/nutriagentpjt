import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { mealService } from '../services';
import type { CreateMealRequest } from '../types';

/**
 * 식단 추가 훅
 * - 세션 쿠키 기반 요청
 * - 캐시는 해당 날짜 + summary만 갱신
 */
export function useAddMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMealRequest) => mealService.createMeal(data),

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
