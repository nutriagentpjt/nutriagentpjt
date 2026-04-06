import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { preferenceService } from '@/services/preferenceService';
import type { PreferenceUpdateRequest } from '@/types/profile';

interface UsePreferencesParams {
  enabled?: boolean;
}

export function usePreferences({ enabled = true }: UsePreferencesParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.preferences.current(),
    queryFn: () => preferenceService.getPreferences(),
    enabled,
  });

  const updateMutation = useMutation({
    mutationFn: (data: PreferenceUpdateRequest) => preferenceService.updatePreferences(data),
    onSuccess: (preferences) => {
      queryClient.setQueryData(queryKeys.preferences.current(), preferences);
    },
  });

  return {
    ...query,
    updatePreferences: updateMutation.mutate,
    updatePreferencesAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}
