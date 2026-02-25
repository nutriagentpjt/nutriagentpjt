import api from './api';
import type { Food } from '@types';

export const foodService = {
  async searchFoods(query: string): Promise<Food[]> {
    const response = await api.get<Food[]>('/foods/search', {
      params: { q: query },
    });
    return response.data;
  },

  async getFoodById(id: string): Promise<Food> {
    const response = await api.get<Food>(`/foods/${id}`);
    return response.data;
  },

  async getAllFoods(): Promise<Food[]> {
    const response = await api.get<Food[]>('/foods');
    return response.data;
  },
};