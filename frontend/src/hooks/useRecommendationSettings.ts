import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { recommendationService } from '@/services';
import type { RecommendationSettings } from '@/types';

interface UseRecommendationSettingsParams {
  userId: number;
  enabled?: boolean;
}

export function useRecommendationSettings({
  userId,
  enabled = true,
}: UseRecommendationSettingsParams) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.recommendations.settings(userId),
    queryFn: () => recommendationService.getSettings(userId),
    enabled: enabled && Boolean(userId),
  });

  const saveMutation = useMutation({
    mutationFn: (data: RecommendationSettings) => recommendationService.saveSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.settings(userId),
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
