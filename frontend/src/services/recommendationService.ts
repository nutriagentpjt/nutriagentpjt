import api from './api';
import type { MealType } from '../types/';

export const recommendationService = {
    getRecommendations: (
        userId: number,
        mealType: MealType,
        date?: string,
        limit?: number
    ) =>
        api.get('/recommendations', {
            params: { userId, mealType, date, limit },
        }),

    saveRecommendation: (data: unknown) =>
        api.post('/recommendations/save', data),

    getSettings: (userId: number) =>
        api.get('/recommendations/settings', {
            params: { userId },
        }),

    saveSettings: (data: unknown) =>
        api.post('/recommendations/settings', data),

    submitFeedback: (data: unknown) =>
        api.post('/recommendations/feedback', data),

    recordEvent: (data: unknown) =>
        api.post('/recommendations/events', data),
};