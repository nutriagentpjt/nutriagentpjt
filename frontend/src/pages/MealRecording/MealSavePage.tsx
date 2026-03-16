import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddFoodModal } from '@/components/food';
import { ROUTES } from '@/constants/routes';
import { useMealStore } from '@/store';

export default function MealSavePage() {
  const navigate = useNavigate();
  const selectedDate = useMealStore((state) => state.selectedDate);
  const selectedFood = useMealStore((state) => state.selectedFood);

  useEffect(() => {
    if (!selectedFood) {
      navigate(ROUTES.MEAL_SEARCH, { replace: true });
    }
  }, [navigate, selectedFood]);

  const initialDate = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();

  return (
    <AddFoodModal
      food={selectedFood}
      isOpen={!!selectedFood}
      initialDate={initialDate}
      onClose={() => navigate(ROUTES.MEAL_SEARCH)}
      redirectTo={ROUTES.HOME}
    />
  );
}
