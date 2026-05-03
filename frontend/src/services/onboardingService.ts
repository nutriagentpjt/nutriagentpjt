import api from './api';
import type { OnboardingRequest, OnboardingResponse } from '@/types/onboarding';
import type { ProfileResponse } from '@/types/profile';

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

export const onboardingService = {
  saveOnboarding: async (data: OnboardingRequest): Promise<OnboardingResponse> => {
    const response = await api.post<OnboardingResponse>('/onboarding', data);
    return response.data;
  },

  getOnboarding: async (): Promise<OnboardingResponse | null> => {
    const response = await api.get<ProfileResponse>('/profile');
    return mapProfileToOnboardingResponse(response.data);
  },

  deleteOnboarding: () => Promise.resolve(),
};
