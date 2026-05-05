import { useMutation } from '@tanstack/react-query';
import { recommendationService } from '@/services';

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: recommendationService.submitFeedback,
  });
}
