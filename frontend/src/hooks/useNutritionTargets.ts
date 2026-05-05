import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { profileService } from '@/services/profileService';
import type { NutritionTargetUpdateRequest } from '@/types/profile';

interface UseNutritionTargetsParams {
  enabled?: boolean;
}

export function useNutritionTargets({ enabled = true }: UseNutritionTargetsParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.goals.current(),
    queryFn: () => profileService.getNutritionTargets(),
    enabled,
  });

  const updateMutation = useMutation({
    mutationFn: (data: NutritionTargetUpdateRequest) => profileService.updateNutritionTargets(data),
    onSuccess: (targets) => {
      queryClient.setQueryData(queryKeys.goals.current(), targets);
    },
  });

  return {
    ...query,
    updateNutritionTargets: updateMutation.mutate,
    updateNutritionTargetsAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}
