import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AIRecommendations, type RecommendationCardItem } from '@/components/recommendation';
import { AddFoodModal } from '@/components/food';
import { ROUTES } from '@/constants/routes';
import { useRecommendations } from '@/hooks';
import HomePage from '@/pages/HomePage';
import type { Food } from '@/types';

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
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [selectedFoodForModal, setSelectedFoodForModal] = useState<Food | null>(null);
  const currentDate = new Date().toISOString().split('T')[0] ?? '';
  const mealType = 'lunch';

  const { data, isLoading, error } = useRecommendations({
    mealType,
    date: currentDate,
    limit: 8,
  });

  const favoriteChecker = useMemo(() => (foodId: number) => favoriteIds.has(foodId), [favoriteIds]);

  const mappedRecommendations = useMemo<RecommendationCardItem[] | undefined>(() => {
    if (!data) {
      return undefined;
    }

    return data.recommendations.map((recommendation) => ({
      ...recommendation,
      imageUrl: '',
      category: recommendation.reasons[0],
    }));
  }, [data]);

  useEffect(() => {
    if (!error || !axios.isAxiosError(error) || error.response?.status !== 409) {
      return;
    }

    navigate(ROUTES.ONBOARDING_WELCOME, { replace: true });
  }, [error, navigate]);

  const errorMessage =
    axios.isAxiosError(error) && error.response?.status !== 409
      ? '추천 식단을 불러오지 못해 기본 추천을 표시합니다.'
      : null;

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

  const handleSaveFood = (food: RecommendationCardItem) => {
    setSelectedFoodForModal({
      id: food.foodId,
      name: food.foodName,
      servingSize: 100,
      calories: food.nutrients.calories,
      carbs: food.nutrients.carbs,
      protein: food.nutrients.protein,
      fat: food.nutrients.fat,
      servingUnit: 'g',
      weight: 100,
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      <div aria-hidden="true" className="pointer-events-none select-none">
        <HomePage />
      </div>
      <AIRecommendations
        onClose={() => navigate(ROUTES.HOME)}
        mealType={mealType}
        date={currentDate}
        recommendations={mappedRecommendations}
        coachingMessage={data?.coachingMessage}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onSaveFood={handleSaveFood}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={favoriteChecker}
      />
      <AddFoodModal
        food={selectedFoodForModal}
        isOpen={selectedFoodForModal !== null}
        onClose={() => setSelectedFoodForModal(null)}
        onSaved={() => setSelectedFoodForModal(null)}
        initialDate={new Date()}
        redirectTo={ROUTES.RECOMMENDATION}
      />
    </div>
  );
}
