import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { foodService } from '../services';
import { useDebounce } from './useDebounce';

export function useFoodSearch(query: string, enabled = true, debounceMs = 300) {
  const trimmedQuery = query.trim();
  const debouncedQuery = useDebounce(trimmedQuery, debounceMs);

  const searchQuery = useQuery({
    queryKey: queryKeys.foods.search(debouncedQuery),
    queryFn: async () => {
      const response = await foodService.searchFoods(debouncedQuery);
      return response.foods;
    },
    enabled: enabled && debouncedQuery.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...searchQuery,
    debouncedQuery,
    isDebouncing: trimmedQuery !== debouncedQuery,
  };
}
