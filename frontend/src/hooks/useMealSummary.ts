import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { mealService } from '@/services';

interface UseMealSummaryParams {
  date: string;
  enabled?: boolean;
}

export function useMealSummary({ date, enabled = true }: UseMealSummaryParams) {
  return useQuery({
    queryKey: queryKeys.meals.summary(date),
    queryFn: () => mealService.getMealSummary(date),
    enabled: enabled && Boolean(date),
  });
}
