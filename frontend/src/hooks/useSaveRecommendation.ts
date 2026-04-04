import { useMutation } from '@tanstack/react-query';
import { recommendationService } from '@/services';

export function useSaveRecommendation() {
  return useMutation({
    mutationFn: recommendationService.saveRecommendation,
  });
}
