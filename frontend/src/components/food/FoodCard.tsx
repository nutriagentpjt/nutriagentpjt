import { Plus, Star } from 'lucide-react';
import type { Food } from '@/types';

interface FoodCardProps {
  food: Food;
  isFavorite?: boolean;
  onAdd: (food: Food) => void;
  onToggleFavorite?: (id: number | string) => void;
}

export function FoodCard({ food, isFavorite = false, onAdd, onToggleFavorite }: FoodCardProps) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-sm text-gray-900">
          <span className="font-medium">{food.name}</span>
          {food.brand ? (
            <>
              <span className="mx-1.5 text-gray-400">|</span>
              <span className="text-gray-600">{food.brand}</span>
            </>
          ) : null}
        </p>
        <p className="text-[11px] text-gray-500">
          {food.calories}kcal · 단백질 {food.protein}g · 탄수화물 {food.carbs}g · 지방 {food.fat}g
        </p>
      </div>
      <button
        onClick={() => onToggleFavorite?.(food.id)}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center transition-transform active:scale-90"
        aria-label={isFavorite ? '관심 브랜드 해제' : '관심 브랜드 추가'}
        type="button"
      >
        <Star className={`h-5 w-5 transition-all ${isFavorite ? 'fill-green-500 text-green-500' : 'text-gray-300'}`} />
      </button>
      <button
        onClick={() => onAdd(food)}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400 transition-colors active:bg-gray-50"
        type="button"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
