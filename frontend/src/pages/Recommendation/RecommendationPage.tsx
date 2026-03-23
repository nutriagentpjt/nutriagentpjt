import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIRecommendations } from '@/components/recommendation';
import { ROUTES } from '@/constants/routes';
import HomePage from '@/pages/HomePage';
import { useMealStore } from '@/store/mealStore';

interface RecommendedFoodPayload {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function RecommendationPage() {
  const navigate = useNavigate();
  const setSelectedFood = useMealStore((state) => state.setSelectedFood);
  const setSelectedFoodId = useMealStore((state) => state.setSelectedFoodId);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const favoriteChecker = useMemo(() => (foodId: number) => favoriteIds.has(foodId), [favoriteIds]);

  const handleToggleFavorite = (food: RecommendedFoodPayload) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(food.id)) {
        next.delete(food.id);
      } else {
        next.add(food.id);
      }
      return next;
    });
  };

  const handleSaveFood = (food: RecommendedFoodPayload) => {
    setSelectedFood({
      id: food.id,
      name: food.name,
      servingSize: 100,
      calories: food.calories,
      carbs: food.carbs,
      protein: food.protein,
      fat: food.fat,
      servingUnit: 'g',
      weight: 100,
    });
    setSelectedFoodId(food.id);
    navigate(ROUTES.MEAL_SAVE);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      <div aria-hidden="true" className="pointer-events-none select-none">
        <HomePage />
      </div>
      <AIRecommendations
        onClose={() => navigate(ROUTES.HOME)}
        onSaveFood={handleSaveFood}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={favoriteChecker}
      />
    </div>
  );
}
