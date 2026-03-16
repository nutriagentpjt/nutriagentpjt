import { Calendar, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { showToast } from '@/components/common';
import { MealTypeSelector, MealTimeline, NutritionPreview, NutritionSummaryCard, type MealCardItem } from '@/components/meal';
import { useDeleteMeal, useMeals, useUpdateMeal } from '@/hooks';
import { deleteStoredMeal, getStoredMeals, updateStoredMeal } from '@/utils';
import type { Meal, MealListSummary, MealType } from '@/types';

interface EditMealState extends MealCardItem {
  originalDate: string;
  baseCalories: number;
  baseCarbs: number;
  baseProtein: number;
  baseFat: number;
}

function toDateKey(date: Date) {
  return date.toISOString().split('T')[0] ?? '';
}

function toDateLabel(date: Date) {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function toCompactDateLabel(date: Date) {
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function parseDateString(date: string) {
  return new Date(`${date}T00:00:00`);
}

function isToday(date: Date) {
  return toDateKey(date) === toDateKey(new Date());
}

function inferMealTypeByTime(time: string): MealType {
  const hour = Number(time.split(':')[0] ?? '0');
  if (hour >= 6 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 20) return 'dinner';
  return 'snack';
}

function toBaseNutrient(value: number, amount: number) {
  if (!amount) return value;
  return (value / amount) * 100;
}

function mapApiMeal(meal: Meal): MealCardItem {
  const createdAt = meal.createdAt ? new Date(meal.createdAt) : null;
  const time = createdAt && !Number.isNaN(createdAt.getTime())
    ? `${createdAt.getHours().toString().padStart(2, '0')}:${createdAt.getMinutes().toString().padStart(2, '0')}`
    : '00:00';

  return {
    id: meal.id,
    name: meal.foodName,
    amount: meal.amount,
    calories: meal.calories,
    carbs: meal.carbs,
    protein: meal.protein,
    fat: meal.fat,
    date: meal.date,
    time,
    mealType: meal.mealType,
    source: 'api',
  };
}

function mapLocalMeal(date: string, meal: {
  id: number;
  name: string;
  calories: number;
  time: string;
  protein: number;
  carbs: number;
  fat: number;
  mealType?: MealType;
  amount?: number;
}): MealCardItem {
  return {
    id: meal.id,
    name: meal.name,
    amount: meal.amount ?? 100,
    calories: meal.calories,
    carbs: meal.carbs,
    protein: meal.protein,
    fat: meal.fat,
    date,
    time: meal.time,
    mealType: meal.mealType ?? inferMealTypeByTime(meal.time),
    source: 'local',
  };
}

function buildLocalSummary(meals: MealCardItem[]): MealListSummary {
  const consumed = meals.reduce(
    (accumulator, meal) => ({
      totalCalories: accumulator.totalCalories + meal.calories,
      totalCarbs: accumulator.totalCarbs + meal.carbs,
      totalProtein: accumulator.totalProtein + meal.protein,
      totalFat: accumulator.totalFat + meal.fat,
    }),
    { totalCalories: 0, totalCarbs: 0, totalProtein: 0, totalFat: 0 },
  );

  return {
    ...consumed,
    targetCalories: null,
    targetCarbs: null,
    targetProtein: null,
    targetFat: null,
    caloriesAchievement: null,
    carbsAchievement: null,
    proteinAchievement: null,
    fatAchievement: null,
  };
}

export default function DailyMealViewPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingMeal, setEditingMeal] = useState<EditMealState | null>(null);
  const [, setLocalMealsVersion] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const updateMealMutation = useUpdateMeal();
  const deleteMealMutation = useDeleteMeal();
  const mealsQuery = useMeals(selectedDate);

  const selectedDateKey = toDateKey(selectedDate);
  const storedMeals = getStoredMeals()[selectedDateKey] ?? [];
  const localMeals = storedMeals.map((meal) => mapLocalMeal(selectedDateKey, meal));
  const apiMeals = useMemo(() => (mealsQuery.data?.meals ?? []).map(mapApiMeal), [mealsQuery.data?.meals]);
  const meals = apiMeals.length > 0 ? apiMeals : localMeals;
  const localSummary = useMemo(() => buildLocalSummary(localMeals), [localMeals]);
  const summary = apiMeals.length > 0 ? (mealsQuery.data?.summary ?? localSummary) : localSummary;

  const handlePreviousDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() - 1);
    setSelectedDate(nextDate);
  };

  const handleNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    if (nextDate <= new Date()) {
      setSelectedDate(nextDate);
    }
  };

  const handleDeleteMeal = async (meal: MealCardItem) => {
    if (meal.source === 'api') {
      try {
        await deleteMealMutation.mutateAsync({ id: meal.id, date: meal.date });
        showToast.success('식단이 삭제되었습니다');
      } catch (error) {
        console.error('Failed to delete meal:', error);
        showToast.error('식단 삭제에 실패했습니다');
      }
      return;
    }

    deleteStoredMeal(meal.date, meal.id);
    setLocalMealsVersion((current) => current + 1);
    showToast.success('식단이 삭제되었습니다');
  };

  const handleEditMeal = (meal: MealCardItem) => {
    setEditingMeal({
      ...meal,
      originalDate: meal.date,
      baseCalories: toBaseNutrient(meal.calories, meal.amount),
      baseCarbs: toBaseNutrient(meal.carbs, meal.amount),
      baseProtein: toBaseNutrient(meal.protein, meal.amount),
      baseFat: toBaseNutrient(meal.fat, meal.amount),
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLocalMealsVersion((current) => current + 1);
    await mealsQuery.refetch();
    setIsRefreshing(false);
    setPullDistance(0);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (window.scrollY > 0) {
      touchStartY.current = null;
      return;
    }

    touchStartY.current = event.touches[0].clientY;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null || window.scrollY > 0) {
      return;
    }

    const nextDistance = event.touches[0].clientY - touchStartY.current;
    setPullDistance(Math.max(0, Math.min(nextDistance, 120)));
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 80) {
      await handleRefresh();
    } else {
      setPullDistance(0);
    }

    touchStartY.current = null;
  };

  return (
    <div className="min-h-full space-y-5 bg-background px-5 py-5" onTouchEnd={handleTouchEnd} onTouchMove={handleTouchMove} onTouchStart={handleTouchStart}>
      <div className="flex flex-col items-center gap-2" style={{ paddingTop: pullDistance > 0 ? `${pullDistance / 2}px` : undefined }}>
        {pullDistance > 0 || isRefreshing ? (
          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-gray-500 shadow-sm">
            <Loader2 className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-green-500' : ''}`} />
            <span>{isRefreshing ? '새로고침 중...' : '당기면 새로고침됩니다'}</span>
          </div>
        ) : null}

        <div className="flex items-center justify-center gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors active:bg-gray-100" onClick={handlePreviousDay} type="button">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 shadow-sm">
            <Calendar className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-gray-900">{toDateLabel(selectedDate)}</span>
          </div>
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors ${isToday(selectedDate) ? 'cursor-not-allowed opacity-50' : 'active:bg-gray-100'}`}
            onClick={handleNextDay}
            type="button"
            disabled={isToday(selectedDate)}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {!isToday(selectedDate) ? (
          <button type="button" onClick={() => setSelectedDate(new Date())} className="text-xs font-medium text-green-600 hover:text-green-700">
            오늘로 이동
          </button>
        ) : null}
      </div>

      <NutritionSummaryCard
        summary={{
          calories: summary.totalCalories,
          carbs: summary.totalCarbs,
          protein: summary.totalProtein,
          fat: summary.totalFat,
        }}
        goals={{
          calories: summary.targetCalories ?? 2000,
          carbs: summary.targetCarbs ?? 250,
          protein: summary.targetProtein ?? 150,
          fat: summary.targetFat ?? 65,
        }}
      />

      {mealsQuery.isLoading && apiMeals.length === 0 && localMeals.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-12 text-center shadow-sm">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-green-500" />
          <p className="mt-3 text-sm text-gray-500">식단을 불러오는 중입니다.</p>
        </div>
      ) : meals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-700">등록된 식단이 없습니다</p>
          <p className="mt-2 text-xs text-gray-500">이 날짜에 식단을 저장하면 여기서 확인할 수 있습니다.</p>
        </div>
      ) : (
        <MealTimeline meals={meals} onDelete={handleDeleteMeal} onEdit={handleEditMeal} />
      )}

      {editingMeal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5" onClick={() => setEditingMeal(null)}>
          <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">식단 수정</h3>
                <p className="mt-1 text-sm text-gray-600">{editingMeal.name}</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setEditingMeal(null)} aria-label="닫기">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-5">
              <label className="input-label">섭취량</label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={editingMeal.amount}
                  onChange={(event) => {
                    const nextAmount = Number(event.target.value) || 0;
                    const ratio = nextAmount / 100;
                    setEditingMeal((current) => current ? {
                      ...current,
                      amount: nextAmount,
                      calories: Math.round(current.baseCalories * ratio),
                      carbs: Math.round(current.baseCarbs * ratio * 10) / 10,
                      protein: Math.round(current.baseProtein * ratio * 10) / 10,
                      fat: Math.round(current.baseFat * ratio * 10) / 10,
                    } : current);
                  }}
                  className="input-primary pr-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">g</span>
              </div>
            </div>

            <NutritionPreview nutrients={{
              calories: editingMeal.calories,
              carbs: editingMeal.carbs,
              protein: editingMeal.protein,
              fat: editingMeal.fat,
            }} />

            <div className="mb-5">
              <label className="input-label mb-3">식사 시간대</label>
              <MealTypeSelector value={editingMeal.mealType} onChange={(value) => setEditingMeal((current) => current ? { ...current, mealType: value } : current)} />
            </div>

            <div className="mb-6">
              <label className="input-label mb-3">날짜</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextDate = parseDateString(editingMeal.date);
                    nextDate.setDate(nextDate.getDate() - 1);
                    setEditingMeal((current) => current ? { ...current, date: toDateKey(nextDate) } : current);
                  }}
                  className="icon-button flex-shrink-0"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex min-touch flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-900">
                    {toCompactDateLabel(parseDateString(editingMeal.date))}
                    {editingMeal.date === toDateKey(new Date()) ? <span className="ml-1 text-xs font-normal text-gray-400">(오늘)</span> : null}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextDate = parseDateString(editingMeal.date);
                    nextDate.setDate(nextDate.getDate() + 1);
                    if (nextDate <= new Date()) {
                      setEditingMeal((current) => current ? { ...current, date: toDateKey(nextDate) } : current);
                    }
                  }}
                  className="icon-button flex-shrink-0"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setEditingMeal((current) => current ? { ...current, date: toDateKey(new Date()) } : current)}
                className="mt-2 text-xs font-medium text-green-600 hover:text-green-700"
              >
                오늘로 이동
              </button>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setEditingMeal(null)} className="btn btn-ghost flex-1">
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={async () => {
                  if (editingMeal.amount <= 0) {
                    showToast.error('섭취량을 입력해주세요');
                    return;
                  }

                  if (editingMeal.source === 'api') {
                    try {
                      await updateMealMutation.mutateAsync({
                        id: editingMeal.id,
                        meal: {
                          amount: editingMeal.amount,
                          date: editingMeal.date,
                          mealType: editingMeal.mealType,
                        },
                      });
                      showToast.success('식단이 수정되었습니다');
                    } catch (error) {
                      console.error('Failed to update meal:', error);
                      showToast.error('식단 수정에 실패했습니다');
                      return;
                    }
                  } else {
                    updateStoredMeal(editingMeal.originalDate, editingMeal.date, {
                      id: editingMeal.id,
                      name: editingMeal.name,
                      calories: editingMeal.calories,
                      time: editingMeal.time,
                      protein: editingMeal.protein,
                      carbs: editingMeal.carbs,
                      fat: editingMeal.fat,
                      mealType: editingMeal.mealType,
                      amount: editingMeal.amount,
                    });
                    setLocalMealsVersion((current) => current + 1);
                    showToast.success('식단이 수정되었습니다');
                  }

                  if (editingMeal.date !== selectedDateKey) {
                    setSelectedDate(parseDateString(editingMeal.date));
                  }
                  setEditingMeal(null);
                }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
