import type { ApiError } from '@/types';

export function getApiErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const apiError = error as ApiError;
  const data = apiError.data;

  if (data && typeof data === 'object') {
    const payload = data as { error?: unknown; detail?: unknown; message?: unknown };

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }

    if (typeof payload.detail === 'string' && payload.detail.trim()) {
      return payload.detail;
    }

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
  }

  if (typeof apiError.message === 'string' && apiError.message.trim()) {
    return apiError.message;
  }

  return null;
}
