import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddFoodModal } from '@/components/food';
import { ROUTES } from '@/constants/routes';
import { useMealStore } from '@/store';

export default function MealSavePage() {
  const navigate = useNavigate();
  const selectedFood = useMealStore((state) => state.selectedFood);

  useEffect(() => {
    if (!selectedFood) {
      navigate(ROUTES.MEAL_SEARCH, { replace: true });
    }
  }, [navigate, selectedFood]);

  return <AddFoodModal food={selectedFood} isOpen={!!selectedFood} onClose={() => navigate(ROUTES.MEAL_SEARCH)} />;
}
