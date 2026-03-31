import { Activity, ChevronLeft, ChevronRight, Droplet, HeartPulse, Shield } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Disease } from '@/types/onboarding';
import AllergiesSettings from '@/components/profile/PersonalSettingsAllergies';
import DietSettings from '@/components/profile/PersonalSettingsDiet';
import DiseasesSettings from '@/components/profile/PersonalSettingsDiseases';
import LifestyleSettings from '@/components/profile/PersonalSettingsLifestyle';
import { loadStoredProfile, saveStoredProfile, type StoredProfile } from '@/components/profile/shared';
import { ROUTES } from '@/constants/routes';

type SettingsView = 'menu' | 'lifestyle' | 'allergies' | 'diseases' | 'diet';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StoredProfile>(() => loadStoredProfile());
  const [currentView, setCurrentView] = useState<SettingsView>('menu');

  const handleProfileUpdate = (updates: Partial<StoredProfile>) => {
    const nextProfile = { ...profile, ...updates };
    setProfile(nextProfile);
    saveStoredProfile(nextProfile);
  };

  const handleBack = () => {
    if (currentView === 'menu') {
      navigate(ROUTES.MYPAGE);
    } else {
      setCurrentView('menu');
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex w-full max-w-[390px] items-center justify-between px-5 py-4">
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            {currentView === 'menu' && '개인 설정'}
            {currentView === 'lifestyle' && '생활 습관'}
            {currentView === 'allergies' && '알러지 정보'}
            {currentView === 'diseases' && '질환 정보'}
            {currentView === 'diet' && '추가 식단 설정'}
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[390px]">
        {currentView === 'menu' ? (
          <div className="px-5 py-4">
            <div className="space-y-2">
              <button
                onClick={() => setCurrentView('lifestyle')}
                className="w-full rounded-2xl border-2 border-gray-200 bg-white p-6 transition-all hover:border-green-400 hover:bg-green-50 active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
                      <Droplet className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <h3 className="mb-1 text-base font-bold text-gray-900">생활 습관</h3>
                      <p className="text-xs text-gray-500">수분 목표 · 끼니 횟수</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
                </div>
              </button>

              <button
                onClick={() => setCurrentView('allergies')}
                className="w-full rounded-2xl border-2 border-gray-200 bg-white p-6 transition-all hover:border-green-400 hover:bg-green-50 active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50">
                      <Activity className="h-6 w-6 text-amber-500" />
                    </div>
                    <div className="text-left">
                      <h3 className="mb-1 text-base font-bold text-gray-900">알러지 정보</h3>
                      <p className="text-xs text-gray-500">식품 알러지 설정</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
                </div>
              </button>

              <button
                onClick={() => setCurrentView('diseases')}
                className="w-full rounded-2xl border-2 border-gray-200 bg-white p-6 transition-all hover:border-green-400 hover:bg-green-50 active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-50 to-pink-50">
                      <HeartPulse className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="text-left">
                      <h3 className="mb-1 text-base font-bold text-gray-900">질환 정보</h3>
                      <p className="text-xs text-gray-500">건강 상태 설정</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
                </div>
              </button>

              <button
                onClick={() => setCurrentView('diet')}
                className="w-full rounded-2xl border-2 border-gray-200 bg-white p-6 transition-all hover:border-green-400 hover:bg-green-50 active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                      <Shield className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="text-left">
                      <h3 className="mb-1 text-base font-bold text-gray-900">추가 식단 설정</h3>
                      <p className="text-xs text-gray-500">저염 · 저당 · 칼로리 제한</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
                </div>
              </button>
            </div>
          </div>
        ) : null}

        {currentView === 'lifestyle' ? (
          <LifestyleSettings
            initialWaterGoal={profile.waterGoal ?? 2}
            initialMealsPerDay={profile.mealsPerDay ?? 3}
            onSave={({ waterGoal, mealsPerDay }) => {
              handleProfileUpdate({ waterGoal, mealsPerDay });
              setCurrentView('menu');
            }}
          />
        ) : null}

        {currentView === 'allergies' ? (
          <AllergiesSettings
            initialAllergies={profile.allergies ?? []}
            onSave={({ allergies }) => {
              handleProfileUpdate({ allergies });
              setCurrentView('menu');
            }}
          />
        ) : null}

        {currentView === 'diseases' ? (
          <DiseasesSettings
            initialDiseases={(profile.diseases ?? []) as Disease[]}
            onSave={({ diseases }) => {
              handleProfileUpdate({ diseases });
              setCurrentView('menu');
            }}
          />
        ) : null}

        {currentView === 'diet' ? (
          <DietSettings
            initialLowSodium={profile.lowSodium ?? false}
            initialLowSugar={profile.lowSugar ?? false}
            initialMaxCaloriesPerMeal={profile.maxCaloriesPerMeal ?? 600}
            onSave={({ lowSodium, lowSugar, maxCaloriesPerMeal }) => {
              handleProfileUpdate({ lowSodium, lowSugar, maxCaloriesPerMeal });
              setCurrentView('menu');
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
