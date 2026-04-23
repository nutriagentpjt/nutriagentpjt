import api from './api';
import type { Food, FoodSearchResponse } from '@/types';

function normalizeFood(food: Food & { weight?: number; servingSize?: number | string }): Food {
  return {
    ...food,
    servingSize: food.servingSize ?? food.weight ?? 100,
    servingUnit: food.servingUnit ?? 'g',
    weight: food.weight ?? (typeof food.servingSize === 'number' ? food.servingSize : Number(food.servingSize) || undefined),
  };
}

export const foodService = {
  async searchFoods(keyword: string): Promise<FoodSearchResponse> {
    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
      return { foods: [], total: 0 };
    }

    const response = await api.get<FoodSearchResponse>('/foods/search', {
      params: { keyword: normalizedKeyword },
    });

    return {
      ...response.data,
      foods: response.data.foods.map((food) => normalizeFood(food)),
    };
  },

  async getFoodById(id: number | string): Promise<Food> {
    throw new Error(`GET /foods/${id} is not supported by the current backend. Use /foods/search instead.`);
  },

  async getAllFoods(): Promise<Food[]> {
    throw new Error('GET /foods is not supported by the current backend. Use /foods/search instead.');
  },
};
