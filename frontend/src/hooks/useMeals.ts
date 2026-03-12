import { useQuery } from '@tanstack/react-query';
import { mealService } from '../services';
import { queryKeys } from '../constants/queryKeys';
import { useAuthStore } from '../store/authStore';

export function useMeals(date: Date) {
  const userId = useAuthStore((s) => s.userId) ?? 1;

  const dateStr = date.toISOString().split('T')[0];

  return useQuery({
    queryKey: queryKeys.meals.byDate(userId, dateStr),
    queryFn: () => mealService.getMeals(userId, dateStr),
    enabled: !!userId,
  });
}