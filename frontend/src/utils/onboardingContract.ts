import type { ActivityLevel, DietStyle, Disease, ExerciseTime, OnboardingSaveHealthGoal } from '@/types/onboarding';

const supportedOnboardingDiseases = new Set<Disease>([
  'NONE',
  'ALLERGY',
  'DIABETES',
  'HYPERTENSION',
  'HYPERLIPIDEMIA',
  'GOUT',
  'KIDNEY_DISEASE',
  'LIVER_DISEASE',
  'THYROID_DISEASE',
]);

export function filterSupportedOnboardingDiseases(diseases: Disease[]) {
  return diseases.filter((disease) => supportedOnboardingDiseases.has(disease));
}

export function getExerciseFrequencyFromActivityLevel(activityLevel: ActivityLevel): number {
  switch (activityLevel) {
    case 'SEDENTARY':
      return 1;
    case 'LIGHTLY_ACTIVE':
      return 2;
    case 'MODERATELY_ACTIVE':
      return 4;
    case 'VERY_ACTIVE':
      return 6;
    default:
      return 3;
  }
}

export function getExerciseTimeFromActivityLevel(): ExerciseTime {
  return 'EVENING';
}

export function getOnboardingSaveHealthGoal({
  goalCalories,
  calculatedTDEE,
  selectedDietStyle,
}: {
  goalCalories: number;
  calculatedTDEE: number;
  selectedDietStyle?: DietStyle | null;
}): OnboardingSaveHealthGoal {
  if (selectedDietStyle === 'HIGH_PROTEIN') {
    return 'LEAN_MASS_UP';
  }

  if (!Number.isFinite(calculatedTDEE) || calculatedTDEE <= 0) {
    return 'DIET';
  }

  if (goalCalories >= calculatedTDEE + 100) {
    return 'BULK_UP';
  }

  if (goalCalories <= calculatedTDEE - 100) {
    return 'DIET';
  }

  return 'LEAN_MASS_UP';
}
