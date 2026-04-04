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
    list: (mealType: MealType, date: string, limit?: number) =>
      ['recommendations', 'list', mealType, date, limit ?? 'default'] as const,
    settings: () => ['recommendations', 'settings'] as const,
  },
  onboarding: {
    all: ['onboarding'] as const,
    current: () => ['onboarding', 'current'] as const,
  },
  profile: {
    all: ['profile'] as const,
    current: () => ['profile', 'current'] as const,
  },
  preferences: {
    all: ['preferences'] as const,
    current: () => ['preferences', 'current'] as const,
  },
  goals: {
    all: ['goals'] as const,
    current: () => ['goals', 'current'] as const,
    byUser: (userId: number) => ['goals', 'byUser', userId] as const,
  },
} as const;
