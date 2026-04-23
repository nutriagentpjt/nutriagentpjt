import { ProgressBar } from '@/components/common';

interface NutritionSummaryCardProps {
  summary: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
  goals?: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
}

const defaultGoals = {
  calories: 2000,
  carbs: 250,
  protein: 150,
  fat: 65,
};

export function NutritionSummaryCard({ summary, goals = defaultGoals }: NutritionSummaryCardProps) {
  const calorieRate = Math.round((summary.calories / goals.calories) * 100) || 0;
  const remainingCalories = Math.max(goals.calories - summary.calories, 0);

  return (
    <div className="rounded-2xl border border-gray-100/50 bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-700">영양소 요약</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{summary.calories}</p>
          <p className="mt-1 text-xs text-gray-500">{goals.calories} kcal 중</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">{calorieRate}%</p>
          <p className="text-xs text-gray-500">{remainingCalories} kcal 남음</p>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar value={summary.calories} max={goals.calories} color="#10b981" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-gray-100 p-3">
          <p className="text-[11px] text-gray-500">단백질</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {summary.protein}
            <span className="ml-0.5 text-xs text-gray-500">/{goals.protein}g</span>
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min((summary.protein / goals.protein) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 p-3">
          <p className="text-[11px] text-gray-500">탄수화물</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {summary.carbs}
            <span className="ml-0.5 text-xs text-gray-500">/{goals.carbs}g</span>
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min((summary.carbs / goals.carbs) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 p-3">
          <p className="text-[11px] text-gray-500">지방</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {summary.fat}
            <span className="ml-0.5 text-xs text-gray-500">/{goals.fat}g</span>
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min((summary.fat / goals.fat) * 100, 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
