import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { onboardingService } from '@/services';

interface UseOnboardingParams {
  userId: number;
  enabled?: boolean;
}

export function useOnboarding({ userId, enabled = true }: UseOnboardingParams) {
  return useQuery({
    queryKey: queryKeys.onboarding.byUser(userId),
    queryFn: () => onboardingService.getOnboarding(userId),
    enabled: enabled && Boolean(userId),
  });
}
