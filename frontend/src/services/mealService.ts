import api from './api';
import type { Meal } from '../types';

export interface AddMealRequest {
  date: string;       // YYYY-MM-DD
  foodId: string;
  servings: number;
  mealTime: string;   // ISO string
}

export const mealService = {
  /**
   * 특정 날짜 식단 조회
   */
  async getMealsByDate(date: string): Promise<Meal[]> {
    const response = await api.get<Meal[]>('/meals', {
      params: { date },
    });
    return response.data;
  },

  /**
   * 식단 추가
   */
  async addMeal(data: AddMealRequest): Promise<Meal> {
    const response = await api.post<Meal>('/meals', data);
    return response.data;
  },

  /**
   * 식단 수정
   */
  async updateMeal(id: string, meal: Partial<Meal>): Promise<Meal> {
    const response = await api.put<Meal>(`/meals/${id}`, meal);
    return response.data;
  },

  /**
   * 식단 삭제
   */
  async deleteMeal(id: string): Promise<void> {
    await api.delete(`/meals/${id}`);
  },
};