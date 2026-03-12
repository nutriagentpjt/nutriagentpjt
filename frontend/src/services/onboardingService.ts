import api from './api';
import type { OnboardingRequest, OnboardingResponse } from '@/types/onboarding';

export const onboardingService = {
  saveOnboarding: async (data: OnboardingRequest): Promise<OnboardingResponse> => {
    const response = await api.post<OnboardingResponse>('/onboarding', data);
    return response.data;
  },

  getOnboarding: async (userId: number): Promise<OnboardingResponse> => {
    const response = await api.get<OnboardingResponse>('/onboarding', {
      params: { userId },
    });
    return response.data;
  },

  deleteOnboarding: (userId: number) =>
    api.delete('/onboarding', {
      params: { userId },
    }),
};
