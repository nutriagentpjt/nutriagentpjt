import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { onboardingService } from '@/services';

interface UseOnboardingParams {
  enabled?: boolean;
}

export function useOnboarding({ enabled = true }: UseOnboardingParams = {}) {
  return useQuery({
    queryKey: queryKeys.onboarding.current(),
    queryFn: () => onboardingService.getOnboarding(),
    enabled,
  });
}
