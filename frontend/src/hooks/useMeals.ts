import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { mealService } from '../services';

export function useMeals(date: Date) {
  const dateStr = date.toISOString().split('T')[0] ?? '';

  return useQuery({
    queryKey: queryKeys.meals.byDate(dateStr),
    queryFn: () => mealService.getMeals(dateStr),
    enabled: Boolean(dateStr),
  });
}
