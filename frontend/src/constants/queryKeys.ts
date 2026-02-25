import { MealType } from '../types/meal';

export const queryKeys = {
  foods: {
    all: ['foods'] as const,
    search: (keyword: string) =>
        ['foods', 'search', keyword] as const,
    detail: (id: number) =>
        ['foods', 'detail', id] as const,
  },

  meals: {
    all: ['meals'] as const,
    byDate: (userId: number, date: string) =>
        ['meals', 'byDate', userId, date] as const,
    summary: (userId: number, date: string) =>
        ['meals', 'summary', userId, date] as const,
    detail: (id: number) =>
        ['meals', 'detail', id] as const,
  },

  recommendations: {
    all: ['recommendations'] as const,
    list: (userId: number, mealType: MealType, date: string) =>
        ['recommendations', 'list', userId, mealType, date] as const,
    settings: (userId: number) =>
        ['recommendations', 'settings', userId] as const,
  },

  onboarding: {
    all: ['onboarding'] as const,
    byUser: (userId: number) =>
        ['onboarding', 'byUser', userId] as const,
  },

  goals: {
    byUser: (userId: number) =>
        ['goals', 'byUser', userId] as const,
  },
} as const;