import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Carrot,
  Check,
  ChevronRight,
  Droplet,
  Heart,
  HeartPulse,
  Shield,
  Target,
  TrendingUp,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useOnboarding, useSaveOnboarding } from '@/hooks';
import { calculateBMR, calculateTDEE } from '@/utils/tdeeCalculator';
import {
  ONBOARDING_DRAFT_KEY,
  ONBOARDING_COMPLETE_KEY,
  ONBOARDING_STEP_KEY,
  activityOptions,
  completeOnboarding,
  defaultOnboardingDraft,
  loadOnboardingDraft,
  saveOnboardingDraft,
} from '@/pages/Onboarding/shared';
import type { ActivityLevel, DietStyle, Disease, Gender, MealPattern } from '@/types/onboarding';

const allergyOptions = [
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

const diseaseOptions = [
  { icon: Activity, label: '당뇨병', value: 'DIABETES' as const },
  { icon: Heart, label: '고혈압', value: 'HYPERTENSION' as const },
  { icon: Droplet, label: '고지혈증', value: 'HYPERLIPIDEMIA' as const },
  { icon: HeartPulse, label: '심장질환', value: 'HEART_DISEASE' as const },
  { icon: Shield, label: '간질환', value: 'LIVER_DISEASE' as const },
  { icon: TrendingUp, label: '비만', value: 'OBESITY' as const },
] as const;

const getRouteForStep = (step: number) => {
  if (step <= 1) return ROUTES.ONBOARDING_WELCOME;
  if (step <= 5) return ROUTES.ONBOARDING_TDEE;
  return ROUTES.ONBOARDING_GOAL;
};

const getProgressLabel = (step: number) => {
  switch (step) {
    case 1:
      return '서비스 소개';
    case 2:
      return '성별 선택';
    case 3:
      return '체중, 신장, 나이 입력';
    case 4:
      return '활동량 선택';
    case 5:
      return '수분/끼니 설정';
    case 6:
      return '목표 설정';
    case 7:
      return '알러지 정보';
    case 8:
      return '질환 정보';
    case 9:
      return '추가 설정';
    default:
      return '';
  }
};

const getMealsPerDayFromPattern = (mealPattern: MealPattern): number => {
  switch (mealPattern) {
    case 'ONE_MEAL':
      return 1;
    case 'TWO_MEALS':
      return 2;
    case 'FOUR_OR_MORE_MEALS':
      return 4;
    default:
      return 3;
  }
};

const getMealPattern = (mealsPerDay: number): MealPattern => {
  switch (mealsPerDay) {
    case 1:
      return 'ONE_MEAL';
    case 2:
      return 'TWO_MEALS';
    case 4:
      return 'FOUR_OR_MORE_MEALS';
    default:
      return 'THREE_MEALS';
  }
};

interface OnboardingFlowProps {
  fallbackStep: number;
}

export default function OnboardingFlow({ fallbackStep }: OnboardingFlowProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const draft = loadOnboardingDraft();
  const hasHydratedFromServerRef = useRef(false);

  const initialStep =
    typeof window !== 'undefined'
      ? Number(window.localStorage.getItem(ONBOARDING_STEP_KEY) ?? fallbackStep)
      : fallbackStep;

  const [step, setStep] = useState(Number.isFinite(initialStep) ? initialStep : fallbackStep);
  const [direction, setDirection] = useState(1);
  const [gender, setGender] = useState<Gender>(draft.gender);
  const [age, setAge] = useState(String(draft.age || ''));
  const [weight, setWeight] = useState(String(draft.weight || ''));
  const [height, setHeight] = useState(String(draft.height || ''));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(draft.activityLevel);
  const [goalCalories, setGoalCalories] = useState(draft.goalCalories || draft.tdee || defaultOnboardingDraft.goalCalories);
  const [carbsPercentage, setCarbsPercentage] = useState(50);
  const [proteinPercentage, setProteinPercentage] = useState(25);
  const [fatPercentage, setFatPercentage] = useState(25);
  const [selectedDietStyle, setSelectedDietStyle] = useState<DietStyle | null>(draft.dietStyles[0] ?? null);
  const [waterGoal, setWaterGoal] = useState(draft.waterGoal);
  const [mealsPerDay, setMealsPerDay] = useState(draft.mealsPerDay);
  const [allergies, setAllergies] = useState<string[]>(draft.allergies);
  const [diseases, setDiseases] = useState<Disease[]>(draft.diseases);
  const [lowSodium, setLowSodium] = useState(draft.lowSodium);
  const [lowSugar, setLowSugar] = useState(draft.lowSugar);
  const [maxCaloriesPerMeal, setMaxCaloriesPerMeal] = useState(draft.maxCaloriesPerMeal);

  const hasLocalDraft =
    typeof window !== 'undefined' && Boolean(window.localStorage.getItem(ONBOARDING_DRAFT_KEY));

  const { data: onboardingData } = useOnboarding({ enabled: !hasLocalDraft });
  const saveOnboardingMutation = useSaveOnboarding();

  const calculatedTDEE = useMemo(() => {
    const ageValue = Number(age);
    const weightValue = Number(weight);
    const heightValue = Number(height);

    if (!ageValue || !weightValue || !heightValue) return 0;
    return calculateTDEE(calculateBMR(gender, weightValue, heightValue, ageValue), activityLevel);
  }, [activityLevel, age, gender, height, weight]);

  const carbsGrams = useMemo(() => Math.round((goalCalories * (carbsPercentage / 100)) / 4), [carbsPercentage, goalCalories]);
  const proteinGrams = useMemo(() => Math.round((goalCalories * (proteinPercentage / 100)) / 4), [goalCalories, proteinPercentage]);
  const fatGrams = useMemo(() => Math.round((goalCalories * (fatPercentage / 100)) / 9), [fatPercentage, goalCalories]);

  useEffect(() => {
    if (!onboardingData || hasHydratedFromServerRef.current) {
      return;
    }

    hasHydratedFromServerRef.current = true;

    setGender(onboardingData.gender);
    setAge(String(onboardingData.age));
    setWeight(String(onboardingData.weight));
    setHeight(String(onboardingData.height));
    setActivityLevel(onboardingData.activityLevel);
    setWaterGoal(onboardingData.waterIntakeGoal);
    setMealsPerDay(getMealsPerDayFromPattern(onboardingData.mealPattern));
    setAllergies(onboardingData.allergies);
    setDiseases(onboardingData.diseases);
    setSelectedDietStyle(onboardingData.dietStyles?.[0] ?? null);
    setLowSodium(onboardingData.constraints?.lowSodium ?? false);
    setLowSugar(onboardingData.constraints?.lowSugar ?? false);
    setMaxCaloriesPerMeal(onboardingData.constraints?.maxCaloriesPerMeal ?? defaultOnboardingDraft.maxCaloriesPerMeal);

    const mealsCount = getMealsPerDayFromPattern(onboardingData.mealPattern);
    const nextGoalCalories = onboardingData.constraints?.maxCaloriesPerMeal
      ? onboardingData.constraints.maxCaloriesPerMeal * mealsCount
      : calculatedTDEE || defaultOnboardingDraft.goalCalories;
    setGoalCalories(nextGoalCalories);

    if (onboardingData.dietStyles?.includes('LOW_CARB')) {
      setCarbsPercentage(5);
      setProteinPercentage(25);
      setFatPercentage(70);
    }

    saveOnboardingDraft({
      gender: onboardingData.gender,
      age: onboardingData.age,
      weight: onboardingData.weight,
      height: onboardingData.height,
      activityLevel: onboardingData.activityLevel,
      tdee: calculatedTDEE || draft.tdee,
      goalCalories: nextGoalCalories,
      goalCarbs: onboardingData.dietStyles?.includes('LOW_CARB')
        ? Math.round((nextGoalCalories * 0.05) / 4)
        : draft.goalCarbs,
      goalProtein: onboardingData.dietStyles?.includes('LOW_CARB')
        ? Math.round((nextGoalCalories * 0.25) / 4)
        : draft.goalProtein,
      goalFat: onboardingData.dietStyles?.includes('LOW_CARB')
        ? Math.round((nextGoalCalories * 0.7) / 9)
        : draft.goalFat,
      dietStyles: onboardingData.dietStyles ?? [],
      waterGoal: onboardingData.waterIntakeGoal,
      mealsPerDay: mealsCount,
      allergies: onboardingData.allergies,
      diseases: onboardingData.diseases,
      lowSodium: onboardingData.constraints?.lowSodium ?? false,
      lowSugar: onboardingData.constraints?.lowSugar ?? false,
      maxCaloriesPerMeal: onboardingData.constraints?.maxCaloriesPerMeal ?? defaultOnboardingDraft.maxCaloriesPerMeal,
    });
  }, [calculatedTDEE, draft.diseases, draft.goalCarbs, draft.goalFat, draft.goalProtein, draft.tdee, onboardingData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(ONBOARDING_STEP_KEY, String(step));
    saveOnboardingDraft({
      gender,
      age: Number(age) || draft.age,
      weight: Number(weight) || draft.weight,
      height: Number(height) || draft.height,
      activityLevel,
      tdee: calculatedTDEE || draft.tdee,
      goalCalories,
      goalCarbs: carbsGrams,
      goalProtein: proteinGrams,
      goalFat: fatGrams,
      dietStyles: selectedDietStyle ? [selectedDietStyle] : [],
      waterGoal,
      mealsPerDay,
      allergies,
      diseases,
      lowSodium,
      lowSugar,
      maxCaloriesPerMeal,
    });
  }, [
    activityLevel,
    age,
    allergies,
    calculatedTDEE,
    carbsGrams,
    draft.age,
    draft.diseases,
    draft.height,
    draft.lowSodium,
    draft.lowSugar,
    draft.maxCaloriesPerMeal,
    draft.mealsPerDay,
    draft.tdee,
    draft.waterGoal,
    draft.weight,
    fatGrams,
    gender,
    goalCalories,
    height,
    lowSodium,
    lowSugar,
    mealsPerDay,
    maxCaloriesPerMeal,
    proteinGrams,
    selectedDietStyle,
    step,
    waterGoal,
    weight,
    diseases,
  ]);

  useEffect(() => {
    const nextRoute = getRouteForStep(step);
    if (location.pathname !== nextRoute) {
      navigate(nextRoute, { replace: true });
    }
  }, [location.pathname, navigate, step]);

  const goToStep = (nextStep: number) => {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      window.localStorage.removeItem(ONBOARDING_STEP_KEY);
    }
    navigate(ROUTES.HOME, { replace: true });
  };

  const handleStep3Continue = () => {
    if (!age || !weight || !height) return;
    goToStep(4);
  };

  const handleStep4Continue = () => {
    if (!calculatedTDEE) return;
    setGoalCalories(calculatedTDEE);
    goToStep(5);
  };

  const handleComplete = async () => {
    const localProfile = {
      gender,
      age: Number(age),
      weight: Number(weight),
      height: Number(height),
      activityLevel,
      tdee: calculatedTDEE,
      goalCalories,
      goalCarbs: carbsGrams,
      goalProtein: proteinGrams,
      goalFat: fatGrams,
      dietStyles: selectedDietStyle ? [selectedDietStyle] : [],
      waterGoal,
      mealsPerDay,
      allergies,
      diseases,
      lowSodium,
      lowSugar,
      maxCaloriesPerMeal,
    };

    const onboardingPayload = {
      data: {
        age: localProfile.age,
        gender: localProfile.gender,
        height: localProfile.height,
        weight: localProfile.weight,
        activityLevel: localProfile.activityLevel,
        mealPattern: getMealPattern(localProfile.mealsPerDay),
        allergies: localProfile.allergies,
        diseases: localProfile.diseases,
        dietStyles: localProfile.dietStyles,
        waterIntakeGoal: localProfile.waterGoal,
        constraints: {
          lowSodium: localProfile.lowSodium,
          lowSugar: localProfile.lowSugar,
          maxCaloriesPerMeal: Math.max(1, localProfile.maxCaloriesPerMeal),
        },
      },
    };

    try {
      await saveOnboardingMutation.mutateAsync(onboardingPayload);
    } catch {
      // Preserve the current onboarding UX even if the API is temporarily unavailable.
    }

    completeOnboarding(localProfile);
    navigate(ROUTES.HOME, { replace: true });
  };

  const handleCarbsChange = (value: number) => {
    const remaining = 100 - value;
    const ratio = proteinPercentage / (proteinPercentage + fatPercentage);
    setSelectedDietStyle(null);
    setCarbsPercentage(value);
    setProteinPercentage(Math.round(remaining * ratio));
    setFatPercentage(Math.round(remaining * (1 - ratio)));
  };

  const handleProteinChange = (value: number) => {
    const remaining = 100 - value;
    const ratio = carbsPercentage / (carbsPercentage + fatPercentage);
    setSelectedDietStyle(null);
    setProteinPercentage(value);
    setCarbsPercentage(Math.round(remaining * ratio));
    setFatPercentage(Math.round(remaining * (1 - ratio)));
  };

  const handleFatChange = (value: number) => {
    const remaining = 100 - value;
    const ratio = carbsPercentage / (carbsPercentage + proteinPercentage);
    setSelectedDietStyle(null);
    setFatPercentage(value);
    setCarbsPercentage(Math.round(remaining * ratio));
    setProteinPercentage(Math.round(remaining * (1 - ratio)));
  };

  const applyDietStylePreset = (
    dietStyle: DietStyle,
    nextCarbsPercentage: number,
    nextProteinPercentage: number,
    nextFatPercentage: number,
  ) => {
    setSelectedDietStyle(dietStyle);
    setCarbsPercentage(nextCarbsPercentage);
    setProteinPercentage(nextProteinPercentage);
    setFatPercentage(nextFatPercentage);
  };

  const transitionClass = direction > 0 ? 'animate-onboarding-slide-in-right' : 'animate-onboarding-slide-in-left';

  return (
    <div className="flex min-h-screen justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full max-w-[390px] overflow-hidden bg-white shadow-sm">
      {step === 0 ? (
        <div
          key="step-0"
          className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white via-green-50/30 to-green-50 p-6 ${transitionClass}`}
        >
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-green-100 rounded-full blur-3xl opacity-40 scale-150" />
              <div className="relative">
                <Carrot className="w-24 h-24 text-green-600" strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-center mb-16">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">NutriAgent</h1>
              <p className="text-base text-gray-600 leading-relaxed">건강한 식습관 관리의 시작</p>
            </div>
            <div className="w-full space-y-3">
              <button onClick={() => goToStep(1)} className="btn-primary w-full min-touch flex items-center justify-center gap-2 shadow-lg shadow-green-500/20">
                시작하기
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={handleSkip} className="w-full min-touch py-3.5 px-6 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                이미 계정이 있습니다
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step > 0 && step < 9 ? (
        <div key={`step-shell-${step}`} className={`min-h-screen p-6 pt-12 pb-24 ${transitionClass}`}>
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-green-600">{`Step ${step} of 9`}</span>
                <span className="text-sm text-gray-500">{getProgressLabel(step)}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600" style={{ width: `${(step / 9) * 100}%` }} />
              </div>
            </div>

            {step === 1 ? (
              <>
                <div className="mb-6 flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Heart className="w-8 h-8 text-white" fill="white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                  NutriAgent에
                  <br />
                  오신 것을 환영합니다!
                </h2>
                <p className="text-sm text-gray-600 mb-8 text-center leading-relaxed">
                  건강한 식습관 관리를 시작하세요.
                  <br />
                  AI 기반 음식 분석과 영양 추적으로
                  <br />
                  당신의 건강 목표를 달성하세요.
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 text-sm">AI 음식 분석</p>
                      <p className="text-xs text-gray-500">사진으로 간편하게 영양소 확인</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 text-sm">맞춤형 목표 설정</p>
                      <p className="text-xs text-gray-500">나만의 영양 목표 관리</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 text-sm">일일 영양 추적</p>
                      <p className="text-xs text-gray-500">실시간 영양소 확인</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => goToStep(2)} className="btn-primary w-full min-touch flex items-center justify-center gap-2">
                  시작하기
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => goToStep(0)} className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 w-full py-2">
                  <ChevronRight className="w-3 h-3 rotate-180" />
                  이전으로
                </button>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">성별을<br />선택해주세요</h2>
                <p className="text-sm text-gray-600 mb-8">목표를 달성하는데 큰 도움이 됩니다!</p>
                <div className="mb-6">
                  <label className="input-label">성별</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setGender('MALE')} className={`min-touch py-4 px-6 rounded-xl border-2 transition-all ${gender === 'MALE' ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}>남성</button>
                    <button onClick={() => setGender('FEMALE')} className={`min-touch py-4 px-6 rounded-xl border-2 transition-all ${gender === 'FEMALE' ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}>여성</button>
                  </div>
                </div>
                <button onClick={() => goToStep(3)} className="btn-primary w-full min-touch flex items-center justify-center gap-2">다음<ChevronRight className="w-5 h-5" /></button>
                <button onClick={() => goToStep(1)} className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 w-full py-2"><ChevronRight className="w-3 h-3 rotate-180" />이전으로</button>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">당신에 대해<br />알려주세요</h2>
                <p className="text-sm text-gray-600 mb-8">목표를 달성하는데 큰 도움이 됩니다!</p>
                <div className="mb-6">
                  <label className="input-label">나이</label>
                  <div className="relative"><input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" className="input-primary pr-12" min="0" max="150" /><div className="absolute right-4 top-1/2 -translate-y-1/2"><span className="text-sm text-gray-500 font-medium">세</span></div></div>
                </div>
                <div className="mb-6">
                  <label className="input-label">체중</label>
                  <div className="relative"><input type="number" inputMode="decimal" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" className="input-primary pr-12" min="0" max="250" /><div className="absolute right-4 top-1/2 -translate-y-1/2"><span className="text-sm text-gray-500 font-medium">kg</span></div></div>
                </div>
                <div className="mb-6">
                  <label className="input-label">신장</label>
                  <div className="relative"><input type="number" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" className="input-primary pr-12" min="0" max="300" /><div className="absolute right-4 top-1/2 -translate-y-1/2"><span className="text-sm text-gray-500 font-medium">cm</span></div></div>
                </div>
                <button onClick={handleStep3Continue} className="btn-primary w-full min-touch flex items-center justify-center gap-2">다음<ChevronRight className="w-5 h-5" /></button>
                <button onClick={() => goToStep(2)} className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 w-full py-2"><ChevronRight className="w-3 h-3 rotate-180" />이전으로</button>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">활동량을<br />선택해주세요</h2>
                <p className="text-sm text-gray-600 mb-8">목표를 달성하는데 큰 도움이 됩니다!</p>
                <div className="mb-8">
                  <label className="input-label">활동량</label>
                  <div className="space-y-2">
                    {activityOptions.map((activity) => {
                      const selected = activityLevel === activity.value;
                      return (
                        <button key={activity.value} onClick={() => setActivityLevel(activity.value)} className={`w-full min-touch p-4 rounded-xl border-2 text-left transition-all ${selected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-semibold ${selected ? 'text-green-700' : 'text-gray-900'}`}>{activity.label}</p>
                              <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                            </div>
                            {selected ? <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"><Check className="w-4 h-4 text-white" /></div> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button onClick={handleStep4Continue} className="btn-primary w-full min-touch flex items-center justify-center gap-2">다음<ChevronRight className="w-5 h-5" /></button>
                <button onClick={() => goToStep(3)} className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 w-full py-2"><ChevronRight className="w-3 h-3 rotate-180" />이전으로</button>
              </>
            ) : null}

            {step === 5 ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">생활 습관을<br />알려주세요</h2>
                <p className="text-sm text-gray-600 mb-8">일상에 맞는 추천을 위해 참고할게요</p>
                <div className="mb-6 p-5 bg-gradient-to-br from-cyan-50 to-sky-50 rounded-2xl border border-cyan-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-cyan-100 flex items-center justify-center">
                      <Droplet className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">하루 물 섭취 목표</p>
                      <p className="text-xs text-gray-500">권장 수분량을 먼저 정해둘게요</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">목표 수분량</span>
                    <span className="number-md text-cyan-600">{waterGoal.toFixed(1)}L</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.1"
                    value={waterGoal}
                    onChange={(e) => setWaterGoal(parseFloat(e.target.value))}
                    className="onboarding-slider w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((waterGoal - 1) / 3) * 100}%, #e5e7eb ${((waterGoal - 1) / 3) * 100}%, #e5e7eb 100%)`,
                    }}
                  />
                </div>
                <div className="mb-8 p-5 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center">
                      <Target className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">하루 식사 횟수</p>
                      <p className="text-xs text-gray-500">현재 습관에 맞게 설정하세요</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setMealsPerDay(count)}
                        className={`min-touch rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all ${
                          mealsPerDay === count
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xs leading-none whitespace-nowrap">
                          {count === 4 ? '4끼 이상' : `${count}끼`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => goToStep(6)} className="btn-primary w-full min-touch flex items-center justify-center gap-2">다음<ChevronRight className="w-5 h-5" /></button>
                <button onClick={() => goToStep(4)} className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 w-full py-2"><ChevronRight className="w-3 h-3 rotate-180" />이전으로</button>
              </>
            ) : null}

            {step === 6 ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">영양 목표를<br />설정하세요</h2>
                <p className="text-sm text-gray-600 mb-8">계산된 TDEE를 기반으로 목표를 설정합니다</p>
                <div className="mb-6 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                  <p className="text-sm text-gray-600 mb-2">현재 당신의 예상 일일 소모 칼로리 (TDEE)</p>
                  <p className="number-xl text-green-600">{calculatedTDEE}</p>
                  <p className="text-xs text-gray-500 mt-1">kcal/일</p>
                </div>
                <div className="mb-8">
                  <label className="input-label">목표 일일 칼로리</label>
                  <div className="relative"><input type="number" inputMode="numeric" value={goalCalories} onChange={(e) => setGoalCalories(parseInt(e.target.value, 10) || 0)} className="input-primary pr-16" /><div className="absolute right-4 top-1/2 -translate-y-1/2"><span className="text-sm text-gray-500 font-medium">kcal</span></div></div>
                  <p className="input-help">체중 감량: TDEE - 500kcal | 유지: TDEE | 증량: TDEE + 500kcal</p>
                </div>
                <div className="mb-8">
                  <h3 className="input-label mb-4">영양소 비율</h3>
                  <div className="mb-6">
                    <p className="text-xs text-gray-500 mb-3">대표적인 식이요법 방식</p>
                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <button type="button" onClick={() => applyDietStylePreset('LEAN_MASS_UP', 45, 30, 25)} className={`px-3 py-2.5 bg-white border-2 rounded-xl text-xs font-medium text-gray-700 active:scale-95 transition-all ${selectedDietStyle === 'LEAN_MASS_UP' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-400 hover:bg-green-50'}`}><div className="font-semibold text-sm mb-0.5">린매스업</div><div className="text-[10px] text-gray-500">근육 증가 + 지방 최소</div></button>
                      <button type="button" onClick={() => applyDietStylePreset('CLEAN_BULK', 50, 25, 25)} className={`px-3 py-2.5 bg-white border-2 rounded-xl text-xs font-medium text-gray-700 active:scale-95 transition-all ${selectedDietStyle === 'CLEAN_BULK' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-400 hover:bg-green-50'}`}><div className="font-semibold text-sm mb-0.5">클린 벌크</div><div className="text-[10px] text-gray-500">균형 잡힌 체중 증가</div></button>
                      <button type="button" onClick={() => applyDietStylePreset('DIRTY_BULK', 45, 20, 35)} className={`px-3 py-2.5 bg-white border-2 rounded-xl text-xs font-medium text-gray-700 active:scale-95 transition-all ${selectedDietStyle === 'DIRTY_BULK' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-400 hover:bg-green-50'}`}><div className="font-semibold text-sm mb-0.5">더티 벌크</div><div className="text-[10px] text-gray-500">빠른 체중 증가 (지방 포함)</div></button>
                      <button type="button" onClick={() => applyDietStylePreset('CUTTING', 40, 35, 25)} className={`px-3 py-2.5 bg-white border-2 rounded-xl text-xs font-medium text-gray-700 active:scale-95 transition-all ${selectedDietStyle === 'CUTTING' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-400 hover:bg-green-50'}`}><div className="font-semibold text-sm mb-0.5">컷팅</div><div className="text-[10px] text-gray-500">체지방 감소 + 근육 유지</div></button>
                    </div>
                    <button type="button" onClick={() => applyDietStylePreset('LOW_CARB', 5, 25, 70)} className={`w-full px-3 py-2.5 bg-white border-2 rounded-xl text-xs font-medium text-gray-700 active:scale-95 transition-all ${selectedDietStyle === 'LOW_CARB' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-400 hover:bg-green-50'}`}><div className="font-semibold text-sm mb-0.5">저탄고지 (LCHF/키토)</div><div className="text-[10px] text-gray-500">지방 기반 에너지 식단</div></button>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3"><label className="text-sm font-medium text-gray-700">탄수화물</label><div className="flex items-center gap-2"><span className="number-sm text-secondary-600">{carbsPercentage}%</span><span className="text-xs text-gray-500">({carbsGrams}g)</span></div></div>
                    <input type="range" min="20" max="70" value={carbsPercentage} onChange={(e) => handleCarbsChange(parseInt(e.target.value, 10))} className="onboarding-slider w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #f97316 0%, #f97316 ${((carbsPercentage - 20) / 50) * 100}%, #e5e7eb ${((carbsPercentage - 20) / 50) * 100}%, #e5e7eb 100%)` }} />
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3"><label className="text-sm font-medium text-gray-700">단백질</label><div className="flex items-center gap-2"><span className="number-sm text-accent-600">{proteinPercentage}%</span><span className="text-xs text-gray-500">({proteinGrams}g)</span></div></div>
                    <input type="range" min="10" max="50" value={proteinPercentage} onChange={(e) => handleProteinChange(parseInt(e.target.value, 10))} className="onboarding-slider w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((proteinPercentage - 10) / 40) * 100}%, #e5e7eb ${((proteinPercentage - 10) / 40) * 100}%, #e5e7eb 100%)` }} />
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3"><label className="text-sm font-medium text-gray-700">지방</label><div className="flex items-center gap-2"><span className="number-sm text-yellow-600">{fatPercentage}%</span><span className="text-xs text-gray-500">({fatGrams}g)</span></div></div>
                    <input type="range" min="15" max="50" value={fatPercentage} onChange={(e) => handleFatChange(parseInt(e.target.value, 10))} className="onboarding-slider w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #eab308 0%, #eab308 ${((fatPercentage - 15) / 35) * 100}%, #e5e7eb ${((fatPercentage - 15) / 35) * 100}%, #e5e7eb 100%)` }} />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><div className="flex items-center justify-between"><span className="text-sm text-gray-600">총 합계</span><span className={`number-sm ${carbsPercentage + proteinPercentage + fatPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>{carbsPercentage + proteinPercentage + fatPercentage}%</span></div></div>
                </div>
                <div className="text-center">
                  <button onClick={() => goToStep(7)} className="btn-primary w-full min-touch flex items-center justify-center gap-2" disabled={carbsPercentage + proteinPercentage + fatPercentage !== 100}>다음<ChevronRight className="w-5 h-5" /></button>
                  <button onClick={() => goToStep(5)} className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 w-full py-2"><ChevronRight className="w-3 h-3 rotate-180" />이전으로</button>
                </div>
              </>
            ) : null}

            {step === 7 ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">알러지 정보를<br />선택하세요</h2>
                <p className="text-sm text-gray-600 mb-8">안전한 식단 관리를 위해 알려주세요 (선택사항)</p>
                <div className="mb-8">
                  <label className="input-label mb-4">알러지가 있는 식품을 모두 선택하세요</label>
                  <div className="grid grid-cols-2 gap-2">
                    {allergyOptions.map((allergy) => {
                      const isSelected = allergies.includes(allergy.value);
                      return (
                        <button key={allergy.value} type="button" onClick={() => setAllergies((prev) => (isSelected ? prev.filter((value) => value !== allergy.value) : [...prev, allergy.value]))} className={`min-touch p-4 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><span className="text-2xl">{allergy.emoji}</span><span className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>{allergy.label}</span></div>
                            {isSelected ? <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></div> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {allergies.length > 0 ? <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200"><p className="text-xs font-medium text-amber-900 mb-1">선택된 알러지</p><p className="text-sm text-amber-700">{allergies.join(', ')}</p></div> : <p className="mt-4 text-xs text-gray-500 text-center">알러지가 없다면 바로 다음으로 진행하세요</p>}
                </div>
                <div className="text-center">
                  <button onClick={() => goToStep(8)} className="btn-primary w-full min-touch flex items-center justify-center gap-2">다음<ChevronRight className="w-5 h-5" /></button>
                  <button onClick={() => goToStep(6)} className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 w-full py-2"><ChevronRight className="w-3 h-3 rotate-180" />이전으로</button>
                </div>
              </>
            ) : null}

            {step === 8 ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">질환 정보를<br />입력하세요</h2>
                <p className="text-sm text-gray-600 mb-8">건강한 식단을 위한 참고 정보입니다 (선택사항)</p>
                <div className="mb-8">
                  <label className="input-label mb-4">질환을 모두 선택하세요</label>
                  <div className="grid grid-cols-2 gap-2">
                    {diseaseOptions.map((disease) => {
                      const isSelected = diseases.includes(disease.value);
                      const Icon = disease.icon;
                      return (
                        <button
                          key={disease.value}
                          type="button"
                          onClick={() =>
                            setDiseases((prev) =>
                              isSelected ? prev.filter((value) => value !== disease.value) : [...prev, disease.value],
                            )
                          }
                          className={`min-touch p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSelected ? 'bg-green-500' : 'bg-gray-200'}`}>
                                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                              </div>
                              <span className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>{disease.label}</span>
                            </div>
                            {isSelected ? <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></div> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {diseases.length > 0 ? <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200"><p className="text-xs font-medium text-amber-900 mb-1">선택된 질환</p><p className="text-sm text-amber-700">{diseaseOptions.filter((disease) => diseases.includes(disease.value)).map((disease) => disease.label).join(', ')}</p></div> : <p className="mt-4 text-xs text-gray-500 text-center">질환이 없다면 바로 다음으로 진행하세요</p>}
                </div>
                <div className="text-center">
                  <button onClick={() => goToStep(9)} className="btn-primary w-full min-touch flex items-center justify-center gap-2">다음<ChevronRight className="w-5 h-5" /></button>
                  <button onClick={() => goToStep(7)} className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 w-full py-2"><ChevronRight className="w-3 h-3 rotate-180" />이전으로</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 9 ? (
        <div key="step-9" className={`min-h-screen bg-white p-6 pt-12 pb-24 ${transitionClass}`}>
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-green-600">Step 9 of 9</span>
                <span className="text-sm text-gray-500">추가 설정</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-300" style={{ width: '100%' }} />
              </div>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-gray-900">추가 식단 설정을<br />체크해주세요</h2>
            <p className="mb-8 text-sm text-gray-600">더 건강한 식단을 위한 세부 설정입니다 (선택사항)</p>

            <div className="mb-8">
              <label className="input-label mb-4">추가 식단 설정</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLowSodium((prev) => !prev)}
                  className={`min-touch rounded-xl border-2 px-4 py-4 transition-all ${lowSodium ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  aria-label={`저염 ${lowSodium ? '선택됨' : '선택'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${lowSodium ? 'text-green-700' : 'text-gray-700'}`}>저염</span>
                    {lowSodium ? (
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : null}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLowSugar((prev) => !prev)}
                  className={`min-touch rounded-xl border-2 px-4 py-4 transition-all ${lowSugar ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  aria-label={`저당 ${lowSugar ? '선택됨' : '선택'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${lowSugar ? 'text-green-700' : 'text-gray-700'}`}>저당</span>
                    {lowSugar ? (
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : null}
                  </div>
                </button>
              </div>
            </div>

            <div className="mb-8">
              <label className="input-label">식사 당 목표 최대 칼로리</label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  value={maxCaloriesPerMeal}
                  onChange={(e) => setMaxCaloriesPerMeal(parseInt(e.target.value, 10) || defaultOnboardingDraft.maxCaloriesPerMeal)}
                  className="input-primary pr-16"
                  aria-label="식사 당 목표 최대 칼로리 입력"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="text-sm font-medium text-gray-500">kcal</span>
                </div>
              </div>
              <p className="input-help">한 끼 식사의 최대 칼로리 목표를 설정합니다</p>
            </div>

            <div className="text-center">
              <button onClick={() => goToStep(10)} className="btn-primary flex w-full min-touch items-center justify-center gap-2">
                다음
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={() => goToStep(8)} className="mt-3 flex w-full items-center justify-center gap-1 py-2 text-sm text-gray-400 transition-colors hover:text-gray-600">
                <ChevronRight className="w-3 h-3 rotate-180" />
                이전으로
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step === 10 ? (
        <div key="step-10" className={`min-h-screen flex flex-col items-center justify-center bg-white p-6 ${transitionClass}`}>
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-green-100 rounded-full blur-3xl opacity-40 scale-150 animate-pulse" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-12 h-12 text-white" strokeWidth={3} />
              </div>
            </div>
            <div className="text-center mb-16">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">모든 준비가<br />완료되었습니다!</h1>
              <p className="text-base text-gray-600 leading-relaxed">NutriAgent와 함께<br />건강한 식습관 관리를 시작하세요</p>
            </div>
            <div className="w-full space-y-3">
              <button onClick={handleComplete} className="btn-primary w-full min-touch flex items-center justify-center gap-2 shadow-lg shadow-green-500/20">
                시작하기
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={() => goToStep(9)} className="w-full min-touch py-3.5 px-6 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                <div className="flex items-center justify-center gap-1"><ChevronRight className="w-3 h-3 rotate-180" />이전으로</div>
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
