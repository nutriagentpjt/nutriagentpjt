import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { foodService } from '@/services';
import { useDebounce } from './useDebounce';

export function useFoodAutocomplete(query: string, enabled = true, debounceMs = 200, limit = 6) {
  const trimmedQuery = query.trim();
  const debouncedQuery = useDebounce(trimmedQuery, debounceMs);

  const autocompleteQuery = useQuery({
    queryKey: queryKeys.foods.autocomplete(debouncedQuery, limit),
    queryFn: () => foodService.autocompleteFoods(debouncedQuery, limit),
    enabled: enabled && debouncedQuery.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...autocompleteQuery,
    debouncedQuery,
    isDebouncing: trimmedQuery !== debouncedQuery,
  };
}
