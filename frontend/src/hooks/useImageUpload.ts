import { useMutation } from '@tanstack/react-query';
import { mealService } from '@/services';
import type { MealImageUploadResponse } from '@/types';
import { isSupportedImageFile } from '@/utils/imageFile';

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

interface UseImageUploadOptions {
  maxFileSize?: number;
}

interface ValidatedImageUploadPayload {
  file: File;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
  } = options;

  return useMutation<MealImageUploadResponse, Error, ValidatedImageUploadPayload>({
    mutationFn: async ({ file }) => {
      if (!isSupportedImageFile(file)) {
        throw new Error('지원하지 않는 이미지 형식입니다.');
      }

      if (file.size > maxFileSize) {
        throw new Error('이미지 파일 크기가 너무 큽니다.');
      }

      return mealService.uploadImage(file);
    },
  });
}
