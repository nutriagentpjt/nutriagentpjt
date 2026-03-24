import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, Carrot, Check, ChevronRight, Heart, Target } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
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
import type { ActivityLevel, DietStyle, Gender } from '@/types/onboarding';

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

const getRouteForStep = (step: number) => {
  if (step <= 1) return ROUTES.ONBOARDING_WELCOME;
  if (step <= 4) return ROUTES.ONBOARDING_TDEE;
  return ROUTES.ONBOARDING_GOAL;
};

interface OnboardingFlowProps {
  fallbackStep: number;
}

export default function OnboardingFlow({ fallbackStep }: OnboardingFlowProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useAuthStore((state) => state.userId) ?? 1;
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
  const [allergies, setAllergies] = useState<string[]>(draft.allergies);

  const hasLocalDraft =
    typeof window !== 'undefined' && Boolean(window.localStorage.getItem(ONBOARDING_DRAFT_KEY));

  const { data: onboardingData } = useOnboarding({
    userId,
    enabled: !hasLocalDraft,
  });
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
    setGoalCalories(onboardingData.goalCalories);

    const totalCalories = onboardingData.goalCalories || 1;
    const nextCarbsPercentage = Math.round(((onboardingData.goalCarbs * 4) / totalCalories) * 100);
    const nextProteinPercentage = Math.round(((onboardingData.goalProtein * 4) / totalCalories) * 100);
    const nextFatPercentage = Math.max(
      0,
      100 - nextCarbsPercentage - nextProteinPercentage,
    );

    setCarbsPercentage(nextCarbsPercentage);
    setProteinPercentage(nextProteinPercentage);
    setFatPercentage(nextFatPercentage);
    setSelectedDietStyle(onboardingData.dietStyles?.[0] ?? null);

    saveOnboardingDraft({
      gender: onboardingData.gender,
      age: onboardingData.age,
      weight: onboardingData.weight,
      height: onboardingData.height,
      activityLevel: onboardingData.activityLevel,
      tdee: onboardingData.tdee,
      goalCalories: onboardingData.goalCalories,
      goalCarbs: onboardingData.goalCarbs,
      goalProtein: onboardingData.goalProtein,
      goalFat: onboardingData.goalFat,
      dietStyles: onboardingData.dietStyles ?? [],
    });
  }, [onboardingData]);

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
      allergies,
    });
  }, [
    activityLevel,
    age,
    allergies,
    calculatedTDEE,
    carbsGrams,
    draft.age,
    draft.height,
    draft.tdee,
    draft.weight,
    fatGrams,
    gender,
    goalCalories,
    height,
    proteinGrams,
    selectedDietStyle,
    step,
    weight,
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
    const onboardingPayload = {
      userId,
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
      allergies,
    };

    try {
      await saveOnboardingMutation.mutateAsync({
        userId: onboardingPayload.userId,
        gender: onboardingPayload.gender,
        age: onboardingPayload.age,
        weight: onboardingPayload.weight,
        height: onboardingPayload.height,
        activityLevel: onboardingPayload.activityLevel,
        goalCalories: onboardingPayload.goalCalories,
        goalCarbs: onboardingPayload.goalCarbs,
        goalProtein: onboardingPayload.goalProtein,
        goalFat: onboardingPayload.goalFat,
        dietStyles: onboardingPayload.dietStyles,
      });
    } catch {
      // Preserve the current onboarding UX even if the API is temporarily unavailable.
    }

    completeOnboarding(onboardingPayload);
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

      {step > 0 && step < 7 ? (
        <div key={`step-shell-${step}`} className={`min-h-screen p-6 pt-12 pb-24 ${transitionClass}`}>
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-green-600">{`Step ${step} of 6`}</span>
                <span className="text-sm text-gray-500">
                  {step === 1 ? '서비스 소개' : step === 2 ? '성별 선택' : step === 3 ? '체중, 신장, 나이 입력' : step === 4 ? '활동량 선택' : step === 5 ? '목표 설정' : '알러지 정보'}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600" style={{ width: `${(step / 6) * 100}%` }} />
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
                    <input type="range" min="20" max="70" value={carbsPercentage} onChange={(e) => handleCarbsChange(parseInt(e.target.value, 10))} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #f97316 0%, #f97316 ${((carbsPercentage - 20) / 50) * 100}%, #e5e7eb ${((carbsPercentage - 20) / 50) * 100}%, #e5e7eb 100%)` }} />
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3"><label className="text-sm font-medium text-gray-700">단백질</label><div className="flex items-center gap-2"><span className="number-sm text-accent-600">{proteinPercentage}%</span><span className="text-xs text-gray-500">({proteinGrams}g)</span></div></div>
                    <input type="range" min="10" max="50" value={proteinPercentage} onChange={(e) => handleProteinChange(parseInt(e.target.value, 10))} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((proteinPercentage - 10) / 40) * 100}%, #e5e7eb ${((proteinPercentage - 10) / 40) * 100}%, #e5e7eb 100%)` }} />
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3"><label className="text-sm font-medium text-gray-700">지방</label><div className="flex items-center gap-2"><span className="number-sm text-yellow-600">{fatPercentage}%</span><span className="text-xs text-gray-500">({fatGrams}g)</span></div></div>
                    <input type="range" min="15" max="50" value={fatPercentage} onChange={(e) => handleFatChange(parseInt(e.target.value, 10))} className="w-full h-2 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #eab308 0%, #eab308 ${((fatPercentage - 15) / 35) * 100}%, #e5e7eb ${((fatPercentage - 15) / 35) * 100}%, #e5e7eb 100%)` }} />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><div className="flex items-center justify-between"><span className="text-sm text-gray-600">총 합계</span><span className={`number-sm ${carbsPercentage + proteinPercentage + fatPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>{carbsPercentage + proteinPercentage + fatPercentage}%</span></div></div>
                </div>
                <div className="text-center">
                  <button onClick={() => goToStep(6)} className="btn-primary w-full min-touch flex items-center justify-center gap-2" disabled={carbsPercentage + proteinPercentage + fatPercentage !== 100}>다음<ChevronRight className="w-5 h-5" /></button>
                  <button onClick={() => goToStep(4)} className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 w-full py-2"><ChevronRight className="w-3 h-3 rotate-180" />이전으로</button>
                </div>
              </>
            ) : null}

            {step === 6 ? (
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
                  <button onClick={() => goToStep(7)} className="btn-primary w-full min-touch flex items-center justify-center gap-2">다음<ChevronRight className="w-5 h-5" /></button>
                  <button onClick={() => goToStep(5)} className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 w-full py-2"><ChevronRight className="w-3 h-3 rotate-180" />이전으로</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 7 ? (
        <div key="step-7" className={`min-h-screen flex flex-col items-center justify-center bg-white p-6 ${transitionClass}`}>
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-green-100 rounded-full blur-3xl opacity-40 scale-150" />
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
              <button onClick={() => goToStep(6)} className="w-full min-touch py-3.5 px-6 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
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
