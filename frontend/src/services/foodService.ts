import api from './api';
import type { Food, FoodSearchResponse } from '@/types';

export const foodService = {
  async searchFoods(keyword: string): Promise<FoodSearchResponse> {
    const response = await api.get<FoodSearchResponse>('/foods/search', {
      params: { keyword },
    });
    return response.data;
  },

  async getFoodById(id: number | string): Promise<Food> {
    const response = await api.get<Food>(`/foods/${id}`);
    return response.data;
  },

  async getAllFoods(): Promise<Food[]> {
    const response = await api.get<Food[]>('/foods');
    return response.data;
  },
};
