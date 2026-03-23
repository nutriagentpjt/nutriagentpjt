import { Plus, Trash2, Utensils } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Meal {
  id: number;
  name: string;
  calories: number;
  time: string;
}

interface MealListProps {
  meals: Meal[];
  onRemoveMeal?: (id: number) => void;
  onEditMeal?: (meal: Meal) => void;
  onAddCustomMeal?: () => void;
  onHeaderClick?: () => void;
}

export function MealList({ meals, onRemoveMeal, onEditMeal, onAddCustomMeal, onHeaderClick }: MealListProps) {
  const [swipedId, setSwipedId] = useState<number | null>(null);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [initialX, setInitialX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAutoCloseTimer = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }

    autoCloseTimerRef.current = setTimeout(() => {
      setCurrentX(0);
      setSwipedId(null);
    }, 1500);
  };

  const cancelAutoCloseTimer = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  const handleTouchStart = (event: React.TouchEvent, id: number) => {
    cancelAutoCloseTimer();
    setStartX(event.touches[0].clientX);
    setSwipedId(id);
    setInitialX(currentX);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (swipedId === null) return;
    cancelAutoCloseTimer();
    const deltaX = event.touches[0].clientX - startX;
    const nextX = initialX + deltaX;
    setCurrentX(Math.max(-80, Math.min(0, nextX)));
  };

  const handleTouchEnd = () => {
    if (currentX < -40) {
      setCurrentX(-80);
      startAutoCloseTimer();
    } else {
      setCurrentX(0);
      setSwipedId(null);
    }
  };

  const handleMouseDown = (event: React.MouseEvent, id: number) => {
    cancelAutoCloseTimer();
    setStartX(event.clientX);
    setSwipedId(id);
    setIsDragging(true);
    setInitialX(currentX);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || swipedId === null) return;
    cancelAutoCloseTimer();
    const deltaX = event.clientX - startX;
    const nextX = initialX + deltaX;
    setCurrentX(Math.max(-80, Math.min(0, nextX)));
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (currentX < -40) {
      setCurrentX(-80);
      startAutoCloseTimer();
    } else {
      setCurrentX(0);
      setSwipedId(null);
    }
  };

  const handleMouseLeave = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (currentX < -40) {
      setCurrentX(-80);
      startAutoCloseTimer();
    } else {
      setCurrentX(0);
      setSwipedId(null);
    }
  };

  const handleRemove = (id: number) => {
    cancelAutoCloseTimer();
    onRemoveMeal?.(id);
    setCurrentX(0);
    setSwipedId(null);
    setIsDragging(false);
  };

  const handleEdit = (meal: Meal) => {
    cancelAutoCloseTimer();
    onEditMeal?.(meal);
    setCurrentX(0);
    setSwipedId(null);
    setIsDragging(false);
  };

  const handleClick = (meal: Meal) => {
    if (currentX === 0 && !isDragging) {
      handleEdit(meal);
    }
  };

  return (
    <div
      className="cursor-pointer overflow-hidden rounded-2xl border border-gray-100/50 bg-white shadow-sm transition-all active:brightness-95"
      onClick={() => onHeaderClick?.()}
    >
      <div className="border-b border-gray-100 bg-white px-3.5 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Utensils className="h-3.5 w-3.5 text-green-500" />
            <p className="text-xs font-semibold text-gray-700">오늘의 식단</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500">{meals.length}개</p>
            {onAddCustomMeal ? (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onAddCustomMeal();
                }}
                className="flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 transition-colors hover:bg-green-100 active:bg-green-200"
              >
                <Plus className="h-3 w-3 text-green-600" />
                <span className="text-xs font-medium text-green-600">직접 추가</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {meals.map((meal, index) => (
        <div key={meal.id} className={`relative ${index !== meals.length - 1 ? 'border-b border-gray-100' : ''}`}>
          <div className="absolute bottom-0 right-0 top-0 flex w-20 items-center justify-center bg-red-500">
            <button onClick={() => handleRemove(meal.id)} className="flex h-full w-full items-center justify-center" aria-label="식단 삭제">
              <Trash2 className="h-5 w-5 text-white" />
            </button>
          </div>

          <div
            className="relative flex touch-pan-y items-center gap-2.5 bg-white p-3.5"
            style={{
              transform: `translateX(${swipedId === meal.id ? currentX : 0}px)`,
              transition: swipedId === meal.id && currentX !== 0 ? 'none' : 'transform 0.3s ease-out',
            }}
            onTouchStart={(event) => handleTouchStart(event, meal.id)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={(event) => handleMouseDown(event, meal.id)}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onClick={(event) => {
              event.stopPropagation();
              handleClick(meal);
            }}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-50">
              <Utensils className="h-4.5 w-4.5 text-green-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{meal.name}</p>
              <p className="text-xs text-gray-500">{meal.time}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{meal.calories}</p>
              <p className="text-[10px] text-gray-500">kcal</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
