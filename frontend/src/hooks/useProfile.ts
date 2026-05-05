import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { profileService } from '@/services/profileService';
import type { ProfileUpdateRequest } from '@/types/profile';

interface UseProfileParams {
  enabled?: boolean;
}

export function useProfile({ enabled = true }: UseProfileParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.profile.current(),
    queryFn: () => profileService.getProfile(),
    enabled,
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileUpdateRequest) => profileService.updateProfile(data),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile.current(), profile);
    },
  });

  return {
    ...query,
    updateProfile: updateMutation.mutate,
    updateProfileAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}
