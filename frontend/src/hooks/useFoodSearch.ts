import { useQuery } from '@tanstack/react-query';
import { foodService } from '../services';
import { QUERY_KEYS } from '../constants/queryKeys';

/**
 * 음식 검색 훅
 * @param query 검색어
 * @param enabled 검색 활성화 여부
 */
export function useFoodSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.FOODS.SEARCH(query),
    queryFn: () => foodService.searchFoods(query),
    enabled: enabled && query.length > 0,
    staleTime: 5 * 60 * 1000, // 5분
  });
}
