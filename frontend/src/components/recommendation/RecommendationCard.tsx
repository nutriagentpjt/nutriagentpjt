import { Plus, Star } from 'lucide-react';
import type { Recommendation } from '@/types';
import FeedbackButtons from './FeedbackButtons';

export interface RecommendationCardItem extends Recommendation {
  imageUrl?: string;
  category?: string;
}

interface RecommendationCardProps {
  recommendation: RecommendationCardItem;
  className?: string;
  isFavorite?: boolean;
  preference?: 'liked' | 'disliked' | null;
  onToggleFavorite?: (recommendation: RecommendationCardItem) => void;
  onSave?: (recommendation: RecommendationCardItem) => void;
  onLike?: (recommendation: RecommendationCardItem) => void;
  onDislike?: (recommendation: RecommendationCardItem) => void;
}

export default function RecommendationCard({
  recommendation,
  className = '',
  isFavorite = false,
  preference = null,
  onToggleFavorite,
  onSave,
  onLike,
  onDislike,
}: RecommendationCardProps) {
  const getCardStyle = () => {
    if (preference === 'liked') {
      return 'border-2 border-green-400 bg-green-50/50';
    }

    if (preference === 'disliked') {
      return 'border-2 border-rose-300 bg-rose-50/80 shadow-[0_10px_24px_rgba(244,63,94,0.08)]';
    }

    return 'border-2 border-transparent bg-white';
  };

  return (
    <div
      className={`rounded-2xl p-5 shadow-sm transition-[background-color,border-color,box-shadow,opacity,transform] duration-500 ease-out ${getCardStyle()} ${className}`}
    >
      <div className="mb-3.5 flex items-start justify-between">
        <div className="mr-2 flex-1">
          <h3 className="text-lg font-bold text-gray-900">{recommendation.foodName}</h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <span>추천량 {recommendation.recommendedAmount}g</span>
            <span aria-hidden="true">·</span>
            <span>점수 {recommendation.score}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleFavorite?.(recommendation)}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center transition-transform active:scale-90"
          aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          <Star className={`h-5 w-5 transition-all ${isFavorite ? 'fill-green-500 text-green-500' : 'text-gray-300'}`} />
        </button>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        <div className="flex flex-col items-center justify-center rounded-lg border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-2 text-center">
          <p className="number-sm text-sm font-bold leading-tight text-green-600">
            <span className="block whitespace-nowrap">{recommendation.nutrients.calories}</span>
            <span className="mt-0.5 block text-[9px] leading-none">kcal</span>
          </p>
        </div>
        <div className="flex flex-col rounded-lg border border-accent-100 bg-gradient-to-br from-accent-50 to-blue-50 p-2 text-center">
          <p className="mb-0.5 text-[10px] text-gray-500">단백질</p>
          <p className="number-sm mt-auto text-sm font-bold leading-tight text-accent-600">{recommendation.nutrients.protein} g</p>
        </div>
        <div className="flex flex-col rounded-lg border border-secondary-100 bg-gradient-to-br from-secondary-50 to-orange-50 p-2 text-center">
          <p className="mb-0.5 text-[10px] text-gray-500">탄수화물</p>
          <p className="number-sm mt-auto text-sm font-bold leading-tight text-secondary-600">{recommendation.nutrients.carbs} g</p>
        </div>
        <div className="flex flex-col rounded-lg border border-yellow-100 bg-gradient-to-br from-yellow-50 to-amber-50 p-2 text-center">
          <p className="mb-0.5 text-[10px] text-gray-500">지방</p>
          <p className="number-sm mt-auto text-sm font-bold leading-tight text-yellow-600">{recommendation.nutrients.fat} g</p>
        </div>
      </div>

      {recommendation.reasons.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {recommendation.reasons.map((reason) => (
            <span
              key={`${recommendation.foodId}-${reason}`}
              className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700"
            >
              {reason}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        <FeedbackButtons
          preference={preference}
          onLike={() => onLike?.(recommendation)}
          onDislike={() => onDislike?.(recommendation)}
        />

        <button
          type="button"
          onClick={() => onSave?.(recommendation)}
          className="min-touch flex w-16 items-center justify-center rounded-xl bg-green-500 py-3.5 text-white shadow-md transition-all hover:bg-green-600 active:scale-[0.97]"
          aria-label="식단에 저장"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
