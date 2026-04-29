import { useState } from 'react';
import { CheckCircle, Sparkles, X } from 'lucide-react';
import { showToast } from '@/components/common';
import { usePreferences, useRecommendations } from '@/hooks';
import type { ApiError, MealType } from '@/types';
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

function getApiErrorMessage(error: ApiError | null): string | null {
  if (!error) {
    return null;
  }

  if (typeof error.data === 'object' && error.data !== null) {
    const payload = error.data as { error?: unknown; detail?: unknown; message?: unknown };
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
    if (typeof payload.detail === 'string' && payload.detail.trim()) {
      return payload.detail;
    }
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
  }

  return null;
}

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
  const [preferenceOverrides, setPreferenceOverrides] = useState<
    Record<number, 'liked' | 'disliked' | null>
  >({});
  const [hiddenRecommendationIds, setHiddenRecommendationIds] = useState<number[]>([]);
  const [highlightedDislikedIds, setHighlightedDislikedIds] = useState<number[]>([]);
  const [dismissingRecommendationIds, setDismissingRecommendationIds] = useState<number[]>([]);
  const [showInlineToast, setShowInlineToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const {
    data: savedPreferences,
    addFoodAsync,
    removeFoodAsync,
  } = usePreferences();
  const shouldFetchRecommendations = recommendations == null;
  const recommendationQuery = useRecommendations({
    mealType,
    date,
    limit: 6,
    enabled: shouldFetchRecommendations,
  });

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowInlineToast(true);
    window.setTimeout(() => setShowInlineToast(false), 3000);
  };

  const preferredFoods = savedPreferences?.preferredFoods ?? [];
  const dislikedFoods = savedPreferences?.dislikedFoods ?? [];

  const getCurrentPreference = (recommendation: RecommendationCardItem): 'liked' | 'disliked' | null => {
    const localOverride = preferenceOverrides[recommendation.foodId];
    if (localOverride !== undefined) {
      return localOverride;
    }

    if (preferredFoods.includes(recommendation.foodName)) {
      return 'liked';
    }

    if (dislikedFoods.some((food) => food.foodName === recommendation.foodName)) {
      return 'disliked';
    }

    return null;
  };

  const handleFeedback = async (
    recommendation: RecommendationCardItem,
    feedback: 'liked' | 'disliked',
  ) => {
    const currentPreference = getCurrentPreference(recommendation);
    const nextFeedback = currentPreference === feedback ? null : feedback;

    setPreferenceOverrides((prev) => ({
      ...prev,
      [recommendation.foodId]: nextFeedback,
    }));

    try {
      if (currentPreference === 'liked') {
        await removeFoodAsync({ type: 'PREFERRED', foodName: recommendation.foodName });
      } else if (currentPreference === 'disliked') {
        await removeFoodAsync({ type: 'DISLIKED', foodName: recommendation.foodName });
      }

      if (nextFeedback === 'liked') {
        await addFoodAsync({
          type: 'PREFERRED',
          foodName: recommendation.foodName,
        });
        setDismissingRecommendationIds((prev) =>
          prev.filter((foodId) => foodId !== recommendation.foodId),
        );
      } else if (nextFeedback === 'disliked') {
        await addFoodAsync({
          type: 'DISLIKED',
          foodName: recommendation.foodName,
          reason: 'DISLIKE',
        });
        window.setTimeout(() => {
          setHighlightedDislikedIds((prev) =>
            prev.includes(recommendation.foodId) ? prev : [...prev, recommendation.foodId],
          );
        }, 20);
        window.setTimeout(() => {
          setDismissingRecommendationIds((prev) =>
            prev.includes(recommendation.foodId) ? prev : [...prev, recommendation.foodId],
          );
        }, 450);
        window.setTimeout(() => {
          setHiddenRecommendationIds((prev) =>
            prev.includes(recommendation.foodId) ? prev : [...prev, recommendation.foodId],
          );
          setDismissingRecommendationIds((prev) =>
            prev.filter((foodId) => foodId !== recommendation.foodId),
          );
          setHighlightedDislikedIds((prev) =>
            prev.filter((foodId) => foodId !== recommendation.foodId),
          );
        }, 810);
      }

      if (nextFeedback) {
        showToastMessage(
          feedback === 'liked' ? '선호 음식으로 저장되었습니다!' : '비선호 음식으로 저장되었습니다',
        );
      }
    } catch {
      setPreferenceOverrides((prev) => ({
        ...prev,
        [recommendation.foodId]: currentPreference,
      }));
      showToast.error(
        nextFeedback === 'liked'
          ? `${recommendation.foodName} 선호 등록에 실패했어요.\n잠시 후 다시 시도해주세요.`
          : nextFeedback === 'disliked'
            ? `${recommendation.foodName} 비선호 등록에 실패했어요.\n잠시 후 다시 시도해주세요.`
            : `${recommendation.foodName} 추천 관리를 변경하지 못했어요.\n잠시 후 다시 시도해주세요.`,
      );
    }
  };

  const handleAddFood = (recommendation: RecommendationCardItem) => {
    onSaveFood?.(recommendation);
    setHiddenRecommendationIds((prev) =>
      prev.includes(recommendation.foodId) ? prev : [...prev, recommendation.foodId],
    );

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

  const fetchedRecommendations = recommendationQuery.data?.recommendations;
  const shouldHideRecommendation = (recommendation: RecommendationCardItem) => {
    return hiddenRecommendationIds.includes(recommendation.foodId);
  };

  const recommendationsToRender = (recommendations ?? fetchedRecommendations ?? [])
    .filter((recommendation) => !shouldHideRecommendation(recommendation))
    .slice(0, 6);
  const mergedCoachingMessage = coachingMessage ?? null;
  const mergedIsLoading = isLoading || recommendationQuery.isLoading;
  const queryError = recommendationQuery.error as ApiError | null;
  const backendErrorMessage = getApiErrorMessage(queryError);
  const mergedErrorMessage =
    errorMessage ??
    (queryError
      ? queryError.status === 401
        ? '세션 정보를 확인한 뒤 다시 시도해주세요.'
        : backendErrorMessage
          ? backendErrorMessage
        : queryError.status === 404
          ? '온보딩 또는 목표 영양소 설정이 필요합니다.'
          : '추천 식단을 불러오지 못했습니다.'
      : null);

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
              type="button"
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
          <CoachingMessage message={mergedCoachingMessage} />

          {mergedErrorMessage ? (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 shadow-sm">
              {mergedErrorMessage}
            </div>
          ) : null}

          {mergedIsLoading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center text-sm text-gray-500 shadow-sm">
              추천 식단을 불러오는 중입니다.
            </div>
          ) : null}

          <div className="space-y-3 pb-6">
            {!mergedIsLoading && recommendationsToRender.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center text-sm text-gray-500 shadow-sm">
                추천 가능한 식단이 아직 없습니다.
              </div>
            ) : null}

            {!mergedIsLoading
              ? recommendationsToRender.map((recommendation) => (
                  <div
                    key={recommendation.foodId}
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                      dismissingRecommendationIds.includes(recommendation.foodId)
                        ? 'max-h-0 -translate-y-1 scale-[0.98] opacity-0'
                        : 'max-h-[480px] translate-y-0 scale-100 opacity-100'
                    }`}
                  >
                    <RecommendationCard
                      recommendation={recommendation}
                      className={
                        highlightedDislikedIds.includes(recommendation.foodId)
                          ? 'ring-2 ring-rose-200'
                          : ''
                      }
                      isFavorite={isFavorite?.(recommendation.foodId)}
                      preference={getCurrentPreference(recommendation)}
                      onToggleFavorite={toggleFavorite}
                      onLike={(item) => handleFeedback(item, 'liked')}
                      onDislike={(item) => handleFeedback(item, 'disliked')}
                      onSave={handleAddFood}
                    />
                  </div>
                ))
              : null}
          </div>
        </div>

        {showInlineToast ? (
          <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-[340px] -translate-x-1/2 animate-toast-slide-in">
            <div className="toast-success flex min-w-[280px] items-center gap-2 rounded-xl px-4 py-3 shadow-lg">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium" role="status" aria-live="polite">
                {toastMessage}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
