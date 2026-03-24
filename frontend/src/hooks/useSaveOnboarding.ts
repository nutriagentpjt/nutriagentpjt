import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { onboardingService } from '@/services';
import type { OnboardingRequest } from '@/types';

export function useSaveOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OnboardingRequest) => onboardingService.saveOnboarding(data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.onboarding.byUser(variables.userId), data);
    },
  });
}
