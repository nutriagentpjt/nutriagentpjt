import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { profileService } from '@/services/profileService';

interface UseNutritionTargetsParams {
  enabled?: boolean;
}

export function useNutritionTargets({ enabled = true }: UseNutritionTargetsParams = {}) {
  return useQuery({
    queryKey: queryKeys.goals.current(),
    queryFn: () => profileService.getNutritionTargets(),
    enabled,
  });
}
