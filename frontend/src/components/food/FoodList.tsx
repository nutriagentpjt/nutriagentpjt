import type { Food } from '@/types';
import { Spinner } from '@/components/common';
import { FoodCard } from './FoodCard';

interface FoodListProps {
  foods: Food[];
  isDebouncing?: boolean;
  isFavorite?: (id: number | string) => boolean;
  isLoading?: boolean;
  onAdd: (food: Food) => void;
  onToggleFavorite?: (id: number | string) => void;
  query: string;
}

export function FoodList({
  foods,
  isDebouncing = false,
  isFavorite,
  isLoading = false,
  onAdd,
  onToggleFavorite,
  query,
}: FoodListProps) {
  const shouldShowPanel = query.trim().length > 0;

  if (!shouldShowPanel) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100/50 bg-white shadow-md">
      <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-3.5 py-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">검색 결과 {foods.length}개</p>
          <p className="text-xs text-gray-500">관심 브랜드 {foods.filter((food) => isFavorite?.(food.id)).length}개</p>
        </div>
      </div>

      {isLoading || isDebouncing ? (
        <div className="flex items-center justify-center gap-2 px-3.5 py-8 text-sm text-gray-500">
          <Spinner size="sm" />
          <span>검색 중...</span>
        </div>
      ) : foods.length > 0 ? (
        <div>
          {foods.map((food, index) => (
            <div key={food.id} className={index !== foods.length - 1 ? 'border-b border-gray-100' : ''}>
              <FoodCard
                food={food}
                isFavorite={isFavorite?.(food.id)}
                onAdd={onAdd}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="px-3.5 py-8 text-center">
          <p className="text-xs text-gray-500">검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
}
