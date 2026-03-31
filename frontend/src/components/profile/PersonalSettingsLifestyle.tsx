import { AlertCircle, Check } from 'lucide-react';
import { useState } from 'react';

interface LifestyleSettingsProps {
  initialWaterGoal: number;
  initialMealsPerDay: number;
  onSave: (payload: { waterGoal: number; mealsPerDay: number }) => void;
}

export default function LifestyleSettings({
  initialWaterGoal,
  initialMealsPerDay,
  onSave,
}: LifestyleSettingsProps) {
  const [waterGoal, setWaterGoal] = useState(initialWaterGoal);
  const [mealsPerDay, setMealsPerDay] = useState(initialMealsPerDay);

  return (
    <>
      <div className="px-5 py-6 pb-24">
        <div className="mb-8 flex items-start gap-2 rounded-xl bg-gray-100 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
          <p className="text-xs text-gray-700">일일 수분 섭취 목표와 식사 횟수를 설정합니다</p>
        </div>

        <div className="mb-8">
          <label className="input-label">일일 수분 목표</label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={waterGoal}
              onChange={(event) => setWaterGoal(parseFloat(event.target.value) || 2)}
              className="input-primary pr-12"
              aria-label="일일 수분 목표 입력"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <span className="text-sm font-medium text-gray-500">L</span>
            </div>
          </div>
          <p className="input-help">일반적으로 성인 기준 1.5~2L를 권장</p>
        </div>

        <div className="mb-6">
          <label className="input-label">일일 끼니 횟수</label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((meals) => (
              <button
                key={meals}
                onClick={() => setMealsPerDay(meals)}
                className={`min-touch rounded-xl border-2 px-2 py-4 text-sm transition-all ${
                  mealsPerDay === meals
                    ? 'border-green-500 bg-green-50 font-semibold text-green-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
                aria-label={`${meals}회 선택`}
              >
                {meals === 4 ? '4회 이상' : `${meals}회`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-5">
        <button
          onClick={() => onSave({ waterGoal, mealsPerDay })}
          className="btn-primary flex w-full min-touch items-center justify-center gap-2"
        >
          <Check className="h-5 w-5" />
          저장하기
        </button>
      </div>
    </>
  );
}
