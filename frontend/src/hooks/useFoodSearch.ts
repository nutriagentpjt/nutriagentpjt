import { useQuery } from '@tanstack/react-query';
import { foodService } from '../services';
import { queryKeys } from '../constants/queryKeys';

export function useFoodSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.foods.search(query),
    queryFn: () => foodService.searchFoods(query),
    enabled: enabled && query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}