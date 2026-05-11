import type {
  ActivityLevel,
  Disease,
  Gender,
  MealPattern,
  OnboardingRequest,
  UserProfile,
} from '@/types/onboarding';
import {
  filterSupportedOnboardingDiseases,
  getExerciseFrequencyFromActivityLevel,
  getExerciseTimeFromActivityLevel,
  getOnboardingSaveHealthGoal,
} from '@/utils/onboardingContract';
import type {
  NutritionTargetResponse,
  PreferenceResponse,
  ProfileResponse,
} from '@/types/profile';

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
  { label: '신장 질환', value: 'KIDNEY_DISEASE' as const },
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
    case 'very_active':
    case 'EXTRA_ACTIVE':
      return 'VERY_ACTIVE';
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

export function getMealPatternFromMealsPerDay(mealsPerDay?: number): MealPattern {
  switch (mealsPerDay) {
    case 2:
      return 'TWO_MEALS';
    case 4:
      return 'MULTIPLE_SMALL_MEALS';
    case 1:
      return 'INTERMITTENT_FASTING';
    default:
      return 'THREE_MEALS';
  }
}

export function getMealsPerDayFromMealPattern(mealPattern?: MealPattern | null): number {
  switch (mealPattern) {
    case 'TWO_MEALS':
      return 2;
    case 'INTERMITTENT_FASTING':
      return 1;
    case 'MULTIPLE_SMALL_MEALS':
      return 4;
    default:
      return 3;
  }
}

export function mergeBackendProfile({
  currentProfile,
  profile,
  preferences,
  nutritionTargets,
}: {
  currentProfile: StoredProfile;
  profile?: ProfileResponse | null;
  preferences?: PreferenceResponse | null;
  nutritionTargets?: NutritionTargetResponse | null;
}): StoredProfile {
  return {
    ...currentProfile,
    age: profile?.age ?? currentProfile.age,
    gender: profile?.gender ?? currentProfile.gender,
    height: profile?.height ?? currentProfile.height,
    weight: profile?.weight ?? currentProfile.weight,
    activityLevel: profile?.activityLevel ?? currentProfile.activityLevel,
    diseases: profile?.diseases ?? currentProfile.diseases,
    dietStyles: preferences?.dietStyles ?? profile?.dietStyles ?? currentProfile.dietStyles,
    allergies: preferences?.allergies ?? profile?.allergies ?? currentProfile.allergies,
    waterGoal: preferences?.waterIntakeGoal ?? profile?.waterIntakeGoal ?? currentProfile.waterGoal,
    mealsPerDay: getMealsPerDayFromMealPattern(preferences?.mealPattern ?? profile?.mealPattern),
    lowSodium:
      preferences?.constraints?.lowSodium ??
      profile?.constraints?.lowSodium ??
      currentProfile.lowSodium,
    lowSugar:
      preferences?.constraints?.lowSugar ??
      profile?.constraints?.lowSugar ??
      currentProfile.lowSugar,
    maxCaloriesPerMeal:
      preferences?.constraints?.maxCaloriesPerMeal ??
      profile?.constraints?.maxCaloriesPerMeal ??
      currentProfile.maxCaloriesPerMeal,
    goalCalories: nutritionTargets?.target.calories ?? currentProfile.goalCalories,
    goalProtein: nutritionTargets?.target.protein ?? currentProfile.goalProtein,
    goalCarbs: nutritionTargets?.target.carbs ?? currentProfile.goalCarbs,
    goalFat: nutritionTargets?.target.fat ?? currentProfile.goalFat,
  };
}

export function buildOnboardingPayload(profile: StoredProfile): OnboardingRequest {
  return {
    age: profile.age ?? defaultProfile.age,
    gender: profile.gender ?? defaultProfile.gender,
    height: profile.height ?? defaultProfile.height,
    weight: profile.weight ?? defaultProfile.weight,
    healthGoal: getOnboardingSaveHealthGoal({
      goalCalories: profile.goalCalories ?? defaultProfile.goalCalories ?? 2000,
      calculatedTDEE: profile.tdee ?? defaultProfile.tdee,
      selectedDietStyle: profile.dietStyles?.[0] ?? null,
    }),
    activityLevel: profile.activityLevel ?? defaultProfile.activityLevel,
    exerciseFrequency: getExerciseFrequencyFromActivityLevel(
      profile.activityLevel ?? defaultProfile.activityLevel,
    ),
    exerciseTime: getExerciseTimeFromActivityLevel(),
    mealPattern: getMealPatternFromMealsPerDay(profile.mealsPerDay),
    preferredFoods: [],
    dislikedFoods: [],
    diseases: filterSupportedOnboardingDiseases(profile.diseases ?? []),
  };
}
