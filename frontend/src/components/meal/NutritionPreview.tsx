interface NutritionPreviewProps {
  nutrients: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
}

export function NutritionPreview({ nutrients }: NutritionPreviewProps) {
  return (
    <div className="mb-5 rounded-xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <h4 className="mb-3 text-sm font-semibold text-gray-700">예상 영양소</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white p-3">
          <p className="mb-1 text-xs text-gray-500">칼로리</p>
          <p className="number-md text-green-600">{nutrients.calories}</p>
          <p className="text-xs text-gray-400">kcal</p>
        </div>
        <div className="rounded-lg bg-white p-3">
          <p className="mb-1 text-xs text-gray-500">탄수화물</p>
          <p className="number-md text-secondary-600">{nutrients.carbs}</p>
          <p className="text-xs text-gray-400">g</p>
        </div>
        <div className="rounded-lg bg-white p-3">
          <p className="mb-1 text-xs text-gray-500">단백질</p>
          <p className="number-md text-accent-600">{nutrients.protein}</p>
          <p className="text-xs text-gray-400">g</p>
        </div>
        <div className="rounded-lg bg-white p-3">
          <p className="mb-1 text-xs text-gray-500">지방</p>
          <p className="number-md text-yellow-600">{nutrients.fat}</p>
          <p className="text-xs text-gray-400">g</p>
        </div>
      </div>
    </div>
  );
}
