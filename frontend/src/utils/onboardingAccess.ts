import { USER_PROFILE_STORAGE_KEY } from '@/components/profile/shared';
import type { ActivityLevel, Gender } from '@/types/onboarding';

const VALID_GENDERS: Gender[] = ['MALE', 'FEMALE'];
const VALID_ACTIVITY_LEVELS: ActivityLevel[] = [
  'SEDENTARY',
  'LIGHTLY_ACTIVE',
  'MODERATELY_ACTIVE',
  'VERY_ACTIVE',
];
const VALID_MEALS_PER_DAY = new Set([1, 2, 3, 4]);

function isFinitePositiveNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isBoolean(value: unknown) {
  return typeof value === 'boolean';
}

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function parseStoredUserProfile() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function hasCompleteOnboardingProfile() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.localStorage.getItem('onboardingComplete') !== 'true') {
    return false;
  }

  const profile = parseStoredUserProfile();
  if (!profile) {
    return false;
  }

  return (
    VALID_GENDERS.includes(profile.gender as Gender) &&
    isFinitePositiveNumber(profile.age) &&
    isFinitePositiveNumber(profile.weight) &&
    isFinitePositiveNumber(profile.height) &&
    VALID_ACTIVITY_LEVELS.includes(profile.activityLevel as ActivityLevel) &&
    isFinitePositiveNumber(profile.goalCalories) &&
    isFinitePositiveNumber(profile.goalCarbs) &&
    isFinitePositiveNumber(profile.goalProtein) &&
    isFinitePositiveNumber(profile.goalFat) &&
    isFinitePositiveNumber(profile.waterGoal) &&
    VALID_MEALS_PER_DAY.has(profile.mealsPerDay as number) &&
    isBoolean(profile.lowSodium) &&
    isBoolean(profile.lowSugar) &&
    isFinitePositiveNumber(profile.maxCaloriesPerMeal) &&
    isStringArray(profile.allergies) &&
    isStringArray(profile.diseases) &&
    isStringArray(profile.dietStyles)
  );
}

export function getOnboardingAccessBlockMessage() {
  return '온보딩 정보가 아직 완전히 준비되지 않았어요.\n기본 정보와 식단 설정을 먼저 완료해주세요.';
}
