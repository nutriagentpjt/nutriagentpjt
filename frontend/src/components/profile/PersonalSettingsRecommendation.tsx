import { AlertCircle, Heart, Sparkles, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

type RecommendationTab = 'preferred' | 'disliked';

interface DislikedFoodItem {
  foodName: string;
  reason: string;
}

interface RecommendationSettingsProps {
  preferredFoods: string[];
  dislikedFoods: DislikedFoodItem[];
  isRemoving?: boolean;
  onRemovePreferred: (foodName: string) => Promise<void> | void;
  onRemoveDisliked: (foodName: string) => Promise<void> | void;
}

const reasonIconMap = {
  DISLIKE: <X className="h-3.5 w-3.5 text-rose-600" />,
  ALLERGY: <AlertCircle className="h-3.5 w-3.5 text-amber-600" />,
};

export default function PersonalSettingsRecommendation({
  preferredFoods,
  dislikedFoods,
  isRemoving = false,
  onRemovePreferred,
  onRemoveDisliked,
}: RecommendationSettingsProps) {
  const [activeTab, setActiveTab] = useState<RecommendationTab>('preferred');

  const items = useMemo(() => {
    return activeTab === 'preferred' ? preferredFoods : dislikedFoods;
  }, [activeTab, dislikedFoods, preferredFoods]);

  return (
    <div className="px-5 py-6">
      <div className="mb-6 flex items-start gap-2 rounded-xl bg-gray-100 p-3">
        <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
        <p className="text-xs text-gray-700">
          AI 추천 식단에서 등록한 선호/비선호 음식을 확인하고 해제할 수 있어요
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('preferred')}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'preferred'
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            선호 음식
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('disliked')}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'disliked'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            비선호 음식
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {activeTab === 'preferred'
          ? preferredFoods.map((foodName) => (
              <div
                key={foodName}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-gray-200 bg-white px-4 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-50">
                      <Heart className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="truncate text-sm font-semibold text-gray-900">{foodName}</p>
                  </div>
                  <p className="text-xs text-gray-500">AI 추천에 긍정적으로 반영되는 음식이에요</p>
                </div>
                <button
                  type="button"
                  onClick={() => void onRemovePreferred(foodName)}
                  disabled={isRemoving}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition-colors hover:bg-rose-100 disabled:opacity-50"
                  aria-label={`${foodName} 선호 음식 해제`}
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            ))
          : dislikedFoods.map((item) => (
              <div
                key={`${item.foodName}-${item.reason}`}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-gray-200 bg-white px-4 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50">
                      {reasonIconMap[item.reason] ?? <X className="h-3.5 w-3.5 text-rose-600" />}
                    </div>
                    <p className="truncate text-sm font-semibold text-gray-900">{item.foodName}</p>
                  </div>
                  <p className="text-xs text-gray-500">AI 추천에서 제외되도록 등록된 음식이에요</p>
                </div>
                <button
                  type="button"
                  onClick={() => void onRemoveDisliked(item.foodName)}
                  disabled={isRemoving}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition-colors hover:bg-rose-100 disabled:opacity-50"
                  aria-label={`${item.foodName} 비선호 음식 해제`}
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            ))}

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center">
            <p className="text-sm font-semibold text-gray-700">
              {activeTab === 'preferred' ? '등록된 선호 음식이 없어요' : '등록된 비선호 음식이 없어요'}
            </p>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              {activeTab === 'preferred'
                ? 'AI 추천 식단에서 좋아요를 누른 음식이 여기에 표시됩니다.'
                : 'AI 추천 식단에서 싫어요를 누른 음식이 여기에 표시됩니다.'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
