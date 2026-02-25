import api from './api';
import type {
  Meal,
  CreateMealRequest,
  MealSummaryResponse,
} from '../types';

/**
 * 식단 관련 API 서비스
 */
export const mealService = {
  /**
   * 특정 날짜 식단 조회
   */
  async getMeals(userId: number, date: string): Promise<Meal[]> {
    const response = await api.get<Meal[]>('/meals', {
      params: { userId, date },
    });
    return response.data;
  },

  /**
   * 특정 날짜 식단 요약 조회
   */
  async getMealSummary(
      userId: number,
      date: string
  ): Promise<MealSummaryResponse> {
    const response = await api.get<MealSummaryResponse>(
        '/meals/summary',
        { params: { userId, date } }
    );
    return response.data;
  },

  /**
   * 식단 추가
   */
  async createMeal(data: CreateMealRequest): Promise<Meal> {
    const response = await api.post<Meal>('/meals', data);
    return response.data;
  },

  /**
   * 식단 수정
   */
  async updateMeal(
      id: number,
      data: Partial<Meal>
  ): Promise<Meal> {
    const response = await api.put<Meal>(
        `/meals/${id}`,
        data
    );
    return response.data;
  },

  /**
   * 식단 삭제
   */
  async deleteMeal(id: number): Promise<void> {
    await api.delete(`/meals/${id}`);
  },

  /**
   * 이미지 업로드
   */
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    return api.post('/meals/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};