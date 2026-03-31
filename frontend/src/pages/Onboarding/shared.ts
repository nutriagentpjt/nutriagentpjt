import type { ActivityLevel, DietStyle, Disease, Gender, UserProfile } from '@/types/onboarding';

export interface OnboardingDraft {
  gender: Gender;
  age: number;
  weight: number;
  height: number;
  activityLevel: ActivityLevel;
  tdee: number;
  goalCalories: number;
  goalCarbs: number;
  goalProtein: number;
  goalFat: number;
  dietStyles: DietStyle[];
  waterGoal: number;
  mealsPerDay: number;
  allergies: string[];
  diseases: Disease[];
  lowSodium: boolean;
  lowSugar: boolean;
  maxCaloriesPerMeal: number;
}

export const ONBOARDING_DRAFT_KEY = 'onboardingDraft';
export const USER_PROFILE_KEY = 'userProfile';
export const ONBOARDING_COMPLETE_KEY = 'onboardingComplete';
export const ONBOARDING_STEP_KEY = 'onboardingCurrentStep';

export const defaultOnboardingDraft: OnboardingDraft = {
  gender: 'MALE',
  age: 25,
  weight: 70,
  height: 175,
  activityLevel: 'MODERATELY_ACTIVE',
  tdee: 0,
  goalCalories: 2000,
  goalCarbs: 250,
  goalProtein: 125,
  goalFat: 56,
  dietStyles: [],
  waterGoal: 2,
  mealsPerDay: 3,
  allergies: [],
  diseases: [],
  lowSodium: false,
  lowSugar: false,
  maxCaloriesPerMeal: 600,
};

export const activityOptions: Array<{
  value: ActivityLevel;
  label: string;
  description: string;
}> = [
  { value: 'SEDENTARY', label: '거의 활동 없음', description: '주로 앉아서 생활해요' },
  { value: 'LIGHTLY_ACTIVE', label: '가벼운 활동', description: '주 1-3회 가볍게 운동해요' },
  { value: 'MODERATELY_ACTIVE', label: '보통 활동', description: '주 3-5회 규칙적으로 운동해요' },
  { value: 'VERY_ACTIVE', label: '높은 활동', description: '주 6-7회 강도 있게 운동해요' },
  { value: 'EXTRA_ACTIVE', label: '매우 높은 활동', description: '운동량이 아주 많거나 육체노동이 있어요' },
];

function normalizeGender(gender?: string): Gender {
  return gender === 'female' || gender === 'FEMALE' ? 'FEMALE' : 'MALE';
}

function normalizeActivityLevel(activityLevel?: string): ActivityLevel {
  switch (activityLevel) {
    case 'sedentary':
    case 'SEDENTARY':
      return 'SEDENTARY';
    case 'light':
    case 'LIGHTLY_ACTIVE':
      return 'LIGHTLY_ACTIVE';
    case 'moderate':
    case 'MODERATELY_ACTIVE':
      return 'MODERATELY_ACTIVE';
    case 'active':
    case 'VERY_ACTIVE':
      return 'VERY_ACTIVE';
    case 'very_active':
    case 'EXTRA_ACTIVE':
      return 'EXTRA_ACTIVE';
    default:
      return defaultOnboardingDraft.activityLevel;
  }
}

export function loadOnboardingDraft(): OnboardingDraft {
  if (typeof window === 'undefined') {
    return defaultOnboardingDraft;
  }

  try {
    const raw = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!raw) return defaultOnboardingDraft;

    const parsed = JSON.parse(raw) as Partial<OnboardingDraft> & {
      gender?: string;
      activityLevel?: string;
    };

    return {
      ...defaultOnboardingDraft,
      ...parsed,
      gender: normalizeGender(parsed.gender),
      activityLevel: normalizeActivityLevel(parsed.activityLevel),
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

  const profile: UserProfile = {
    gender: draft.gender,
    age: draft.age,
    weight: draft.weight,
    height: draft.height,
    activityLevel: draft.activityLevel,
    goalCalories: draft.goalCalories,
    goalCarbs: draft.goalCarbs,
    goalProtein: draft.goalProtein,
    goalFat: draft.goalFat,
    dietStyles: draft.dietStyles,
    tdee: draft.tdee,
    waterGoal: draft.waterGoal,
    mealsPerDay: draft.mealsPerDay,
    allergies: draft.allergies,
    diseases: draft.diseases,
    lowSodium: draft.lowSodium,
    lowSugar: draft.lowSugar,
    maxCaloriesPerMeal: draft.maxCaloriesPerMeal,
  };

  window.localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
  window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
  window.localStorage.removeItem(ONBOARDING_STEP_KEY);
}
