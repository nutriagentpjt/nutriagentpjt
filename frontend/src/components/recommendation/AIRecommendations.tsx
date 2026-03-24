import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { CheckCircle, Sparkles, X } from 'lucide-react';
import { recommendationService } from '@/services';
import type { MealType } from '@/types';
import CoachingMessage from './CoachingMessage';
import RecommendationCard, { type RecommendationCardItem } from './RecommendationCard';

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
  onSaveFood?: (food: RecommendationCardItem) => void;
  onToggleFavorite?: (food: FavoriteFoodPayload) => void;
  isFavorite?: (foodId: number) => boolean;
  mealType?: MealType;
  date?: string;
  recommendations?: RecommendationCardItem[];
  coachingMessage?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
}

const DUMMY_SET_ID = 'demo-recommendation-set';

export default function AIRecommendations({
  onClose,
  onSaveFood,
  onToggleFavorite,
  isFavorite,
  mealType = 'lunch',
  date = new Date().toISOString().split('T')[0] ?? '',
  recommendations,
  coachingMessage,
  isLoading = false,
  errorMessage = null,
}: AIRecommendationsProps) {
  const [preferences, setPreferences] = useState<Record<number, 'liked' | 'disliked' | null>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const saveRecommendationMutation = useMutation({
    mutationFn: recommendationService.saveRecommendation,
  });

  const feedbackMutation = useMutation({
    mutationFn: recommendationService.submitFeedback,
  });

  const recommendationEventMutation = useMutation({
    mutationFn: recommendationService.recordEvent,
  });

  const recommendedFoods: RecommendationCardItem[] = [
    {
      setId: DUMMY_SET_ID,
      foodId: 1,
      foodName: '닭가슴살 샐러드',
      recommendedAmount: 100,
      score: 95,
      reasons: ['고단백', '저지방'],
      nutrients: { calories: 350, protein: 35, carbs: 30, fat: 10 },
      imageUrl:
        'https://images.unsplash.com/photo-1761315600943-d8a5bb0c499f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmlsbGVkJTIwY2hpY2tlbiUyMGJyZWFzdCUyMHNhbGFkfGVufDF8fHx8MTc3MzU3OTYyNHww&ixlib=rb-4.1.0&q=80&w=1080',
      category: '고단백 저지방',
    },
    {
      setId: DUMMY_SET_ID,
      foodId: 2,
      foodName: '연어 덮밥',
      recommendedAmount: 120,
      score: 91,
      reasons: ['오메가3', '균형 식단'],
      nutrients: { calories: 520, protein: 28, carbs: 55, fat: 18 },
      imageUrl:
        'https://images.unsplash.com/photo-1638502182261-7be714a565ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWxtb24lMjByaWNlJTIwYm93bHxlbnwxfHx8fDE3NzM1NjkyMzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
      category: '오메가3 풍부',
    },
    {
      setId: DUMMY_SET_ID,
      foodId: 3,
      foodName: '그릭 요거트 & 베리',
      recommendedAmount: 150,
      score: 88,
      reasons: ['간식 추천', '단백질 보강'],
      nutrients: { calories: 220, protein: 15, carbs: 30, fat: 5 },
      imageUrl:
        'https://images.unsplash.com/photo-1618798513386-fedeb5c30d39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlayUyMHlvZ3VydCUyMGJlcnJpZXN8ZW58MXx8fHwxNzczNjI2MzQzfDA&ixlib=rb-4.1.0&q=80&w=1080',
      category: '고단백 간식',
    },
    {
      setId: DUMMY_SET_ID,
      foodId: 4,
      foodName: '아보카도 에그 토스트',
      recommendedAmount: 110,
      score: 84,
      reasons: ['건강한 지방', '포만감'],
      nutrients: { calories: 380, protein: 18, carbs: 35, fat: 20 },
      imageUrl:
        'https://images.unsplash.com/photo-1585819531730-06d1aba54ce1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdm9jYWRvJTIwdG9hc3QlMjBlZ2d8ZW58MXx8fHwxNzczNjQ5Mjk5fDA&ixlib=rb-4.1.0&q=80&w=1080',
      category: '건강한 지방',
    },
  ];

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 3000);
  };

  const handleFeedback = async (
    recommendation: RecommendationCardItem,
    feedback: 'liked' | 'disliked',
  ) => {
    const nextFeedback = preferences[recommendation.foodId] === feedback ? null : feedback;

    setPreferences((prev) => ({
      ...prev,
      [recommendation.foodId]: nextFeedback,
    }));

    if (nextFeedback) {
      feedbackMutation.mutate({
        setId: recommendation.setId,
        foodId: recommendation.foodId,
        feedback: nextFeedback,
        mealType,
        date,
      });

      showToastMessage(
        feedback === 'liked' ? '선호 음식으로 저장되었습니다!' : '비선호 음식으로 저장되었습니다',
      );
    }
  };

  const handleAddFood = (recommendation: RecommendationCardItem) => {
    onSaveFood?.(recommendation);

    saveRecommendationMutation.mutate({
      setId: recommendation.setId,
      foodId: recommendation.foodId,
      mealType,
      date,
    });

    recommendationEventMutation.mutate({
      setId: recommendation.setId,
      foodId: recommendation.foodId,
      event: 'save',
      mealType,
      date,
    });

    showToastMessage(`${recommendation.foodName}이(가) 오늘의 식단에 추가되었습니다!`);
  };

  const toggleFavorite = (recommendation: RecommendationCardItem) => {
    onToggleFavorite?.({
      id: recommendation.foodId,
      name: recommendation.foodName,
      calories: recommendation.nutrients.calories,
      protein: recommendation.nutrients.protein,
      carbs: recommendation.nutrients.carbs,
      fat: recommendation.nutrients.fat,
    });

    const favorite = isFavorite ? isFavorite(recommendation.foodId) : false;
    showToastMessage(favorite ? '즐겨찾기에서 제거되었습니다' : '즐겨찾기에 추가되었습니다');
  };

  const recommendationsToRender = recommendations ?? recommendedFoods;

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

          <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-xs leading-relaxed text-white">
              선호도를 표시하면 사용자에게 더 맞는 추천을 받을 수 있어요.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-5">
          <CoachingMessage message={coachingMessage} />

          {errorMessage ? (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 shadow-sm">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center text-sm text-gray-500 shadow-sm">
              추천 식단을 불러오는 중입니다.
            </div>
          ) : null}

          <div className="space-y-3 pb-6">
            {!isLoading && recommendationsToRender.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center text-sm text-gray-500 shadow-sm">
                추천 가능한 식단이 아직 없습니다.
              </div>
            ) : null}

            {!isLoading
              ? recommendationsToRender.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.foodId}
                    recommendation={recommendation}
                    isFavorite={isFavorite?.(recommendation.foodId)}
                    preference={preferences[recommendation.foodId] ?? null}
                    onToggleFavorite={toggleFavorite}
                    onLike={(item) => handleFeedback(item, 'liked')}
                    onDislike={(item) => handleFeedback(item, 'disliked')}
                    onSave={handleAddFood}
                  />
                ))
              : null}
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
