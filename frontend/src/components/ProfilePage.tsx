import { useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  ChevronRight,
  Edit2,
  LogOut,
  Ruler,
  Scale,
  Settings,
  Target,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

type ActivityLevelValue = 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
type GenderValue = 'MALE' | 'FEMALE';

interface StoredProfile {
  gender?: GenderValue;
  age?: number;
  weight?: number;
  height?: number;
  activityLevel?: ActivityLevelValue;
  tdee?: number;
  goalCalories?: number;
  goalCarbs?: number;
  goalProtein?: number;
  goalFat?: number;
}

const STORAGE_KEY = 'userProfile';

const activityLabelMap: Record<ActivityLevelValue, string> = {
  SEDENTARY: '거의 활동 없음',
  LIGHTLY_ACTIVE: '가벼운 활동',
  MODERATELY_ACTIVE: '보통 활동',
  VERY_ACTIVE: '높은 활동',
  EXTRA_ACTIVE: '매우 높은 활동',
};

const defaultProfile: StoredProfile = {
  gender: 'MALE',
  age: 25,
  weight: 70,
  height: 175,
  activityLevel: 'MODERATELY_ACTIVE',
  goalCalories: 2000,
  goalCarbs: 250,
  goalProtein: 125,
  goalFat: 56,
};

function normalizeGender(gender?: string): GenderValue {
  return gender === 'female' || gender === 'FEMALE' ? 'FEMALE' : 'MALE';
}

function normalizeActivityLevel(activityLevel?: string): ActivityLevelValue {
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
      return defaultProfile.activityLevel ?? 'MODERATELY_ACTIVE';
  }
}

function loadStoredProfile(): StoredProfile {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
    };
  } catch {
    return defaultProfile;
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StoredProfile>(() => loadStoredProfile());
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditGoals, setShowEditGoals] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [editWeight, setEditWeight] = useState(profile.weight?.toString() ?? '');
  const [editHeight, setEditHeight] = useState(profile.height?.toString() ?? '');
  const [editAge, setEditAge] = useState(profile.age?.toString() ?? '');
  const [editActivityLevel, setEditActivityLevel] = useState<ActivityLevelValue>(profile.activityLevel ?? 'MODERATELY_ACTIVE');
  const [editGoalCalories, setEditGoalCalories] = useState(profile.goalCalories ?? 2000);
  const [editCarbsPercentage, setEditCarbsPercentage] = useState(50);
  const [editProteinPercentage, setEditProteinPercentage] = useState(25);
  const [editFatPercentage, setEditFatPercentage] = useState(25);

  const bmi = useMemo(() => {
    if (!profile.weight || !profile.height) return '0.0';
    const heightInMeters = profile.height / 100;
    return (profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
  }, [profile.height, profile.weight]);

  const persistProfile = (nextProfile: StoredProfile) => {
    setProfile(nextProfile);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
  };

  const handleOpenEditGoals = () => {
    const goalCalories = profile.goalCalories ?? 2000;
    const totalCalories = goalCalories || 1;
    const carbsPercentage = Math.round((((profile.goalCarbs ?? 250) * 4) / totalCalories) * 100);
    const proteinPercentage = Math.round((((profile.goalProtein ?? 125) * 4) / totalCalories) * 100);
    const fatPercentage = Math.max(0, 100 - carbsPercentage - proteinPercentage);

    setEditGoalCalories(goalCalories);
    setEditCarbsPercentage(carbsPercentage);
    setEditProteinPercentage(proteinPercentage);
    setEditFatPercentage(fatPercentage);
    setShowEditGoals(true);
  };

  const handleSaveProfile = () => {
    const nextProfile: StoredProfile = {
      ...profile,
      weight: Number.parseFloat(editWeight) || profile.weight,
      height: Number.parseFloat(editHeight) || profile.height,
      age: Number.parseFloat(editAge) || profile.age,
      activityLevel: editActivityLevel,
    };
    persistProfile(nextProfile);
    setShowEditProfile(false);
  };

  const handleSaveGoals = () => {
    const goalCalories = editGoalCalories || 2000;
    const goalCarbs = Math.round((goalCalories * (editCarbsPercentage / 100)) / 4);
    const goalProtein = Math.round((goalCalories * (editProteinPercentage / 100)) / 4);
    const goalFat = Math.round((goalCalories * (editFatPercentage / 100)) / 9);

    persistProfile({
      ...profile,
      goalCalories,
      goalCarbs,
      goalProtein,
      goalFat,
    });
    setShowEditGoals(false);
  };

  const handleLogout = () => {
    window.localStorage.removeItem('onboardingComplete');
    window.localStorage.removeItem(STORAGE_KEY);
    navigate(ROUTES.ONBOARDING_WELCOME);
  };

  const bmiNumber = Number.parseFloat(bmi);
  const bmiLabel = bmiNumber < 18.5 ? '저체중' : bmiNumber < 23 ? '정상' : bmiNumber < 25 ? '과체중' : '비만';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-5 pb-8 pt-12">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
            <User className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">마이페이지</h1>
            <p className="text-sm text-green-100">건강한 하루를 만들어가요</p>
          </div>
        </div>
      </div>

      <div className="-mt-4 px-5">
        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">프로필 정보</h2>
            <button
              onClick={() => setShowEditProfile(true)}
              className="rounded-lg p-2 transition-all hover:bg-gray-100 active:scale-95"
              aria-label="프로필 정보 수정"
            >
              <Edit2 className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">나이</p>
                  <p className="text-sm font-semibold text-gray-900">{profile.age ?? '-'}세</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">{profile.gender === 'FEMALE' ? '여성' : '남성'}</p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                  <Scale className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">체중</p>
                  <p className="text-sm font-semibold text-gray-900">{profile.weight ?? '-'} kg</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                  <Ruler className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">키</p>
                  <p className="text-sm font-semibold text-gray-900">{profile.height ?? '-'} cm</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                  <Activity className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">활동량</p>
                  <p className="text-sm font-semibold text-gray-900">{activityLabelMap[profile.activityLevel ?? 'MODERATELY_ACTIVE']}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">인바디 정보</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
              <p className="mb-1 text-xs text-gray-600">BMI</p>
              <p className="text-2xl font-bold text-gray-900">{bmi}</p>
              <p className="mt-1 text-[10px] text-gray-500">{bmiLabel}</p>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-4">
              <p className="mb-1 text-xs text-gray-600">TDEE</p>
              <p className="text-2xl font-bold text-gray-900">{profile.tdee ?? '-'}</p>
              <p className="mt-1 text-[10px] text-gray-500">kcal/일</p>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">목표 설정</h2>
            <button
              onClick={handleOpenEditGoals}
              className="rounded-lg p-2 transition-all hover:bg-gray-100 active:scale-95"
              aria-label="목표 설정 수정"
            >
              <Edit2 className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <span className="text-sm text-gray-600">목표 칼로리</span>
              <span className="text-sm font-semibold text-gray-900">{profile.goalCalories ?? '-'} kcal</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <span className="text-sm text-gray-600">탄수화물</span>
              <span className="text-sm font-semibold text-blue-600">{profile.goalCarbs ?? '-'} g</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 py-2">
              <span className="text-sm text-gray-600">단백질</span>
              <span className="text-sm font-semibold text-red-600">{profile.goalProtein ?? '-'} g</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">지방</span>
              <span className="text-sm font-semibold text-yellow-600">{profile.goalFat ?? '-'} g</span>
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
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">알림 설정</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.RECOMMENDATION_SETTINGS)}
                className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">추천 설정</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          ) : null}
        </div>

        <button
          onClick={handleLogout}
          className="mb-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
          <LogOut className="h-5 w-5 text-red-500" />
          <span className="text-sm font-semibold text-red-500">로그아웃</span>
        </button>
      </div>

      {showEditProfile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-5 text-lg font-bold text-gray-900">프로필 수정</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">나이</label>
                <input
                  type="number"
                  value={editAge}
                  onChange={(event) => setEditAge(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
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
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
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
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  placeholder="예: 175"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">활동량</label>
                <select
                  value={editActivityLevel}
                  onChange={(event) => setEditActivityLevel(event.target.value as ActivityLevelValue)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  <option value="SEDENTARY">거의 활동 없음</option>
                  <option value="LIGHTLY_ACTIVE">가벼운 활동 (주 1-3회)</option>
                  <option value="MODERATELY_ACTIVE">보통 활동 (주 3-5회)</option>
                  <option value="VERY_ACTIVE">높은 활동 (주 6-7회)</option>
                  <option value="EXTRA_ACTIVE">매우 높은 활동 (하루 2회)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-2.5">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-5 text-lg font-bold text-gray-900">목표 설정 수정</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">목표 칼로리</label>
                <input
                  type="number"
                  value={editGoalCalories}
                  onChange={(event) => setEditGoalCalories(Number.parseInt(event.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  placeholder="예: 2000"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">탄수화물</label>
                  <span className="text-sm font-semibold text-blue-600">{editCarbsPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editCarbsPercentage}
                  onChange={(event) => setEditCarbsPercentage(Number.parseInt(event.target.value, 10))}
                  className="w-full text-blue-500"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">단백질</label>
                  <span className="text-sm font-semibold text-red-600">{editProteinPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editProteinPercentage}
                  onChange={(event) => setEditProteinPercentage(Number.parseInt(event.target.value, 10))}
                  className="w-full text-red-500"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">지방</label>
                  <span className="text-sm font-semibold text-yellow-600">{editFatPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editFatPercentage}
                  onChange={(event) => setEditFatPercentage(Number.parseInt(event.target.value, 10))}
                  className="w-full text-yellow-500"
                />
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <p className="mb-2 text-xs text-gray-500">예상 영양소</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">탄수화물</span>
                    <span className="font-semibold text-blue-600">{Math.round((editGoalCalories * (editCarbsPercentage / 100)) / 4)}g</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">단백질</span>
                    <span className="font-semibold text-red-600">{Math.round((editGoalCalories * (editProteinPercentage / 100)) / 4)}g</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">지방</span>
                    <span className="font-semibold text-yellow-600">{Math.round((editGoalCalories * (editFatPercentage / 100)) / 9)}g</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2.5">
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
    </div>
  );
}
