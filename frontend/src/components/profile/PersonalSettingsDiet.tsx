import { AlertCircle, Check } from 'lucide-react';
import { useState } from 'react';

interface DietSettingsProps {
  initialLowSodium: boolean;
  initialLowSugar: boolean;
  initialMaxCaloriesPerMeal: number;
  onSave: (payload: { lowSodium: boolean; lowSugar: boolean; maxCaloriesPerMeal: number }) => void;
}

export default function DietSettings({
  initialLowSodium,
  initialLowSugar,
  initialMaxCaloriesPerMeal,
  onSave,
}: DietSettingsProps) {
  const [lowSodium, setLowSodium] = useState(initialLowSodium);
  const [lowSugar, setLowSugar] = useState(initialLowSugar);
  const [maxCaloriesPerMeal, setMaxCaloriesPerMeal] = useState(initialMaxCaloriesPerMeal);

  return (
    <>
      <div className="px-5 py-6 pb-36">
        <div className="mb-8 flex items-start gap-2 rounded-xl bg-gray-100 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
          <p className="text-xs text-gray-700">더 건강한 식단을 위한 세부 설정입니다</p>
        </div>

        <div className="mb-8">
          <label className="input-label mb-4">추가 식단 설정</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLowSodium((prev) => !prev)}
              className={`min-touch rounded-xl border-2 px-4 py-4 transition-all ${lowSodium ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
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

        <div className="mb-6">
          <label className="input-label">식사 당 목표 최대 칼로리</label>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              value={maxCaloriesPerMeal}
              onChange={(event) => setMaxCaloriesPerMeal(Number.parseInt(event.target.value, 10) || 500)}
              className="input-primary pr-16"
              aria-label="식사 당 목표 최대 칼로리 입력"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <span className="text-sm font-medium text-gray-500">kcal</span>
            </div>
          </div>
          <p className="input-help">한 끼 식사의 최대 칼로리 목표를 설정합니다</p>
        </div>
      </div>

      <div className="absolute bottom-14 left-0 right-0 border-t border-gray-200 bg-white p-5">
        <button
          onClick={() => onSave({ lowSodium, lowSugar, maxCaloriesPerMeal })}
          className="btn-primary flex w-full min-touch items-center justify-center gap-2"
        >
          <Check className="h-5 w-5" />
          저장하기
        </button>
      </div>
    </>
  );
}
