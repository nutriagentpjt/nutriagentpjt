import type { DietStyle, Disease, OnboardingSaveHealthGoal } from '@/types/onboarding';

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

  if (calculatedTDEE && goalCalories >= calculatedTDEE + 100) {
    return 'BULK_UP';
  }

  if (calculatedTDEE && goalCalories <= calculatedTDEE - 100) {
    return 'DIET';
  }

  return 'LEAN_MASS_UP';
}
