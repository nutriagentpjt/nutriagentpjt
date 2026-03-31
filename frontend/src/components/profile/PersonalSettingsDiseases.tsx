import { Activity, AlertCircle, Check, Droplet, Heart, HeartPulse, Shield, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import type { Disease } from '@/types/onboarding';
import { diseaseOptions } from './shared';

const diseaseIcons = {
  DIABETES: Activity,
  HYPERTENSION: Heart,
  HYPERLIPIDEMIA: Droplet,
  HEART_DISEASE: HeartPulse,
  LIVER_DISEASE: Shield,
  OBESITY: TrendingUp,
} as const;

interface DiseasesSettingsProps {
  initialDiseases: Disease[];
  onSave: (payload: { diseases: Disease[] }) => void;
}

export default function DiseasesSettings({ initialDiseases, onSave }: DiseasesSettingsProps) {
  const [diseases, setDiseases] = useState<Disease[]>(initialDiseases);

  return (
    <>
      <div className="px-5 py-6 pb-24">
        <div className="mb-8 flex items-start gap-2 rounded-xl bg-gray-100 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
          <p className="text-xs text-gray-700">현재 앓고 계신 질환이 있다면 선택해주세요</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2">
          {diseaseOptions.map((disease) => {
            const isSelected = diseases.includes(disease.value);
            const Icon = diseaseIcons[disease.value];
            return (
              <button
                key={disease.value}
                type="button"
                onClick={() =>
                  setDiseases((prev) =>
                    isSelected ? prev.filter((item) => item !== disease.value) : [...prev, disease.value],
                  )
                }
                className={`min-touch rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                aria-label={`${disease.label} ${isSelected ? '선택됨' : '선택'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${isSelected ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                      {disease.label}
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

        {diseases.length > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-1 text-xs font-medium text-amber-900">선택된 질환</p>
            <p className="text-sm text-amber-700">
              {diseaseOptions
                .filter((disease) => diseases.includes(disease.value))
                .map((disease) => disease.label)
                .join(', ')}
            </p>
          </div>
        ) : null}
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-5">
        <button
          onClick={() => onSave({ diseases })}
          className="btn-primary flex w-full min-touch items-center justify-center gap-2"
        >
          <Check className="h-5 w-5" />
          저장하기
        </button>
      </div>
    </>
  );
}
