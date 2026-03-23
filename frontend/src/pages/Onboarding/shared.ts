import type { ActivityLevel, OnboardingRequest } from '@/types/onboarding';

export interface OnboardingDraft {
  gender: 'male' | 'female';
  age: number;
  weight: number;
  height: number;
  activityLevel: ActivityLevel;
  tdee: number;
  goalCalories: number;
  goalCarbs: number;
  goalProtein: number;
  goalFat: number;
  allergies: string[];
}

export const ONBOARDING_DRAFT_KEY = 'onboardingDraft';
export const USER_PROFILE_KEY = 'userProfile';
export const ONBOARDING_COMPLETE_KEY = 'onboardingComplete';
export const ONBOARDING_STEP_KEY = 'onboardingCurrentStep';

export const defaultOnboardingDraft: OnboardingDraft = {
  gender: 'male',
  age: 25,
  weight: 70,
  height: 175,
  activityLevel: 'moderate',
  tdee: 0,
  goalCalories: 2000,
  goalCarbs: 250,
  goalProtein: 125,
  goalFat: 56,
  allergies: [],
};

export const activityOptions: Array<{
  value: ActivityLevel;
  label: string;
  description: string;
}> = [
  { value: 'sedentary', label: '거의 활동 없음', description: '주로 앉아서 생활해요' },
  { value: 'light', label: '가벼운 활동', description: '주 1-3회 가볍게 운동해요' },
  { value: 'moderate', label: '보통 활동', description: '주 3-5회 규칙적으로 운동해요' },
  { value: 'active', label: '높은 활동', description: '주 6-7회 강도 있게 운동해요' },
  { value: 'very_active', label: '매우 높은 활동', description: '운동량이 아주 많거나 육체노동이 있어요' },
];

export function loadOnboardingDraft(): OnboardingDraft {
  if (typeof window === 'undefined') {
    return defaultOnboardingDraft;
  }

  try {
    const raw = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!raw) return defaultOnboardingDraft;

    return {
      ...defaultOnboardingDraft,
      ...(JSON.parse(raw) as Partial<OnboardingDraft>),
    };
  } catch {
    return defaultOnboardingDraft;
  }
}

export function saveOnboardingDraft(draft: Partial<OnboardingDraft>) {
  if (typeof window === 'undefined') return;

  const next = {
    ...loadOnboardingDraft(),
    ...draft,
  };

  window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(next));
}

export function completeOnboarding(draft: OnboardingDraft) {
  if (typeof window === 'undefined') return;

  const profile: Omit<OnboardingRequest, 'userId'> & { tdee: number; allergies: string[] } = {
    gender: draft.gender,
    age: draft.age,
    weight: draft.weight,
    height: draft.height,
    activityLevel: draft.activityLevel,
    goalCalories: draft.goalCalories,
    goalCarbs: draft.goalCarbs,
    goalProtein: draft.goalProtein,
    goalFat: draft.goalFat,
    tdee: draft.tdee,
    allergies: draft.allergies,
  };

  window.localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
  window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
  window.localStorage.removeItem(ONBOARDING_STEP_KEY);
}
