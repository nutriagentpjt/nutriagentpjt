import api from './api';
import type {
  MealType,
  RecommendationEventRequest,
  RecommendationFeedbackRequest,
  RecommendationResponse,
  RecommendationSettings,
  SaveRecommendationRequest,
} from '@/types';

export const recommendationService = {
  async getRecommendations(
    userId: number,
    mealType: MealType,
    date?: string,
    limit?: number,
  ): Promise<RecommendationResponse> {
    const response = await api.get<RecommendationResponse>('/recommendations', {
      params: { userId, mealType, date, limit },
    });
    return response.data;
  },

  saveRecommendation: (data: SaveRecommendationRequest) =>
    api.post('/recommendations/save', data),

  async getSettings(userId: number): Promise<RecommendationSettings> {
    const response = await api.get<RecommendationSettings>('/recommendations/settings', {
      params: { userId },
    });
    return response.data;
  },

  saveSettings: (data: RecommendationSettings) =>
    api.post('/recommendations/settings', data),

  submitFeedback: (data: RecommendationFeedbackRequest) =>
    api.post('/recommendations/feedback', data),

  recordEvent: (data: RecommendationEventRequest) =>
    api.post('/recommendations/events', data),
};
