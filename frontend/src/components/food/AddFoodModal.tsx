import { Calendar, CheckCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { showToast } from '@/components/common';
import { MealTypeSelector, NutritionPreview } from '@/components/meal';
import { ROUTES } from '@/constants/routes';
import { useAddMeal } from '@/hooks';
import { useMealStore } from '@/store';
import type { Food, MealType } from '@/types';
import { appendStoredMeal, calculateNutrients } from '@/utils';

interface AddFoodModalProps {
  food: Food | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  initialDate?: Date;
  redirectTo?: string;
}

const mealSaveSchema = z.object({
  amount: z.coerce.number().min(1, '섭취량은 1g 이상이어야 합니다.').max(10000, '섭취량은 10,000g 이하여야 합니다.'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  date: z.string().min(1, '날짜를 선택해주세요.'),
});

type MealSaveFormValues = z.infer<typeof mealSaveSchema>;

function getInitialMealType(): MealType {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 20) return 'dinner';
  return 'snack';
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function parseDateString(date: string) {
  return new Date(`${date}T00:00:00`);
}

export function AddFoodModal({ food, isOpen, onClose, onSaved, initialDate, redirectTo = ROUTES.HOME }: AddFoodModalProps) {
  const navigate = useNavigate();
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const setAmount = useMealStore((state) => state.setAmount);
  const setSelectedDate = useMealStore((state) => state.setSelectedDate);
  const setSelectedMealType = useMealStore((state) => state.setSelectedMealType);
  const clearSelection = useMealStore((state) => state.clearSelection);
  const addMealMutation = useAddMeal();

  const baseAmount = Number(food?.servingSize ?? food?.weight ?? 100) || 100;
  const fallbackDate = initialDate ?? new Date();

  const {
    formState: { errors },
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<MealSaveFormValues>({
    defaultValues: {
      amount: baseAmount,
      mealType: getInitialMealType(),
      date: fallbackDate.toISOString().split('T')[0] ?? '',
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const nextDate = initialDate ?? new Date();
    reset({
      amount: baseAmount,
      mealType: getInitialMealType(),
      date: nextDate.toISOString().split('T')[0] ?? '',
    });
  }, [baseAmount, initialDate, isOpen, reset]);

  const amount = watch('amount');
  const mealType = watch('mealType');
  const selectedDate = watch('date');
  const selectedDateObject = selectedDate ? parseDateString(selectedDate) : fallbackDate;

  const previewNutrition = useMemo(() => {
    if (!food) {
      return { calories: 0, carbs: 0, protein: 0, fat: 0 };
    }

    return calculateNutrients(
      {
        calories: food.calories,
        carbs: food.carbs,
        protein: food.protein,
        fat: food.fat,
      },
      typeof amount === 'number' ? amount : Number(amount) || 0,
      baseAmount,
    );
  }, [amount, baseAmount, food]);

  if (!isOpen || !food) {
    return null;
  }

  const submitMeal = async (values: MealSaveFormValues) => {
    const parsed = mealSaveSchema.safeParse(values);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;

      if (fieldErrors.amount?.[0]) {
        setError('amount', { message: fieldErrors.amount[0] });
      }
      if (fieldErrors.date?.[0]) {
        setError('date', { message: fieldErrors.date[0] });
      }
      if (fieldErrors.mealType?.[0]) {
        setError('mealType', { message: fieldErrors.mealType[0] });
      }
      return;
    }

    const nextDateKey = parsed.data.date;
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const mealName = food.brand ? `${food.name} | ${food.brand}` : food.name;

    setAmount(parsed.data.amount);
    setSelectedDate(nextDateKey);
    setSelectedMealType(parsed.data.mealType);

    try {
      await addMealMutation.mutateAsync({
        foodName: food.name,
        mealType: parsed.data.mealType,
        amount: parsed.data.amount,
        date: nextDateKey,
      });
    } catch (error) {
      console.error('Failed to save meal to API:', error);
    }

    appendStoredMeal(nextDateKey, {
      id: Date.now(),
      name: mealName,
      calories: previewNutrition.calories,
      time: currentTime,
      protein: previewNutrition.protein,
      carbs: previewNutrition.carbs,
      fat: previewNutrition.fat,
      mealType: parsed.data.mealType,
    });

    clearSelection();
    showToast.success('식단이 저장되었습니다');
    onSaved?.();
    onClose();
    navigate(redirectTo, { replace: true });
  };

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) {
      return;
    }

    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.click();
  };

  const isToday = selectedDateObject.toDateString() === new Date().toDateString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
      <div className="max-h-[90vh] w-full max-w-[400px] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-lg font-bold text-gray-900">식단 추가</h3>
            <p className="truncate text-sm text-gray-600">
              {food.name}
              {food.brand ? ` | ${food.brand}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="icon-button ml-2 flex-shrink-0" aria-label="닫기" type="button">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(submitMeal)}>
          <div className="mb-5">
            <label className="input-label">섭취량</label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                value={amount ?? ''}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setValue('amount', nextValue === '' ? 0 : Number(nextValue), {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                placeholder="100"
                className="input-primary pr-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-label="섭취량 입력"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <span className="text-sm font-medium text-gray-500">g</span>
              </div>
            </div>
            <p className="input-help">{baseAmount}g 기준으로 영양소가 계산됩니다</p>
            {errors.amount ? <p className="mt-2 text-xs text-red-500">{errors.amount.message}</p> : null}
          </div>

          <NutritionPreview nutrients={previewNutrition} />

          <div className="mb-5">
            <label className="input-label mb-3">식사 시간대</label>
            <MealTypeSelector
              value={mealType}
              onChange={(nextMealType) => setValue('mealType', nextMealType, { shouldValidate: true, shouldDirty: true })}
            />
            {errors.mealType ? <p className="mt-2 text-xs text-red-500">{errors.mealType.message}</p> : null}
          </div>

          <div className="mb-6">
            <label className="input-label mb-3">날짜</label>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(event) => setValue('date', event.target.value, { shouldValidate: true, shouldDirty: true })}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextDate = new Date(selectedDateObject);
                  nextDate.setDate(nextDate.getDate() - 1);
                  setValue('date', nextDate.toISOString().split('T')[0] ?? '', { shouldValidate: true, shouldDirty: true });
                }}
                className="icon-button flex-shrink-0"
                aria-label="이전 날짜"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={openDatePicker}
                className="flex min-touch flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-900">
                  {formatDateLabel(selectedDateObject)}
                  {isToday ? <span className="ml-1 text-xs font-normal text-gray-400">(오늘)</span> : null}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextDate = new Date(selectedDateObject);
                  nextDate.setDate(nextDate.getDate() + 1);
                  setValue('date', nextDate.toISOString().split('T')[0] ?? '', { shouldValidate: true, shouldDirty: true });
                }}
                className="icon-button flex-shrink-0"
                aria-label="다음 날짜"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setValue('date', new Date().toISOString().split('T')[0] ?? '', { shouldValidate: true, shouldDirty: true })}
              className="mt-2 text-xs font-medium text-green-600 hover:text-green-700"
            >
              오늘로 이동
            </button>
            {errors.date ? <p className="mt-2 text-xs text-red-500">{errors.date.message}</p> : null}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-ghost flex-1" type="button">
              취소
            </button>
            <button className="btn btn-primary flex-1" disabled={addMealMutation.isPending} type="submit">
              <CheckCircle className="h-5 w-5" />
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
