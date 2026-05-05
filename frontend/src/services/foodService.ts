import api from './api';
import type { Food, FoodSearchResponse } from '@/types';
import { sortFoodsByRelevance, sortNamesByRelevance } from '@/utils/foodSearchRanking';

type BackendFoodResponse = {
  name: string;
  calories?: number | null;
  carbs?: number | null;
  protein?: number | null;
  fat?: number | null;
  sodium?: number | null;
  sugars?: number | null;
  fiber?: number | null;
  variants?: number | null;
};

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

    const response = await api.get<BackendFoodResponse[]>('/foods/search', {
      params: { query: normalizedKeyword, limit: 20, offset: 0 },
    });

    const foods = response.data.map((food, index) =>
      normalizeFood({
        id: `${food.name}-${index}`,
        name: food.name,
        servingSize: 100,
        servingUnit: 'g',
        weight: 100,
        calories: food.calories ?? 0,
        carbs: food.carbs ?? 0,
        protein: food.protein ?? 0,
        fat: food.fat ?? 0,
        sodium: food.sodium ?? undefined,
        fiber: food.fiber ?? undefined,
        variants: food.variants ?? undefined,
      }),
    );

    return {
      foods: sortFoodsByRelevance(foods, normalizedKeyword),
      total: foods.length,
    };
  },

  async autocompleteFoods(query: string, limit = 6): Promise<string[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const response = await api.get<BackendFoodResponse[]>('/foods/search', {
      params: { query: normalizedQuery, limit: 50, offset: 0 },
    });

    const counts = response.data.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.name] = Math.max(accumulator[item.name] ?? 0, item.variants ?? 0);
      return accumulator;
    }, {});

    const uniqueNames = [...new Set(response.data.map((item) => item.name))].sort((left, right) => {
      const countDiff = (counts[right] ?? 0) - (counts[left] ?? 0);
      if (countDiff !== 0) {
        return countDiff;
      }

      return left.localeCompare(right, 'ko');
    });

    return sortNamesByRelevance(uniqueNames, normalizedQuery, counts).slice(0, limit);
  },

  async getFoodById(id: number | string): Promise<Food> {
    throw new Error(`GET /foods/${id} is not supported by the current backend. Use /foods/search instead.`);
  },

  async getAllFoods(): Promise<Food[]> {
    throw new Error('GET /foods is not supported by the current backend. Use /foods/search instead.');
  },
};
