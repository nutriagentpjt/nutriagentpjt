import api from './api';
import type { OnboardingRequest, OnboardingResponse } from '@/types/onboarding';
import type { ProfileResponse } from '@/types/profile';
import type { OnboardingSaveHealthGoal } from '@/types/onboarding';

interface BackendOnboardingResponse {
  id: number;
  age: number;
  gender: OnboardingResponse['gender'];
  height: number;
  weight: number;
  healthGoal: OnboardingSaveHealthGoal;
  activityLevel: OnboardingResponse['activityLevel'];
  exerciseFrequency: number;
  exerciseTime?: OnboardingResponse['exerciseTime'];
  mealPattern: OnboardingResponse['mealPattern'];
  preferredFoods: string[];
  dislikedFoods: string[];
  diseases: OnboardingResponse['diseases'];
  createdAt?: string;
  updatedAt?: string;
}

function isCompletedProfile(profile: ProfileResponse) {
  return (
    profile.age != null &&
    profile.gender != null &&
    profile.height != null &&
    profile.weight != null &&
    profile.activityLevel != null &&
    profile.mealPattern != null &&
    profile.waterIntakeGoal != null
  );
}

function mapProfileToOnboardingResponse(profile: ProfileResponse): OnboardingResponse {
  return {
    age: profile.age ?? 25,
    gender: profile.gender ?? 'MALE',
    height: profile.height ?? 175,
    weight: profile.weight ?? 70,
    healthGoal: profile.healthGoal ?? 'GENERAL_HEALTH',
    activityLevel: profile.activityLevel ?? 'MODERATELY_ACTIVE',
    exerciseFrequency: profile.exerciseFrequency ?? 3,
    exerciseTime: profile.exerciseTime ?? 'EVENING',
    mealPattern: profile.mealPattern ?? 'THREE_MEALS',
    preferredFoods: profile.preferredFoods ?? [],
    dislikedFoods: (profile.dislikedFoods ?? []).map((foodName) => ({ foodName, reason: 'DISLIKE' })),
    allergies: profile.allergies ?? [],
    diseases: profile.diseases ?? [],
    dietStyles: profile.dietStyles ?? [],
    waterIntakeGoal: profile.waterIntakeGoal ?? 2,
    constraints: profile.constraints ?? {
      lowSodium: false,
      lowSugar: false,
      maxCaloriesPerMeal: 600,
    },
    completed: isCompletedProfile(profile),
  };
}

function mapBackendOnboardingResponse(response: BackendOnboardingResponse): OnboardingResponse {
  return {
    age: response.age,
    gender: response.gender,
    height: response.height,
    weight: response.weight,
    healthGoal: response.healthGoal,
    activityLevel: response.activityLevel,
    exerciseFrequency: response.exerciseFrequency,
    exerciseTime: response.exerciseTime ?? 'EVENING',
    mealPattern: response.mealPattern,
    preferredFoods: response.preferredFoods ?? [],
    dislikedFoods: (response.dislikedFoods ?? []).map((foodName) => ({ foodName, reason: 'DISLIKE' })),
    allergies: [],
    diseases: response.diseases ?? [],
    dietStyles: [],
    waterIntakeGoal: 2,
    constraints: {
      lowSodium: false,
      lowSugar: false,
      maxCaloriesPerMeal: 600,
    },
    completed: true,
  };
}

export const onboardingService = {
  saveOnboarding: async (data: OnboardingRequest): Promise<OnboardingResponse> => {
    const response = await api.post<BackendOnboardingResponse>('/onboarding', data);
    return mapBackendOnboardingResponse(response.data);
  },

  getOnboarding: async (): Promise<OnboardingResponse> => {
    const response = await api.get<ProfileResponse>('/profile');
    return mapProfileToOnboardingResponse(response.data);
  },

  deleteOnboarding: () => Promise.resolve(),
};
