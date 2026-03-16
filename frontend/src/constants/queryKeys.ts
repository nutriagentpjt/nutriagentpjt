import type { MealType } from '@/types/meal';

export const queryKeys = {
  foods: {
    all: ['foods'] as const,
    search: (keyword: string) => ['foods', 'search', keyword] as const,
    detail: (id: number | string) => ['foods', 'detail', id] as const,
  },
  meals: {
    all: ['meals'] as const,
    byDate: (date: string) => ['meals', 'byDate', date] as const,
    summary: (date: string) => ['meals', 'summary', date] as const,
    detail: (id: number) => ['meals', 'detail', id] as const,
  },
  recommendations: {
    all: ['recommendations'] as const,
    list: (userId: number, mealType: MealType, date: string) =>
      ['recommendations', 'list', userId, mealType, date] as const,
    settings: (userId: number) => ['recommendations', 'settings', userId] as const,
  },
  onboarding: {
    all: ['onboarding'] as const,
    byUser: (userId: number) => ['onboarding', 'byUser', userId] as const,
  },
  goals: {
    byUser: (userId: number) => ['goals', 'byUser', userId] as const,
  },
} as const;
