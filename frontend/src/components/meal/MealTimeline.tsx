import type { MealType } from '@/types';
import { MealCard, type MealCardItem } from './MealCard';

interface MealTimelineProps {
  meals: MealCardItem[];
  onDelete: (meal: MealCardItem) => void;
  onEdit: (meal: MealCardItem) => void;
}

const mealTypeLabels: Record<MealType, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
};

const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function MealTimeline({ meals, onDelete, onEdit }: MealTimelineProps) {
  return (
    <div className="space-y-4">
      {mealTypeOrder.map((mealType) => {
        const groupedMeals = meals
          .filter((meal) => meal.mealType === mealType)
          .sort((left, right) => left.time.localeCompare(right.time));

        return (
          <section key={mealType} className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-xs font-semibold text-gray-700">{mealTypeLabels[mealType]}</h2>
              <span className="text-[11px] text-gray-400">{groupedMeals.length}개</span>
            </div>
            {groupedMeals.length > 0 ? (
              <div className="space-y-2">
                {groupedMeals.map((meal) => (
                  <MealCard key={`${meal.source}-${meal.id}`} meal={meal} onDelete={onDelete} onEdit={onEdit} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-4 text-center text-xs text-gray-400">
                등록된 식단이 없습니다.
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
