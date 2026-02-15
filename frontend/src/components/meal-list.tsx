import { Utensils, Trash2, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";

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
}

export function MealList({ meals, onRemoveMeal, onEditMeal, onAddCustomMeal }: MealListProps) {
  const [swipedId, setSwipedId] = useState<number | null>(null);
  const [startX, setStartX] = useState<number>(0);
  const [currentX, setCurrentX] = useState<number>(0);
  const [initialX, setInitialX] = useState<number>(0); // 터치/마우스 시작 시점의 currentX 저장
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 자동 닫기 타이머 시작
  const startAutoCloseTimer = () => {
    // 기존 타이머 취소
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }

    // 1.5초 후 자동으로 닫기
    autoCloseTimerRef.current = setTimeout(() => {
      setCurrentX(0);
      setSwipedId(null);
    }, 1500);
  };

  // 타이머 취소
  const cancelAutoCloseTimer = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent, id: number) => {
    cancelAutoCloseTimer(); // 터치 시작 시 타이머 취소
    setStartX(e.touches[0].clientX);
    setSwipedId(id);
    setInitialX(currentX); // 터치 시작 시점의 currentX 저장
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipedId === null) return;
    cancelAutoCloseTimer(); // 이동 중에는 타이머 취소
    const deltaX = e.touches[0].clientX - startX;
    const newX = initialX + deltaX;

    // -80 ~ 0 범위 내에서만 이동 허용
    setCurrentX(Math.max(-80, Math.min(0, newX)));
  };

  const handleTouchEnd = () => {
    // 스와이프가 충분히 크면 열린 상태 유지, 아니면 닫기
    if (currentX < -40) {
      setCurrentX(-80);
      startAutoCloseTimer(); // 열린 상태에서 타이머 시작
    } else {
      setCurrentX(0);
      setSwipedId(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: number) => {
    cancelAutoCloseTimer(); // 마우스 다운 시 타이머 취소
    setStartX(e.clientX);
    setSwipedId(id);
    setIsDragging(true);
    setInitialX(currentX); // 마우스 시작 시점의 currentX 저장
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || swipedId === null) return;
    cancelAutoCloseTimer(); // 이동 중에는 타이머 취소
    const deltaX = e.clientX - startX;
    const newX = initialX + deltaX;

    // -80 ~ 0 범위 내에서만 이동 허용
    setCurrentX(Math.max(-80, Math.min(0, newX)));
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // 스와이프가 충분히 크면 열린 상태 유지, 아니면 닫기
    if (currentX < -40) {
      setCurrentX(-80);
      startAutoCloseTimer(); // 열린 상태에서 타이머 시작
    } else {
      setCurrentX(0);
      setSwipedId(null);
    }
  };

  const handleMouseLeave = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // 마우스가 영역을 벗어나면 자동으로 닫기
    if (currentX < -40) {
      setCurrentX(-80);
      startAutoCloseTimer(); // 열린 상태에서 타이머 시작
    } else {
      setCurrentX(0);
      setSwipedId(null);
    }
  };

  const handleRemove = (id: number) => {
    cancelAutoCloseTimer(); // 삭제 시 타이머 취소
    if (onRemoveMeal) {
      onRemoveMeal(id);
    }
    setCurrentX(0);
    setSwipedId(null);
    setIsDragging(false);
  };

  const handleEdit = (meal: Meal) => {
    cancelAutoCloseTimer(); // 편집 시 타이머 취소
    if (onEditMeal) {
      onEditMeal(meal);
    }
    setCurrentX(0);
    setSwipedId(null);
    setIsDragging(false);
  };

  const handleClick = (meal: Meal) => {
    // 스와이프가 열려있지 않을 때만 클릭 이벤트 처리
    if (currentX === 0 && !isDragging) {
      handleEdit(meal);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
      <div className="px-3.5 py-2.5 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-green-500" />
            <p className="text-xs font-semibold text-gray-700">오늘의 식단</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500">{meals.length}개</p>
            {onAddCustomMeal && (
              <button
                onClick={onAddCustomMeal}
                className="flex items-center gap-1 px-2 py-1 bg-green-50 hover:bg-green-100 active:bg-green-200 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-green-600">직접 추가</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {meals.map((meal, index) => (
        <div
          key={meal.id}
          className={`relative ${
            index !== meals.length - 1 ? "border-b border-gray-100" : ""
          }`}
        >
          {/* 배경 삭제 버튼 */}
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center">
            <button
              onClick={() => handleRemove(meal.id)}
              className="w-full h-full flex items-center justify-center"
              aria-label="식단 삭제"
            >
              <Trash2 className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* 스와이프 가능한 메뉴 항목 */}
          <div
            className="relative bg-white flex items-center gap-2.5 p-3.5 touch-pan-y"
            style={{
              transform: `translateX(${
                swipedId === meal.id ? currentX : 0
              }px)`,
              transition:
                swipedId === meal.id && currentX !== 0
                  ? "none"
                  : "transform 0.3s ease-out",
            }}
            onTouchStart={(e) => handleTouchStart(e, meal.id)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={(e) => handleMouseDown(e, meal.id)}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(meal)}
          >
            <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Utensils className="w-4.5 h-4.5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{meal.name}</p>
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
