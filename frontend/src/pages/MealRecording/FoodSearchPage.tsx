import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddFoodModal, FoodList, FoodSearchInput } from '@/components/food';
import { ROUTES } from '@/constants/routes';
import { useFoodSearch } from '@/hooks';
import { useMealStore } from '@/store';
import type { Food } from '@/types';

const autocompleteDatabase = [
  '닭가슴살',
  '김치찌개',
  '된장찌개',
  '삼겹살',
  '쌀밥',
  '현미밥',
  '고구마',
  '달걀',
  '바나나',
  '사과',
  '오렌지',
  '샐러드',
  '아보카도',
  '연어',
  '참치',
  '두부',
  '요거트',
  '그릭요거트',
  '프로틴바',
  '프로틴쉐이크',
  '오트밀',
  '퀴노아',
  '닭다리',
  '닭안심',
  '소고기',
  '돼지고기',
  '새우',
  '오징어',
  '고등어',
  '브로콜리',
  '시금치',
  '토마토',
  '양파',
  '마늘',
  '감자',
  '단호박',
];

export default function FoodSearchPage() {
  const navigate = useNavigate();
  const setAmount = useMealStore((state) => state.setAmount);
  const setSelectedDate = useMealStore((state) => state.setSelectedDate);
  const setSelectedFood = useMealStore((state) => state.setSelectedFood);
  const [favoriteBrands, setFavoriteBrands] = useState<Set<number | string>>(new Set());
  const [query, setQuery] = useState('');
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [activeFood, setActiveFood] = useState<Food | null>(null);

  const { data: foods = [], isDebouncing, isLoading } = useFoodSearch(query);

  const suggestions = useMemo(() => {
    if (query.trim().length < 2) {
      return [];
    }

    const lowerQuery = query.trim().toLowerCase();

    return autocompleteDatabase
      .filter((item) => item.toLowerCase().includes(lowerQuery))
      .slice(0, 5);
  }, [query]);

  const handleToggleFavorite = (id: number | string) => {
    setFavoriteBrands((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const handleAddFood = (food: Food) => {
    setSelectedFood(food);
    setAmount(Number(food.servingSize) || 100);
    setSelectedDate(new Date().toISOString().split('T')[0] ?? '');
    setActiveFood(food);
    setShowAddFoodModal(true);
  };

  const handleCloseModal = () => {
    setShowAddFoodModal(false);
    setActiveFood(null);
  };

  return (
    <>
      <div className="space-y-5 px-5 py-5">
        <FoodSearchInput
          onCameraClick={() => navigate(ROUTES.MEAL_UPLOAD)}
          onChange={setQuery}
          onSuggestionSelect={setQuery}
          value={query}
          suggestions={suggestions}
        />

        <FoodList
          foods={foods}
          isDebouncing={isDebouncing}
          isFavorite={(id) => favoriteBrands.has(id)}
          isLoading={isLoading}
          onAdd={handleAddFood}
          onToggleFavorite={handleToggleFavorite}
          query={query}
        />
      </div>

      <AddFoodModal food={activeFood} isOpen={showAddFoodModal} onClose={handleCloseModal} />
    </>
  );
}
