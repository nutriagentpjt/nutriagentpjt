import { Activity, ChevronLeft, ChevronRight, Droplet, HeartPulse, Shield } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Disease } from '@/types/onboarding';
import type { StoredProfile } from './shared';
import AllergiesSettings from './PersonalSettingsAllergies';
import DietSettings from './PersonalSettingsDiet';
import DiseasesSettings from './PersonalSettingsDiseases';
import LifestyleSettings from './PersonalSettingsLifestyle';

interface PersonalSettingsProps {
  profile: StoredProfile;
  onClose: () => void;
  onProfileUpdate: (updates: Partial<StoredProfile>) => void;
}

type SettingsView = 'menu' | 'lifestyle' | 'allergies' | 'diseases' | 'diet';

export default function PersonalSettings({ profile, onClose, onProfileUpdate }: PersonalSettingsProps) {
  const [currentView, setCurrentView] = useState<SettingsView>('menu');
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleBack = useCallback(() => {
    if (currentView === 'menu') {
      onClose();
    } else {
      setCurrentView('menu');
    }
  }, [currentView, onClose]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    backButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [handleBack]);

  const handleSave = (updates?: Partial<StoredProfile>) => {
    if (updates) {
      onProfileUpdate(updates);
    }
    setCurrentView('menu');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="personal-settings-title">
      <div className="relative flex h-full w-full flex-col bg-white sm:max-w-[390px] sm:shadow-2xl">
        <div className="flex-shrink-0 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-5 py-4">
            <button
              ref={backButtonRef}
              type="button"
              aria-label="뒤로가기"
              onClick={handleBack}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <h1 id="personal-settings-title" className="text-lg font-bold text-gray-900">
              {currentView === 'menu' && '개인 설정'}
              {currentView === 'lifestyle' && '생활 습관'}
              {currentView === 'allergies' && '알러지 정보'}
              {currentView === 'diseases' && '질환 정보'}
              {currentView === 'diet' && '추가 식단 설정'}
            </h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
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
              onSave={({ waterGoal, mealsPerDay }) => handleSave({ waterGoal, mealsPerDay })}
            />
          ) : null}
          {currentView === 'allergies' ? (
            <AllergiesSettings
              initialAllergies={profile.allergies ?? []}
              onSave={({ allergies }) => handleSave({ allergies })}
            />
          ) : null}
          {currentView === 'diseases' ? (
            <DiseasesSettings
              initialDiseases={(profile.diseases ?? []) as Disease[]}
              onSave={({ diseases }) => handleSave({ diseases })}
            />
          ) : null}
          {currentView === 'diet' ? (
            <DietSettings
              initialLowSodium={profile.lowSodium ?? false}
              initialLowSugar={profile.lowSugar ?? false}
              initialMaxCaloriesPerMeal={profile.maxCaloriesPerMeal ?? 600}
              onSave={({ lowSodium, lowSugar, maxCaloriesPerMeal }) =>
                handleSave({ lowSodium, lowSugar, maxCaloriesPerMeal })
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
