import type { ActivityLevel, Disease, Gender, UserProfile } from '@/types/onboarding';

export const USER_PROFILE_STORAGE_KEY = 'userProfile';

export type StoredProfile = UserProfile & {
  goalCalories?: number;
  goalCarbs?: number;
  goalProtein?: number;
  goalFat?: number;
};

export const defaultProfile: StoredProfile = {
  gender: 'MALE',
  age: 25,
  weight: 70,
  height: 175,
  activityLevel: 'MODERATELY_ACTIVE',
  goalCalories: 2000,
  goalCarbs: 250,
  goalProtein: 125,
  goalFat: 56,
  tdee: 0,
  dietStyles: [],
  allergies: [],
  diseases: [],
  waterGoal: 2,
  mealsPerDay: 3,
  lowSodium: false,
  lowSugar: false,
  maxCaloriesPerMeal: 600,
};

export const activityLabelMap: Record<ActivityLevel, string> = {
  SEDENTARY: '거의 활동 없음',
  LIGHTLY_ACTIVE: '가벼운 활동',
  MODERATELY_ACTIVE: '보통 활동',
  VERY_ACTIVE: '높은 활동',
  EXTRA_ACTIVE: '매우 높은 활동',
};

export const allergyOptions = [
  { emoji: '🥛', label: '우유 (유제품)', value: '우유' },
  { emoji: '🥚', label: '계란', value: '계란' },
  { emoji: '🥜', label: '땅콩', value: '땅콩' },
  { emoji: '🌰', label: '견과류', value: '견과류' },
  { emoji: '🌾', label: '글루텐', value: '글루텐' },
  { emoji: '🦐', label: '갑각류', value: '갑각류' },
  { emoji: '🐟', label: '생선', value: '생선' },
  { emoji: '🌱', label: '대두 (콩)', value: '대두' },
  { emoji: '🧂', label: '참깨', value: '참깨' },
] as const;

export const diseaseOptions = [
  { label: '당뇨병', value: 'DIABETES' as const },
  { label: '고혈압', value: 'HYPERTENSION' as const },
  { label: '고지혈증', value: 'HYPERLIPIDEMIA' as const },
  { label: '심장질환', value: 'HEART_DISEASE' as const },
  { label: '간질환', value: 'LIVER_DISEASE' as const },
  { label: '비만', value: 'OBESITY' as const },
] satisfies Array<{ label: string; value: Disease }>;

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
      return defaultProfile.activityLevel;
  }
}

export function loadStoredProfile(): StoredProfile {
  try {
    const raw = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw) as StoredProfile & {
      gender?: string;
      activityLevel?: string;
    };

    return {
      ...defaultProfile,
      ...parsed,
      gender: normalizeGender(parsed.gender),
      activityLevel: normalizeActivityLevel(parsed.activityLevel),
      allergies: parsed.allergies ?? defaultProfile.allergies,
      diseases: parsed.diseases ?? defaultProfile.diseases,
      dietStyles: parsed.dietStyles ?? defaultProfile.dietStyles,
      waterGoal: parsed.waterGoal ?? defaultProfile.waterGoal,
      mealsPerDay: parsed.mealsPerDay ?? defaultProfile.mealsPerDay,
      lowSodium: parsed.lowSodium ?? defaultProfile.lowSodium,
      lowSugar: parsed.lowSugar ?? defaultProfile.lowSugar,
      maxCaloriesPerMeal: parsed.maxCaloriesPerMeal ?? defaultProfile.maxCaloriesPerMeal,
    };
  } catch {
    return defaultProfile;
  }
}

export function saveStoredProfile(profile: StoredProfile) {
  window.localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}
