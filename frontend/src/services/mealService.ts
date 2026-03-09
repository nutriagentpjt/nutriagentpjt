import api from './api';
import type {
  CreateMealRequest,
  Meal,
  MealSummaryResponse,
  UpdateMealRequest,
} from '@/types';

export const mealService = {
  async getMeals(userId: number, date: string): Promise<Meal[]> {
    const response = await api.get<Meal[]>('/meals', {
      params: { userId, date },
    });
    return response.data;
  },

  async getMealSummary(userId: number, date: string): Promise<MealSummaryResponse> {
    const response = await api.get<MealSummaryResponse>('/meals/summary', {
      params: { userId, date },
    });
    return response.data;
  },

  async createMeal(data: CreateMealRequest): Promise<Meal> {
    const response = await api.post<Meal>('/meals', data);
    return response.data;
  },

  async updateMeal(id: number, data: UpdateMealRequest): Promise<Meal> {
    const response = await api.put<Meal>(`/meals/${id}`, data);
    return response.data;
  },

  async deleteMeal(id: number): Promise<void> {
    await api.delete(`/meals/${id}`);
  },

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    return api.post('/meals/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
