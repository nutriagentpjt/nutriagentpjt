import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { recommendationService } from '@/services';
import type { MealType } from '@/types';

interface UseRecommendationsParams {
  mealType: MealType;
  date: string;
  limit?: number;
  enabled?: boolean;
}

export function useRecommendations({
  mealType,
  date,
  limit,
  enabled = true,
}: UseRecommendationsParams) {
  return useQuery({
    queryKey: queryKeys.recommendations.list(mealType, date, limit),
    queryFn: () => recommendationService.getRecommendations(mealType, date, limit),
    enabled: enabled && Boolean(mealType) && Boolean(date),
  });
}
