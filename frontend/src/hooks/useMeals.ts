import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { mealService } from '../services';
import { formatDate } from '../utils';

export function useMeals(date: Date) {
  const dateStr = formatDate(date);

  return useQuery({
    queryKey: queryKeys.meals.byDate(dateStr),
    queryFn: () => mealService.getMeals(dateStr),
    enabled: Boolean(dateStr),
  });
}
