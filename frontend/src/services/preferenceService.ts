import api from './api';
import type {
  AddPreferenceFoodRequest,
  PreferenceResponse,
  PreferenceUpdateRequest,
  RemovePreferenceFoodRequest,
} from '@/types/profile';

export const preferenceService = {
  async getPreferences(): Promise<PreferenceResponse> {
    const response = await api.get<PreferenceResponse>('/api/preferences');
    return response.data;
  },

  async updatePreferences(data: PreferenceUpdateRequest): Promise<PreferenceResponse> {
    const response = await api.put<PreferenceResponse>('/api/preferences', data);
    return response.data;
  },

  async addFood(data: AddPreferenceFoodRequest): Promise<PreferenceResponse> {
    const response = await api.post<PreferenceResponse>('/api/preferences/foods', data);
    return response.data;
  },

  async removeFood(data: RemovePreferenceFoodRequest): Promise<PreferenceResponse> {
    const response = await api.delete<PreferenceResponse>('/api/preferences/foods', { data });
    return response.data;
  },
};
