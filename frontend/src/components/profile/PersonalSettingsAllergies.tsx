import { AlertCircle, Check } from 'lucide-react';
import { useState } from 'react';
import { allergyOptions } from './shared';

interface AllergiesSettingsProps {
  initialAllergies: string[];
  onSave: (payload: { allergies: string[] }) => void;
}

export default function AllergiesSettings({ initialAllergies, onSave }: AllergiesSettingsProps) {
  const [allergies, setAllergies] = useState<string[]>(initialAllergies);

  return (
    <>
      <div className="px-5 py-6 pb-24">
        <div className="mb-8 flex items-start gap-2 rounded-xl bg-gray-100 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
          <p className="text-xs text-gray-700">식품 알러지가 있는 항목을 선택해주세요</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2">
          {allergyOptions.map((allergy) => {
            const isSelected = allergies.includes(allergy.value);
            return (
              <button
                key={allergy.value}
                type="button"
                onClick={() =>
                  setAllergies((prev) =>
                    isSelected ? prev.filter((item) => item !== allergy.value) : [...prev, allergy.value],
                  )
                }
                className={`min-touch rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                aria-label={`${allergy.label} ${isSelected ? '선택됨' : '선택'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{allergy.emoji}</span>
                    <span className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                      {allergy.label}
                    </span>
                  </div>
                  {isSelected ? (
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {allergies.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-1 text-xs font-medium text-amber-900">선택된 알러지</p>
            <p className="text-sm text-amber-700">{allergies.join(', ')}</p>
          </div>
        ) : null}
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-5">
        <button
          onClick={() => onSave({ allergies })}
          className="btn-primary flex w-full min-touch items-center justify-center gap-2"
        >
          <Check className="h-5 w-5" />
          저장하기
        </button>
      </div>
    </>
  );
}
