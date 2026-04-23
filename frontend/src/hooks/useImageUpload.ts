import { useMutation } from '@tanstack/react-query';
import { mealService } from '@/services';
import type { MealImageUploadResponse } from '@/types';

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

interface UseImageUploadOptions {
  acceptedTypes?: string[];
  maxFileSize?: number;
}

interface ValidatedImageUploadPayload {
  file: File;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
  } = options;

  return useMutation<MealImageUploadResponse, Error, ValidatedImageUploadPayload>({
    mutationFn: async ({ file }) => {
      if (!acceptedTypes.includes(file.type)) {
        throw new Error('지원하지 않는 이미지 형식입니다.');
      }

      if (file.size > maxFileSize) {
        throw new Error('이미지 파일 크기가 너무 큽니다.');
      }

      return mealService.uploadImage(file);
    },
  });
}
