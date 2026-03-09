import { useQuery } from '@tanstack/react-query';
import { foodService } from '../services';
import { queryKeys } from '../constants/queryKeys';

export function useFoodSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.foods.search(query),
    queryFn: async () => {
      const response = await foodService.searchFoods(query);
      return response.foods;
    },
    enabled: enabled && query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
