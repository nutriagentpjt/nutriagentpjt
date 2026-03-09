import { Calendar, CheckCircle, ChevronLeft, ChevronRight, Coffee, Moon, Sun, Utensils, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { showToast } from '@/components/common';
import type { Food, MealType } from '@/types';
import { appendStoredMeal } from '@/utils';

interface AddFoodModalProps {
  food: Food | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  initialDate?: Date;
}

function getInitialMealType(): MealType {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 20) return 'dinner';
  return 'snack';
}

export function AddFoodModal({ food, isOpen, onClose, onSaved, initialDate }: AddFoodModalProps) {
  const navigate = useNavigate();
  const [foodAmount, setFoodAmount] = useState('100');
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [foodSelectedDate, setFoodSelectedDate] = useState<Date>(initialDate ?? new Date());

  const baseAmount = Number(food?.servingSize ?? food?.weight ?? 100) || 100;
  const parsedAmount = parseFloat(foodAmount || '0');
  const amountRatio = parsedAmount > 0 ? parsedAmount / baseAmount : 0;

  useEffect(() => {
    if (isOpen) {
      setFoodAmount(String(baseAmount));
      setMealType(getInitialMealType());
      setFoodSelectedDate(initialDate ?? new Date());
    }
  }, [baseAmount, initialDate, isOpen]);

  const previewNutrition = useMemo(() => {
    if (!food) {
      return { calories: 0, carbs: 0, protein: 0, fat: 0 };
    }

    return {
      calories: Math.round(food.calories * amountRatio),
      carbs: Math.round(food.carbs * amountRatio * 10) / 10,
      protein: Math.round(food.protein * amountRatio * 10) / 10,
      fat: Math.round(food.fat * amountRatio * 10) / 10,
    };
  }, [amountRatio, food]);

  if (!isOpen || !food) {
    return null;
  }

  const handleSaveFood = () => {
    if (!foodAmount || parseFloat(foodAmount) <= 0) {
      return;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const mealName = food.brand ? `${food.name} | ${food.brand}` : food.name;
    const dateKey = foodSelectedDate.toISOString().split('T')[0] ?? '';

    appendStoredMeal(dateKey, {
      id: Date.now(),
      name: mealName,
      calories: previewNutrition.calories,
      time: currentTime,
      protein: previewNutrition.protein,
      carbs: previewNutrition.carbs,
      fat: previewNutrition.fat,
      mealType,
    });

    showToast.success('식단이 저장되었습니다');
    onSaved?.();
    onClose();
    navigate(ROUTES.HOME);
  };

  const isToday = foodSelectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-5">
      <div className="bg-white rounded-2xl p-6 w-full max-w-[400px] shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1">식단 추가</h3>
            <p className="text-sm text-gray-600 truncate">
              {food.name}
              {food.brand ? ` | ${food.brand}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="icon-button ml-2 flex-shrink-0" aria-label="닫기" type="button">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-5">
          <label className="input-label">섭취량</label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              step="1"
              min="1"
              value={foodAmount}
              onChange={(event) => setFoodAmount(event.target.value)}
              placeholder="100"
              className="input-primary pr-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="섭취량 입력"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <span className="text-sm text-gray-500 font-medium">g</span>
            </div>
          </div>
          <p className="input-help">{baseAmount}g 기준으로 영양소가 계산됩니다</p>
        </div>

        <div className="mb-5 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">예상 영양소</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">칼로리</p>
              <p className="number-md text-green-600">{previewNutrition.calories}</p>
              <p className="text-xs text-gray-400">kcal</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">탄수화물</p>
              <p className="number-md text-secondary-600">{previewNutrition.carbs}</p>
              <p className="text-xs text-gray-400">g</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">단백질</p>
              <p className="number-md text-accent-600">{previewNutrition.protein}</p>
              <p className="text-xs text-gray-400">g</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">지방</p>
              <p className="number-md text-yellow-600">{previewNutrition.fat}</p>
              <p className="text-xs text-gray-400">g</p>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <label className="input-label mb-3">식사 시간대</label>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setMealType('breakfast')}
              className={`min-touch flex flex-col items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                mealType === 'breakfast'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
              aria-label="아침 선택"
              aria-pressed={mealType === 'breakfast'}
              type="button"
            >
              <Coffee className="w-5 h-5" />
              <span className="text-xs font-semibold">아침</span>
            </button>
            <button
              onClick={() => setMealType('lunch')}
              className={`min-touch flex flex-col items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                mealType === 'lunch'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
              aria-label="점심 선택"
              aria-pressed={mealType === 'lunch'}
              type="button"
            >
              <Sun className="w-5 h-5" />
              <span className="text-xs font-semibold">점심</span>
            </button>
            <button
              onClick={() => setMealType('dinner')}
              className={`min-touch flex flex-col items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                mealType === 'dinner'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
              aria-label="저녁 선택"
              aria-pressed={mealType === 'dinner'}
              type="button"
            >
              <Moon className="w-5 h-5" />
              <span className="text-xs font-semibold">저녁</span>
            </button>
            <button
              onClick={() => setMealType('snack')}
              className={`min-touch flex flex-col items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                mealType === 'snack'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
              aria-label="간식 선택"
              aria-pressed={mealType === 'snack'}
              type="button"
            >
              <Utensils className="w-5 h-5" />
              <span className="text-xs font-semibold">간식</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="input-label mb-3">날짜</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nextDate = new Date(foodSelectedDate);
                nextDate.setDate(nextDate.getDate() - 1);
                setFoodSelectedDate(nextDate);
              }}
              className="icon-button flex-shrink-0"
              aria-label="이전 날짜"
              type="button"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-touch flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 rounded-xl border border-gray-200">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-900">
                {foodSelectedDate.toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
                {isToday && <span className="text-xs text-gray-400 font-normal ml-1">(오늘)</span>}
              </span>
            </div>
            <button
              onClick={() => {
                const nextDate = new Date(foodSelectedDate);
                nextDate.setDate(nextDate.getDate() + 1);
                setFoodSelectedDate(nextDate);
              }}
              className="icon-button flex-shrink-0"
              aria-label="다음 날짜"
              type="button"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button onClick={() => setFoodSelectedDate(new Date())} className="mt-2 text-xs text-green-600 hover:text-green-700 font-medium" type="button">
            오늘로 이동
          </button>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-ghost flex-1" type="button">
            취소
          </button>
          <button
            onClick={handleSaveFood}
            className="btn btn-primary flex-1"
            disabled={!foodAmount || parseFloat(foodAmount) <= 0}
            type="button"
          >
            <CheckCircle className="w-5 h-5" />
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
