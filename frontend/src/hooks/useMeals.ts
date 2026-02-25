import { useQuery } from '@tanstack/react-query';
import { mealService } from '../services';
import { QUERY_KEYS } from '../constants/queryKeys';

/**
 * 특정 날짜의 식단 조회 훅
 * @param date 날짜
 */
export function useMeals(date: Date) {
  const dateStr = date.toISOString().split('T')[0];
  
  return useQuery({
    queryKey: QUERY_KEYS.MEALS.BY_DATE(dateStr),
    queryFn: () => mealService.getMealsByDate(date),
    staleTime: 1 * 60 * 1000, // 1분
  });
}
