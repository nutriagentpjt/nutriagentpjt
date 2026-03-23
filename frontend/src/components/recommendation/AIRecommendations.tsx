import { useState } from 'react';
import { CheckCircle, Plus, Sparkles, Star, ThumbsDown, ThumbsUp, X } from 'lucide-react';

interface RecommendedFood {
  id: number;
  name: string;
  imageUrl: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: string;
}

interface FavoriteFoodPayload {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface AIRecommendationsProps {
  onClose: () => void;
  onSaveFood?: (food: RecommendedFood) => void;
  onToggleFavorite?: (food: FavoriteFoodPayload) => void;
  isFavorite?: (foodId: number) => boolean;
}

export default function AIRecommendations({
  onClose,
  onSaveFood,
  onToggleFavorite,
  isFavorite,
}: AIRecommendationsProps) {
  const [preferences, setPreferences] = useState<Record<number, 'liked' | 'disliked' | null>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const recommendedFoods: RecommendedFood[] = [
    {
      id: 1,
      name: '닭가슴살 샐러드',
      imageUrl:
        'https://images.unsplash.com/photo-1761315600943-d8a5bb0c499f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmlsbGVkJTIwY2hpY2tlbiUyMGJyZWFzdCUyMHNhbGFkfGVufDF8fHx8MTc3MzU3OTYyNHww&ixlib=rb-4.1.0&q=80&w=1080',
      calories: 350,
      protein: 35,
      carbs: 30,
      fat: 10,
      category: '고단백 저지방',
    },
    {
      id: 2,
      name: '연어 덮밥',
      imageUrl:
        'https://images.unsplash.com/photo-1638502182261-7be714a565ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWxtb24lMjByaWNlJTIwYm93bHxlbnwxfHx8fDE3NzM1NjkyMzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
      calories: 520,
      protein: 28,
      carbs: 55,
      fat: 18,
      category: '오메가3 풍부',
    },
    {
      id: 3,
      name: '그릭 요거트 & 베리',
      imageUrl:
        'https://images.unsplash.com/photo-1618798513386-fedeb5c30d39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlayUyMHlvZ3VydCUyMGJlcnJpZXN8ZW58MXx8fHwxNzczNjI2MzQzfDA&ixlib=rb-4.1.0&q=80&w=1080',
      calories: 220,
      protein: 15,
      carbs: 30,
      fat: 5,
      category: '고단백 간식',
    },
    {
      id: 4,
      name: '아보카도 에그 토스트',
      imageUrl:
        'https://images.unsplash.com/photo-1585819531730-06d1aba54ce1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdm9jYWRvJTIwdG9hc3QlMjBlZ2d8ZW58MXx8fHwxNzczNjQ5Mjk5fDA&ixlib=rb-4.1.0&q=80&w=1080',
      calories: 380,
      protein: 18,
      carbs: 35,
      fat: 20,
      category: '건강한 지방',
    },
    {
      id: 5,
      name: '퀴노아 야채 볼',
      imageUrl:
        'https://images.unsplash.com/photo-1719677775416-1dd6a93f1a73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxxdWlub2ElMjB2ZWdldGFibGUlMjBib3dsfGVufDF8fHx8MTc3MzUzOTg5MXww&ixlib=rb-4.1.0&q=80&w=1080',
      calories: 320,
      protein: 12,
      carbs: 48,
      fat: 10,
      category: '비건 친화',
    },
    {
      id: 6,
      name: '프로틴 스무디 볼',
      imageUrl:
        'https://images.unsplash.com/photo-1622484212022-983850e48832?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm90ZWluJTIwc21vb3RoaWUlMjBib3dsfGVufDF8fHx8MTc3MzY0NjQ1NXww&ixlib=rb-4.1.0&q=80&w=1080',
      calories: 280,
      protein: 25,
      carbs: 35,
      fat: 8,
      category: '운동 후 최적',
    },
    {
      id: 7,
      name: '참치 포케 볼',
      imageUrl:
        'https://images.unsplash.com/photo-1597958792579-bd3517df6399?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0dW5hJTIwcG9rZSUyMGJvd2x8ZW58MXx8fHwxNzczNjE4NDE0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      calories: 420,
      protein: 32,
      carbs: 40,
      fat: 12,
      category: '균형 잡힌 식단',
    },
    {
      id: 8,
      name: '오트밀 바나나 넛',
      imageUrl:
        'https://images.unsplash.com/photo-1605542795052-1f8b12a430e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvYXRtZWFsJTIwYmFuYW5hJTIwbnV0c3xlbnwxfHx8fDE3NzM2NDkzMDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      calories: 340,
      protein: 10,
      carbs: 52,
      fat: 10,
      category: '아침 식사 추천',
    },
  ];

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 3000);
  };

  const handlePreference = (foodId: number, preference: 'liked' | 'disliked') => {
    setPreferences((prev) => ({
      ...prev,
      [foodId]: prev[foodId] === preference ? null : preference,
    }));

    showToastMessage(preference === 'liked' ? '선호 음식으로 저장되었습니다!' : '비선호 음식으로 저장되었습니다');
  };

  const handleAddFood = (food: RecommendedFood) => {
    onSaveFood?.(food);
    showToastMessage(`${food.name}이(가) 오늘의 식단에 추가되었습니다!`);
  };

  const toggleFavorite = (food: RecommendedFood) => {
    onToggleFavorite?.({
      id: food.id,
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    });

    const favorite = isFavorite ? isFavorite(food.id) : false;
    showToastMessage(favorite ? '즐겨찾기에서 제거되었습니다' : '즐겨찾기에 추가되었습니다');
  };

  const getCardStyle = (foodId: number) => {
    const preference = preferences[foodId];
    if (preference === 'liked') {
      return 'border-2 border-green-400 bg-green-50/50';
    }
    if (preference === 'disliked') {
      return 'border-2 border-gray-300 bg-gray-50/50 opacity-75';
    }
    return 'border border-gray-200 bg-white';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex h-full w-full flex-col bg-white sm:max-w-[390px] sm:shadow-2xl">
        <div className="flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-500 px-5 pb-4 pt-8 shadow-md">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">AI 추천 식단</h1>
                <p className="text-xs text-green-50">맞춤형 추천</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="icon-button bg-white/20 backdrop-blur-sm hover:bg-white/30"
              aria-label="닫기"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <p className="text-xs text-white leading-relaxed">
              선호도를 표시하면 사용자에게 더 맞는 추천을 받을 수 있어요.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-5">
          <div className="space-y-3 pb-6">
            {recommendedFoods.map((food) => (
              <div
                key={food.id}
                className={`rounded-2xl p-5 shadow-sm transition-all duration-300 ${getCardStyle(food.id)}`}
              >
                <div className="mb-3.5 flex items-start justify-between">
                  <div className="mr-2 flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{food.name}</h3>
                  </div>
                  <button
                    onClick={() => toggleFavorite(food)}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center transition-transform active:scale-90"
                    aria-label={isFavorite && isFavorite(food.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                  >
                    <Star
                      className={`h-5 w-5 transition-all ${
                        isFavorite && isFavorite(food.id) ? 'fill-green-500 text-green-500' : 'text-gray-300'
                      }`}
                    />
                  </button>
                </div>

                <div className="mb-4 grid grid-cols-4 gap-2">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2 text-center border border-green-100">
                    <p className="mb-0.5 text-[10px] text-gray-500">칼로리</p>
                    <p className="number-sm whitespace-nowrap text-sm font-bold text-green-600">
                      {food.calories} <span className="text-[10px]">kcal</span>
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-accent-50 to-blue-50 rounded-lg p-2 text-center border border-accent-100">
                    <p className="mb-0.5 text-[10px] text-gray-500">단백질</p>
                    <p className="number-sm text-accent-600 font-bold text-sm">{food.protein} g</p>
                  </div>
                  <div className="bg-gradient-to-br from-secondary-50 to-orange-50 rounded-lg p-2 text-center border border-secondary-100">
                    <p className="mb-0.5 text-[10px] text-gray-500">탄수화물</p>
                    <p className="number-sm text-secondary-600 font-bold text-sm">{food.carbs} g</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-2 text-center border border-yellow-100">
                    <p className="mb-0.5 text-[10px] text-gray-500">지방</p>
                    <p className="number-sm text-sm font-bold text-yellow-600">{food.fat} g</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreference(food.id, 'liked')}
                    className={`min-touch flex-1 rounded-xl py-3.5 font-semibold transition-all active:scale-[0.97] ${
                      preferences[food.id] === 'liked'
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    aria-label="선호"
                    aria-pressed={preferences[food.id] === 'liked'}
                  >
                    <span className="flex items-center justify-center gap-2 text-sm">
                      <ThumbsUp className="h-5 w-5" />
                      좋아요
                    </span>
                  </button>

                  <button
                    onClick={() => handlePreference(food.id, 'disliked')}
                    className={`min-touch flex-1 rounded-xl py-3.5 font-semibold transition-all active:scale-[0.97] ${
                      preferences[food.id] === 'disliked'
                        ? 'bg-gray-400 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    aria-label="비선호"
                    aria-pressed={preferences[food.id] === 'disliked'}
                  >
                    <span className="flex items-center justify-center gap-2 text-sm">
                      <ThumbsDown className="h-5 w-5" />
                      싫어요
                    </span>
                  </button>

                  <button
                    onClick={() => handleAddFood(food)}
                    className="min-touch flex w-16 items-center justify-center rounded-xl bg-green-500 py-3.5 text-white shadow-md transition-all hover:bg-green-600 active:scale-[0.97]"
                    aria-label="식단에 추가"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showToast ? (
          <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-toast-slide-in">
            <div className="toast-success flex min-w-[280px] items-center gap-2 rounded-xl px-4 py-3 shadow-lg">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{toastMessage}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
