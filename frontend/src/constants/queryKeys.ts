export const QUERY_KEYS = {
  FOODS: {
    ALL: ['foods'] as const,
    SEARCH: (query: string) =>
        ['foods', 'search', query ?? ''] as const,
    DETAIL: (id: string) => ['foods', 'detail', id] as const,
  },

  MEALS: {
    ALL: ['meals'] as const,
    BY_DATE: (date: string) =>
        ['meals', 'date', date] as const,
    DETAIL: (id: string) =>
        ['meals', 'detail', id] as const,
  },

  RECOMMENDATIONS: {
    ALL: ['recommendations'] as const,
    BY_DATE: (date: string) =>
        ['recommendations', 'date', date] as const,
  },

  ONBOARDING: {
    STATUS: ['onboarding', 'status'] as const,
    USER_INFO: ['onboarding', 'userInfo'] as const,
  },

  INVALIDATE: {
    FOODS: ['foods'] as const,
    MEALS: ['meals'] as const,
    RECOMMENDATIONS: ['recommendations'] as const,
  },
} as const;