import api from './api';
import type { OnboardingRequest, OnboardingResponse } from '@/types/onboarding';

export const onboardingService = {
  saveOnboarding: async (data: OnboardingRequest): Promise<OnboardingResponse> => {
    const response = await api.post<OnboardingResponse>('/onboarding', data);
    return response.data;
  },

  getOnboarding: async (): Promise<OnboardingResponse> => {
    const response = await api.get<OnboardingResponse>('/onboarding');
    return response.data;
  },

  deleteOnboarding: () => api.delete('/onboarding'),
};
