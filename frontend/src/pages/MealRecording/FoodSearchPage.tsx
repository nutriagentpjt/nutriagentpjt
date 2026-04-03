import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ImageSourceModal } from '@/components/camera';
import { AddFoodModal, FoodList, FoodSearchInput } from '@/components/food';
import { ROUTES } from '@/constants/routes';
import { useFoodAutocomplete, useFoodSearch } from '@/hooks';
import { useImageUploadStore, useMealStore } from '@/store';
import type { Food } from '@/types';

interface FoodSearchLocationState {
  initialQuery?: string;
}

export default function FoodSearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const setImageUploadFile = useImageUploadStore((state) => state.setSelectedFile);
  const setAmount = useMealStore((state) => state.setAmount);
  const setSelectedDate = useMealStore((state) => state.setSelectedDate);
  const setSelectedFood = useMealStore((state) => state.setSelectedFood);
  const [favoriteBrands, setFavoriteBrands] = useState<Set<number | string>>(new Set());
  const [query, setQuery] = useState('');
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [activeFood, setActiveFood] = useState<Food | null>(null);

  const { data: foods = [], isDebouncing, isLoading } = useFoodSearch(query);
  const { data: suggestions = [] } = useFoodAutocomplete(query);

  useEffect(() => {
    const nextState = location.state as FoodSearchLocationState | null;
    if (nextState?.initialQuery) {
      setQuery(nextState.initialQuery);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

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

  const handleFileSelected = (file?: File) => {
    if (!file) {
      return;
    }

    setImageUploadFile(file);
    navigate(ROUTES.MEAL_UPLOAD);
  };

  return (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          setShowImageSourceModal(false);
          handleFileSelected(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          setShowImageSourceModal(false);
          handleFileSelected(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      <div className="space-y-5 px-5 py-5">
        <FoodSearchInput
          onCameraClick={() => setShowImageSourceModal(true)}
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
      <ImageSourceModal
        isOpen={showImageSourceModal}
        onClose={() => setShowImageSourceModal(false)}
        onCamera={() => cameraInputRef.current?.click()}
        onGallery={() => galleryInputRef.current?.click()}
      />
    </>
  );
}
