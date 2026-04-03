import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { onboardingService } from '@/services';

interface UseOnboardingParams {
  enabled?: boolean;
}

export function useOnboarding({ enabled = true }: UseOnboardingParams = {}) {
  return useQuery({
    queryKey: queryKeys.onboarding.current(),
    queryFn: async () => {
      try {
        return await onboardingService.getOnboarding();
      } catch (error) {
        if (typeof error === 'object' && error && 'status' in error && error.status === 404) {
          return null;
        }

        throw error;
      }
    },
    enabled,
  });
}
