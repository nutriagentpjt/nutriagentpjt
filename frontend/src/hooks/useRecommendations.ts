import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { recommendationService } from '@/services';
import type { MealType } from '@/types';

interface UseRecommendationsParams {
  userId: number;
  mealType: MealType;
  date: string;
  limit?: number;
  enabled?: boolean;
}

export function useRecommendations({
  userId,
  mealType,
  date,
  limit,
  enabled = true,
}: UseRecommendationsParams) {
  return useQuery({
    queryKey: queryKeys.recommendations.list(userId, mealType, date),
    queryFn: () => recommendationService.getRecommendations(userId, mealType, date, limit),
    enabled: enabled && Boolean(userId) && Boolean(mealType) && Boolean(date),
  });
}
