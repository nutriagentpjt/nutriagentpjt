import api from './api';
import type {
  ApiError,
  ApiMealType,
  MealType,
  NutritionSummary,
  RecommendationEventRequest,
  RecommendationFeedbackRequest,
  RecommendationResponse,
  RecommendationSettings,
  SaveRecommendationRequest,
} from '@/types';

type BackendNutritionDto = {
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
};

type BackendFoodRecommendation = {
  foodId: number;
  foodName: string;
  score: number;
  recommendedAmountG?: number | null;
  nutrientsPerServing?: BackendNutritionDto | null;
  reasonTags?: string[] | null;
};

type BackendRecommendationResponse = {
  setId: string;
  date?: string;
  mealType: MealType;
  dailyTarget?: BackendNutritionDto | null;
  mealTarget?: BackendNutritionDto | null;
  consumed?: BackendNutritionDto | null;
  gap?: BackendNutritionDto | null;
  recommendations: BackendFoodRecommendation[];
};

function toApiMealType(mealType: MealType): ApiMealType {
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

function normalizeNutritionDto(payload?: BackendNutritionDto | null): NutritionSummary {
  return {
    calories: payload?.calories ?? 0,
    protein: payload?.protein ?? 0,
    carbs: payload?.carbs ?? 0,
    fat: payload?.fat ?? 0,
  };
}

export const recommendationService = {
  async getRecommendations(
    mealType: MealType,
    date?: string,
    limit?: number,
  ): Promise<RecommendationResponse> {
    const response = await api.get<BackendRecommendationResponse>('/recommendations', {
      params: { mealType: toApiMealType(mealType), date, limit },
    });

    return {
      setId: response.data.setId,
      date: response.data.date,
      mealType: response.data.mealType,
      dailyTarget: normalizeNutritionDto(response.data.dailyTarget),
      mealTarget: normalizeNutritionDto(response.data.mealTarget),
      consumed: normalizeNutritionDto(response.data.consumed),
      gap: normalizeNutritionDto(response.data.gap),
      recommendations: response.data.recommendations.map((recommendation) => ({
        setId: response.data.setId,
        foodId: recommendation.foodId,
        foodName: recommendation.foodName,
        recommendedAmount: recommendation.recommendedAmountG ?? 100,
        score: Math.round(recommendation.score ?? 0),
        reasons: recommendation.reasonTags ?? [],
        nutrients: normalizeNutritionDto(recommendation.nutrientsPerServing),
      })),
    };
  },

  saveRecommendation: (data: SaveRecommendationRequest) =>
    Promise.reject<ApiError>({
      message: 'Recommendation save API is not available yet',
      status: 501,
    }),

  async getSettings(): Promise<RecommendationSettings> {
    const response = await api.get<RecommendationSettings>('/recommendations/settings');
    return response.data;
  },

  saveSettings: (data: RecommendationSettings) =>
    Promise.reject<ApiError>({
      message: 'Recommendation settings API is not available yet',
      status: 501,
    }),

  submitFeedback: (data: RecommendationFeedbackRequest) =>
    Promise.reject<ApiError>({
      message: 'Recommendation feedback API is not available yet',
      status: 501,
    }),

  recordEvent: (data: RecommendationEventRequest) =>
    Promise.reject<ApiError>({
      message: 'Recommendation events API is not available yet',
      status: 501,
    }),
};
