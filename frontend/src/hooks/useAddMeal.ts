import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mealService } from '../services';
import { queryKeys } from '../constants/queryKeys';
import { useAuthStore } from '../store/authStore';
import type { CreateMealRequest } from '../types';

/**
 * 식단 추가 훅
 * - userId는 authStore에서 자동 주입
 * - 캐시는 해당 날짜 + summary만 갱신
 */
export function useAddMeal() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId) ?? 1;

  return useMutation({
    mutationFn: (data: Omit<CreateMealRequest, 'userId'>) =>
        mealService.createMeal({ ...data, userId }),

    onSuccess: (_data, variables) => {
      // 날짜별 식단 갱신
      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.byDate(userId, variables.date),
      });

      // 요약 정보 갱신
      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.summary(userId, variables.date),
      });
    },
  });
}