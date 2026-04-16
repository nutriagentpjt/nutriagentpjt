import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { onboardingService } from '@/services';
import type { SaveOnboardingInput } from '@/types';

export function useSaveOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: SaveOnboardingInput) => onboardingService.saveOnboarding(data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.onboarding.current(), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.current() });
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.current() });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.current() });
    },
  });
}
