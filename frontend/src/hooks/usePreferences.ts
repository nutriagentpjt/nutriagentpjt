import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { preferenceService } from '@/services/preferenceService';

interface UsePreferencesParams {
  enabled?: boolean;
}

export function usePreferences({ enabled = true }: UsePreferencesParams = {}) {
  return useQuery({
    queryKey: queryKeys.preferences.current(),
    queryFn: () => preferenceService.getPreferences(),
    enabled,
  });
}
