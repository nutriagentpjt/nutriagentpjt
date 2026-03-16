import { MoreHorizontal, PencilLine, Trash2, Utensils } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MealType } from '@/types';

export interface MealCardItem {
  id: number;
  name: string;
  amount: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  date: string;
  time: string;
  mealType: MealType;
  source: 'api' | 'local';
}

interface MealCardProps {
  meal: MealCardItem;
  onDelete: (meal: MealCardItem) => void;
  onEdit: (meal: MealCardItem) => void;
}

export function MealCard({ meal, onDelete, onEdit }: MealCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-50">
          <Utensils className="h-4.5 w-4.5 text-green-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="truncate text-sm font-medium text-gray-900">{meal.name}</p>
              <p className="mt-1 text-xs text-gray-500">{meal.time} · {meal.amount}g</p>
            </div>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((current) => !current)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                aria-label="식단 메뉴 열기"
              >
                <MoreHorizontal className="h-4.5 w-4.5" />
              </button>
              {isMenuOpen ? (
                <div className="absolute right-0 top-9 z-10 min-w-[120px] rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(meal);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <PencilLine className="h-4 w-4" />
                    <span>수정</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDelete(meal);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>삭제</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <p className="mt-3 text-[11px] text-gray-500">
            {meal.calories}kcal · 단백질 {meal.protein}g · 탄수화물 {meal.carbs}g · 지방 {meal.fat}g
          </p>
        </div>
      </div>
    </div>
  );
}
