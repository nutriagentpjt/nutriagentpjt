import api from './api';
import type {
  NutritionTargetResponse,
  PreferenceResponse,
  ProfileResponse,
  ProfileUpdateRequest,
} from '@/types/profile';

export const profileService = {
  async getProfile(): Promise<ProfileResponse> {
    const response = await api.get<ProfileResponse>('/profile');
    return response.data;
  },

  async updateProfile(data: ProfileUpdateRequest): Promise<ProfileResponse> {
    const response = await api.put<ProfileResponse>('/profile', data);
    return response.data;
  },

  async getNutritionTargets(): Promise<NutritionTargetResponse> {
    const response = await api.get<NutritionTargetResponse>('/profiles/targets');
    return response.data;
  },

  async getPreferences(): Promise<PreferenceResponse> {
    const response = await api.get<PreferenceResponse>('/preferences');
    return response.data;
  },
};
