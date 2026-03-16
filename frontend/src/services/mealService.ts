import type { ApiMealType, CreateMealRequest, Meal, MealListResponse, MealSummaryResponse, UpdateMealRequest } from '@/types';
import api from './api';
import type { MealImageUploadResponse } from '@/types';

interface ApiMealResponse {
  id: number;
  userId?: string;
  foodName: string;
  amount: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: ApiMealType;
  date: string;
  createdAt: string;
  updatedAt?: string;
}

interface ApiMealItemResponse {
  id: number;
  foodName: string;
  amount: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: ApiMealType;
  createdAt: string;
}

interface ApiMealListResponse {
  date: string;
  summary: MealListResponse['summary'];
  meals: ApiMealItemResponse[];
}

function fromApiMealType(mealType: ApiMealType): Meal['mealType'] {
  switch (mealType) {
    case 'BREAKFAST':
      return 'breakfast';
    case 'LUNCH':
      return 'lunch';
    case 'DINNER':
      return 'dinner';
    case 'SNACK':
      return 'snack';
  }
}

function toApiMealType(mealType: CreateMealRequest['mealType']): ApiMealType {
  switch (mealType) {
    case 'breakfast':
      return 'BREAKFAST';
    case 'lunch':
      return 'LUNCH';
    case 'dinner':
      return 'DINNER';
    case 'snack':
      return 'SNACK';
  }
}

function normalizeMeal(response: ApiMealResponse): Meal {
  return {
    id: response.id,
    userId: response.userId,
    foodName: response.foodName,
    amount: response.amount,
    calories: response.calories,
    protein: response.protein,
    carbs: response.carbs,
    fat: response.fat,
    mealType: fromApiMealType(response.mealType),
    date: response.date,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}

function normalizeMealItem(response: ApiMealItemResponse, date: string): Meal {
  return {
    id: response.id,
    foodName: response.foodName,
    amount: response.amount,
    calories: response.calories,
    protein: response.protein,
    carbs: response.carbs,
    fat: response.fat,
    mealType: fromApiMealType(response.mealType),
    date,
    createdAt: response.createdAt,
  };
}

export const mealService = {
  async getMeals(date: string): Promise<MealListResponse> {
    const response = await api.get<ApiMealListResponse>('/meals', {
      params: { date },
    });

    return {
      date: response.data.date,
      summary: response.data.summary,
      meals: response.data.meals.map((meal) => normalizeMealItem(meal, response.data.date)),
    };
  },

  async getMealSummary(date: string): Promise<MealSummaryResponse> {
    const response = await api.get<MealSummaryResponse>('/meals/summary', {
      params: { date },
    });
    return response.data;
  },

  async createMeal(data: CreateMealRequest): Promise<Meal> {
    const response = await api.post<ApiMealResponse>('/meals', {
      foodName: data.foodName,
      amount: data.amount,
      mealType: toApiMealType(data.mealType),
      date: data.date,
      ...(data.source ? { source: data.source.toUpperCase() } : {}),
      ...(data.setId ? { setId: data.setId } : {}),
    });
    return normalizeMeal(response.data);
  },

  async updateMeal(id: number, data: UpdateMealRequest): Promise<Meal> {
    const response = await api.put<ApiMealResponse>(`/meals/${id}`, {
      ...(typeof data.amount === 'number' ? { amount: data.amount } : {}),
      ...(data.mealType ? { mealType: toApiMealType(data.mealType) } : {}),
      ...(data.date ? { date: data.date } : {}),
    });
    return normalizeMeal(response.data);
  },

  async deleteMeal(id: number): Promise<void> {
    await api.delete(`/meals/${id}`);
  },

  async uploadImage(file: File): Promise<MealImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<MealImageUploadResponse>('/meals/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },
};
