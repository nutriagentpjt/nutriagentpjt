import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Apple,
  Bell,
  Edit2,
  LogOut,
  Ruler,
  Scale,
  Settings,
  Target,
  TrendingUp,
  User,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import NotificationSettings from '@/components/profile/NotificationSettings';
import {
  activityLabelMap,
  defaultProfile,
  loadStoredProfile,
  mergeBackendProfile,
  saveStoredProfile,
  type StoredProfile,
} from '@/components/profile/shared';
import { useNutritionTargets, useProfile } from '@/hooks';
import { GUEST_ID_STORAGE_KEY } from '@/services/sessionService';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StoredProfile>(() => loadStoredProfile());
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditGoals, setShowEditGoals] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const [editWeight, setEditWeight] = useState(profile.weight?.toString() || '');
  const [editHeight, setEditHeight] = useState(profile.height?.toString() || '');
  const [editAge, setEditAge] = useState(profile.age?.toString() || '');
  const [editActivityLevel, setEditActivityLevel] = useState(profile.activityLevel || defaultProfile.activityLevel);
  const [editGoalCalories, setEditGoalCalories] = useState(profile.goalCalories || defaultProfile.goalCalories || 2000);
  const [editCarbsPercentage, setEditCarbsPercentage] = useState(50);
  const [editProteinPercentage, setEditProteinPercentage] = useState(25);
  const [editFatPercentage, setEditFatPercentage] = useState(25);
  const { data: backendProfile, updateProfileAsync } = useProfile();
  const { data: nutritionTargets, updateNutritionTargetsAsync } = useNutritionTargets();

  const userName = '사용자';
  const profileImageUrl = null;

  const persistProfile = (nextProfile: StoredProfile) => {
    setProfile(nextProfile);
    saveStoredProfile(nextProfile);
  };

  const calculateBMI = useMemo(() => {
    if (!profile.weight || !profile.height) return '0.0';
    const heightInMeters = profile.height / 100;
    return (profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
  }, [profile.height, profile.weight]);

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { text: '저체중', color: 'text-blue-600' };
    if (bmi < 23) return { text: '정상', color: 'text-green-600' };
    if (bmi < 25) return { text: '과체중', color: 'text-yellow-600' };
    return { text: '비만', color: 'text-red-600' };
  };

  const bmi = Number.parseFloat(calculateBMI);
  const bmiStatus = getBMIStatus(bmi);

  useEffect(() => {
    if (!backendProfile && !nutritionTargets) {
      return;
    }

    setProfile((currentProfile) => {
      const nextProfile = mergeBackendProfile({
        currentProfile,
        profile: backendProfile,
        nutritionTargets,
      });

      saveStoredProfile(nextProfile);
      return nextProfile;
    });
  }, [backendProfile, nutritionTargets]);

  const handleSaveProfile = async () => {
    const nextProfile: StoredProfile = {
      ...profile,
      weight: Number.parseFloat(editWeight) || profile.weight,
      height: Number.parseFloat(editHeight) || profile.height,
      age: Number.parseFloat(editAge) || profile.age,
      activityLevel: editActivityLevel,
    };

    try {
      const updatedProfile = await updateProfileAsync({
        age: nextProfile.age,
        gender: nextProfile.gender,
        height: nextProfile.height,
        weight: nextProfile.weight,
        activityLevel: nextProfile.activityLevel,
      });

      persistProfile(
        mergeBackendProfile({
          currentProfile: nextProfile,
          profile: updatedProfile,
          nutritionTargets,
        }),
      );
    } catch {
      persistProfile(nextProfile);
    }

    setShowEditProfile(false);
  };

  const applyPreset = (carbs: number, protein: number, fat: number) => {
    setEditCarbsPercentage(carbs);
    setEditProteinPercentage(protein);
    setEditFatPercentage(fat);
  };

  const handleOpenEditGoals = () => {
    const goalCalories = profile.goalCalories || defaultProfile.goalCalories || 2000;
    const totalCalories = goalCalories || 1;
    const carbsPercentage = Math.round((((profile.goalCarbs || defaultProfile.goalCarbs || 250) * 4) / totalCalories) * 100);
    const proteinPercentage = Math.round((((profile.goalProtein || defaultProfile.goalProtein || 125) * 4) / totalCalories) * 100);
    const fatPercentage = Math.max(0, 100 - carbsPercentage - proteinPercentage);

    setEditGoalCalories(goalCalories);
    setEditCarbsPercentage(carbsPercentage);
    setEditProteinPercentage(proteinPercentage);
    setEditFatPercentage(fatPercentage);
    setShowEditGoals(true);
  };

  const handleSaveGoals = async () => {
    const goalCalories = editGoalCalories || 2000;
    const goalCarbs = Math.round((goalCalories * (editCarbsPercentage / 100)) / 4);
    const goalProtein = Math.round((goalCalories * (editProteinPercentage / 100)) / 4);
    const goalFat = Math.round((goalCalories * (editFatPercentage / 100)) / 9);

    const nextProfile = {
      ...profile,
      goalCalories,
      goalCarbs,
      goalProtein,
      goalFat,
    };

    persistProfile(nextProfile);

    try {
      const updatedTargets = await updateNutritionTargetsAsync({
        calories: goalCalories,
        carbs: goalCarbs,
        protein: goalProtein,
        fat: goalFat,
      });

      persistProfile(
        mergeBackendProfile({
          currentProfile: nextProfile,
          profile: backendProfile,
          nutritionTargets: updatedTargets,
        }),
      );
    } catch {
      // Keep the current local goals UX even if the backend target sync is unavailable.
    }

    setShowEditGoals(false);
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      window.localStorage.removeItem('onboardingComplete');
      window.localStorage.removeItem('userProfile');
      window.localStorage.removeItem('onboardingDraft');
      window.localStorage.removeItem('onboardingCurrentStep');
      window.localStorage.removeItem(GUEST_ID_STORAGE_KEY);
      navigate(ROUTES.ONBOARDING_WELCOME, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="relative px-5 pb-24 pt-16" style={{ backgroundColor: '#1cb454' }}>
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Profile"
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white shadow-lg">
                <User className="h-12 w-12" style={{ color: '#1cb454' }} />
              </div>
            )}
          </div>

          <h1 className="mb-1 text-2xl font-bold text-white">{userName} 님</h1>
          <p className="text-sm text-white/90">
            {profile.gender === 'FEMALE' ? '여성' : '남성'} · {profile.age || '-'}세
          </p>
        </div>
      </div>

      <div className="relative z-10 -mt-16 px-5">
        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
                <Scale className="h-6 w-6 text-blue-500" />
              </div>
              <p className="mb-1 text-xs text-gray-500">체중</p>
              <p className="text-lg font-bold text-gray-900">{profile.weight || '-'}</p>
              <p className="text-[10px] text-gray-400">kg</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                <Ruler className="h-6 w-6 text-purple-500" />
              </div>
              <p className="mb-1 text-xs text-gray-500">키</p>
              <p className="text-lg font-bold text-gray-900">{profile.height || '-'}</p>
              <p className="text-[10px] text-gray-400">cm</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <p className="mb-1 text-xs text-gray-500">BMI</p>
              <p className={`text-lg font-bold ${bmiStatus.color}`}>{calculateBMI}</p>
              <p className={`text-[10px] ${bmiStatus.color}`}>{bmiStatus.text}</p>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">활동량</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {activityLabelMap[profile.activityLevel || defaultProfile.activityLevel]}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Apple className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">TDEE</span>
              </div>
              <span className="text-sm font-semibold text-green-600">{profile.tdee || '-'} kcal</span>
            </div>
          </div>

          <button
            onClick={() => setShowEditProfile(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-50 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
          >
            <Edit2 className="h-4 w-4" />
            프로필 수정
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">영양 목표</h2>
            <button
              onClick={handleOpenEditGoals}
              className="rounded-lg p-2 transition-all hover:bg-gray-100 active:scale-95"
            >
              <Edit2 className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          <div className="mb-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-4">
            <p className="mb-1 text-xs text-gray-600">목표 칼로리</p>
            <p className="text-2xl font-bold text-green-600">{profile.goalCalories || '-'}</p>
            <p className="mt-0.5 text-xs text-gray-500">kcal/일</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600">탄수화물</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">{profile.goalCarbs || '-'} g</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">단백질</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">{profile.goalProtein || '-'} g</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-600">지방</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">{profile.goalFat || '-'} g</span>
            </div>
          </div>
        </div>

        <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <button
            onClick={() => setShowSettings((prev) => !prev)}
            className="flex w-full items-center justify-between p-5 transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <Settings className="h-5 w-5 text-gray-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">설정</span>
            </div>
            <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${showSettings ? 'rotate-90' : ''}`} />
          </button>

          {showSettings ? (
            <div className="border-t border-gray-100">
              <button
                onClick={() => setShowNotificationSettings(true)}
                className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">알림 설정</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>

              <button
                onClick={() => navigate(ROUTES.RECOMMENDATION_SETTINGS)}
                className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">개인 설정</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          ) : null}
        </div>

        <div className="py-6 text-center">
          <button
            onClick={handleLogout}
            className="mx-auto flex items-center justify-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-red-500 active:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {showEditProfile ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full rounded-t-3xl bg-white p-6 shadow-xl sm:max-w-[400px] sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">프로필 수정</h3>
              <button
                type="button"
                aria-label="프로필 수정 닫기"
                onClick={() => setShowEditProfile(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200"
              >
                <span className="text-xl text-gray-400">×</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">나이</label>
                <input
                  type="number"
                  value={editAge}
                  onChange={(event) => setEditAge(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  placeholder="예: 25"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">체중 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editWeight}
                  onChange={(event) => setEditWeight(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  placeholder="예: 70.5"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">키 (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editHeight}
                  onChange={(event) => setEditHeight(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  placeholder="예: 175"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">활동량</label>
                <select
                  value={editActivityLevel}
                  onChange={(event) => setEditActivityLevel(event.target.value as NonNullable<StoredProfile['activityLevel']>)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  <option value="SEDENTARY">거의 활동 없음</option>
                  <option value="LIGHTLY_ACTIVE">가벼운 활동</option>
                  <option value="MODERATELY_ACTIVE">보통 활동</option>
                  <option value="VERY_ACTIVE">높은 활동</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowEditProfile(false)}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-200 active:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 rounded-xl bg-green-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-600 active:bg-green-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showEditGoals ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:max-w-[400px] sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">목표 설정 수정</h3>
              <button
                type="button"
                aria-label="목표 설정 수정 닫기"
                onClick={() => setShowEditGoals(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200"
              >
                <span className="text-xl text-gray-400">×</span>
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">목표 칼로리</label>
                <input
                  type="number"
                  value={editGoalCalories}
                  onChange={(event) => setEditGoalCalories(Number.parseInt(event.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  placeholder="예: 2000"
                />
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-gray-700">빠른 설정</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset(45, 30, 25)}
                    className="rounded-xl border-2 border-gray-200 bg-white px-3 py-3 text-center transition-all hover:border-green-400 hover:bg-green-50 active:scale-95"
                  >
                    <div className="mb-1 font-semibold text-gray-900">린매스업</div>
                    <div className="text-[10px] text-gray-500">근육 증가 + 지방 최소</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(50, 25, 25)}
                    className="rounded-xl border-2 border-gray-200 bg-white px-3 py-3 text-center transition-all hover:border-green-400 hover:bg-green-50 active:scale-95"
                  >
                    <div className="mb-1 font-semibold text-gray-900">클린 벌크</div>
                    <div className="text-[10px] text-gray-500">균형 잡힌 체중 증가</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(45, 20, 35)}
                    className="rounded-xl border-2 border-gray-200 bg-white px-3 py-3 text-center transition-all hover:border-green-400 hover:bg-green-50 active:scale-95"
                  >
                    <div className="mb-1 font-semibold text-gray-900">더티 벌크</div>
                    <div className="text-[10px] text-gray-500">빠른 체중 증가</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(40, 35, 25)}
                    className="rounded-xl border-2 border-gray-200 bg-white px-3 py-3 text-center transition-all hover:border-green-400 hover:bg-green-50 active:scale-95"
                  >
                    <div className="mb-1 font-semibold text-gray-900">컷팅</div>
                    <div className="text-[10px] text-gray-500">체지방 감소</div>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => applyPreset(5, 25, 70)}
                  className="mt-2 w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-3 text-center transition-all hover:border-green-400 hover:bg-green-50 active:scale-95"
                >
                  <div className="mb-1 font-semibold text-gray-900">저탄고지 (LCHF/키토)</div>
                  <div className="text-[10px] text-gray-500">지방 기반 에너지 식단</div>
                </button>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-gray-700">세부 조정</p>

                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">탄수화물</label>
                    <span className="text-sm font-semibold text-blue-600">{editCarbsPercentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editCarbsPercentage}
                    onChange={(event) => setEditCarbsPercentage(Number.parseInt(event.target.value, 10))}
                    className="onboarding-slider w-full appearance-none cursor-pointer rounded-lg h-2"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${editCarbsPercentage}%, #e5e7eb ${editCarbsPercentage}%, #e5e7eb 100%)`,
                    }}
                  />
                </div>

                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">단백질</label>
                    <span className="text-sm font-semibold text-red-600">{editProteinPercentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editProteinPercentage}
                    onChange={(event) => setEditProteinPercentage(Number.parseInt(event.target.value, 10))}
                    className="onboarding-slider w-full appearance-none cursor-pointer rounded-lg h-2"
                    style={{
                      background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${editProteinPercentage}%, #e5e7eb ${editProteinPercentage}%, #e5e7eb 100%)`,
                    }}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">지방</label>
                    <span className="text-sm font-semibold text-yellow-600">{editFatPercentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editFatPercentage}
                    onChange={(event) => setEditFatPercentage(Number.parseInt(event.target.value, 10))}
                    className="onboarding-slider w-full appearance-none cursor-pointer rounded-lg h-2"
                    style={{
                      background: `linear-gradient(to right, #eab308 0%, #eab308 ${editFatPercentage}%, #e5e7eb ${editFatPercentage}%, #e5e7eb 100%)`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="mb-3 text-xs font-semibold text-gray-700">예상 영양소</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">탄수화물</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {Math.round((editGoalCalories * (editCarbsPercentage / 100)) / 4)}g
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">단백질</span>
                    <span className="text-sm font-semibold text-red-600">
                      {Math.round((editGoalCalories * (editProteinPercentage / 100)) / 4)}g
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">지방</span>
                    <span className="text-sm font-semibold text-yellow-600">
                      {Math.round((editGoalCalories * (editFatPercentage / 100)) / 9)}g
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowEditGoals(false)}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-200 active:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={handleSaveGoals}
                className="flex-1 rounded-xl bg-green-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-600 active:bg-green-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showNotificationSettings ? <NotificationSettings onClose={() => setShowNotificationSettings(false)} /> : null}
    </div>
  );
}
