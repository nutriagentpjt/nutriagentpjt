import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { recommendationService } from '@/services';
import type { RecommendationSettings } from '@/types';

interface UseRecommendationSettingsParams {
  enabled?: boolean;
}

export function useRecommendationSettings({ enabled = true }: UseRecommendationSettingsParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.recommendations.settings(),
    queryFn: () => recommendationService.getSettings(),
    enabled,
  });

  const saveMutation = useMutation({
    mutationFn: (data: RecommendationSettings) => recommendationService.saveSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.settings(),
      });
    },
  });

  return {
    ...query,
    saveSettings: saveMutation.mutate,
    saveSettingsAsync: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
  };
}
