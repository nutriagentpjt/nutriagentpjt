import { AlertCircle, ChevronRight, Loader2, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePreview, ImageSourceModal } from '@/components/camera';
import { AddFoodModal } from '@/components/food';
import { ROUTES } from '@/constants/routes';
import { useImageUpload } from '@/hooks';
import { Header } from '@/layouts/Header';
import { useImageUploadStore } from '@/store';
import type { Food, MealImageRecognitionCandidate } from '@/types';
import { normalizeVisionImageFile } from '@/utils/imageFile';

function getConfidenceMeta(confidence?: number) {
  if (typeof confidence !== 'number') {
    return {
      badgeClass: 'bg-gray-100 text-gray-600',
      description: '신뢰도 정보 없음',
      label: '확인 필요',
    };
  }

  if (confidence >= 0.8) {
    return {
      badgeClass: 'bg-green-100 text-green-700',
      description: '높은 신뢰도로 인식되었습니다.',
      label: '높음',
    };
  }

  if (confidence >= 0.5) {
    return {
      badgeClass: 'bg-yellow-100 text-yellow-700',
      description: '이 음식이 맞나요?',
      label: '보통',
    };
  }

  return {
    badgeClass: 'bg-red-100 text-red-700',
    description: '인식 정확도가 낮아 다시 촬영하거나 다른 이미지를 권장합니다.',
    label: '낮음',
  };
}

function toFoodCandidate(candidate: MealImageRecognitionCandidate): Food {
  const fallbackServingSize = Number(candidate.servingSize ?? 100) || 100;

  return {
    id: candidate.id ?? candidate.name,
    name: candidate.name,
    brand: candidate.brand,
    servingSize: fallbackServingSize,
    weight: fallbackServingSize,
    servingUnit: candidate.servingUnit || 'g',
    calories: candidate.calories ?? 0,
    carbs: candidate.carbs ?? 0,
    protein: candidate.protein ?? 0,
    fat: candidate.fat ?? 0,
  };
}

export default function ImageUploadPage() {
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const didSaveFromAddFoodModalRef = useRef(false);
  const clearSelectedFile = useImageUploadStore((state) => state.clearSelectedFile);
  const selectedFile = useImageUploadStore((state) => state.selectedFile);
  const setSelectedFile = useImageUploadStore((state) => state.setSelectedFile);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [activeFood, setActiveFood] = useState<Food | null>(null);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const imageUpload = useImageUpload();

  useEffect(() => {
    if (!selectedFile) {
      navigate(-1);
      return;
    }

    let isCancelled = false;
    let nextPreviewUrl: string | null = null;

    const preparePreview = async () => {
      setIsPreparingImage(true);
      setPreviewUrl(null);

      try {
        const normalizedFile = await normalizeVisionImageFile(selectedFile);

        if (isCancelled) {
          return;
        }

        if (normalizedFile !== selectedFile) {
          setSelectedFile(normalizedFile);
          return;
        }

        nextPreviewUrl = URL.createObjectURL(selectedFile);

        if (isCancelled) {
          URL.revokeObjectURL(nextPreviewUrl);
          return;
        }

        setPreviewUrl(nextPreviewUrl);
      } catch {
        if (!isCancelled) {
          setErrorMessage('이 이미지 형식은 이 기기에서 바로 처리하기 어려워요. JPEG 또는 PNG 이미지로 다시 시도해주세요.');
        }
      } finally {
        if (!isCancelled) {
          setIsPreparingImage(false);
        }
      }
    };

    void preparePreview();

    return () => {
      isCancelled = true;

      if (nextPreviewUrl) {
        URL.revokeObjectURL(nextPreviewUrl);
      }
    };
  }, [navigate, selectedFile, setSelectedFile]);

  const recognizedFoods = imageUpload.data?.recognizedFoods ?? [];
  const topCandidate = recognizedFoods[0] ?? null;
  const confidenceMeta = useMemo(() => getConfidenceMeta(topCandidate?.confidence), [topCandidate?.confidence]);

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setErrorMessage('먼저 이미지를 선택해주세요.');
      return;
    }

    try {
      const response = await imageUpload.mutateAsync({ file: selectedFile });

      if (!response.recognizedFoods.length) {
        setErrorMessage('이미지 분석 중 오류가 발생했습니다.');
        return;
      }

      setShowResultModal(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '이미지 분석 중 오류가 발생했습니다.');
    }
  };

  const handleBack = () => {
    clearSelectedFile();
    navigate(-1);
  };

  const handleUseResult = (candidate: MealImageRecognitionCandidate) => {
    setActiveFood(toFoodCandidate(candidate));
    setShowResultModal(false);
    setShowAddFoodModal(true);
  };

  const handleRetrySelection = () => {
    setErrorMessage(null);
    setShowResultModal(false);
    imageUpload.reset();
    setIsSourceModalOpen(true);
  };

  const handleNewFileSelected = (file?: File) => {
    setIsSourceModalOpen(false);

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setShowResultModal(false);
    imageUpload.reset();
  };

  const handleDirectSearch = () => {
    clearSelectedFile();
    navigate(ROUTES.HOME, {
      replace: true,
      state: {
        focusSearch: true,
      },
    });
  };

  if (!selectedFile) {
    return null;
  }

  return (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          handleNewFileSelected(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleNewFileSelected(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      <div className="min-h-full bg-background">
        <Header
          title="이미지 업로드"
          rightSlot={
            <button
              type="button"
              onClick={handleBack}
              className="icon-button"
              aria-label="뒤로 가기"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          }
        />

        <div className="px-5 py-5">
          <p className="mb-4 text-sm text-gray-500">촬영/업로드된 이미지를 분석할 수 있어요.</p>

          {previewUrl ? (
            <ImagePreview
              image={previewUrl}
              imageType={selectedFile.type}
              onConfirm={handleAnalyze}
              onRetake={handleRetrySelection}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 bg-gray-50 px-6 text-center">
                {isPreparingImage ? (
                  <>
                    <Loader2 className="h-10 w-10 animate-spin text-green-500" />
                    <div className="space-y-1.5">
                      <p className="text-base font-semibold text-gray-900">이미지를 준비하고 있어요.</p>
                      <p className="text-sm leading-relaxed text-gray-500">촬영한 사진을 분석하기 쉬운 크기와 형식으로 맞추고 있어요.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-10 w-10 text-gray-400" />
                    <div className="space-y-1.5">
                      <p className="text-base font-semibold text-gray-900">이미지를 미리볼 수 없어요.</p>
                      <p className="text-sm leading-relaxed text-gray-500">다른 이미지를 선택하거나 다시 촬영해보세요.</p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 p-4 pt-0">
                <button
                  type="button"
                  onClick={handleRetrySelection}
                  className="btn btn-ghost flex-1 border border-gray-200 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                  다시 선택
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {imageUpload.isPending ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80 px-5 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-500" />
          <div>
            <p className="text-base font-semibold text-white">음식 분석 중...</p>
            <p className="mt-1 text-sm text-white/70">AI가 이미지를 분석하고 있습니다.</p>
          </div>
        </div>
      ) : null}

      <ImageSourceModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        onCamera={() => cameraInputRef.current?.click()}
        onGallery={() => galleryInputRef.current?.click()}
      />

      {showResultModal && topCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5" onClick={() => setShowResultModal(false)}>
          <div className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">이미지 분석 결과</h3>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${confidenceMeta.badgeClass}`}>
                정확도 {confidenceMeta.label}
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">{topCandidate.name}</p>
              {topCandidate.brand ? <p className="mt-1 text-xs text-gray-500">{topCandidate.brand}</p> : null}
              <p className="mt-3 text-xs text-gray-500">{confidenceMeta.description}</p>
            </div>

            {recognizedFoods.length > 1 ? (
              <div className="mt-4 space-y-2">
                <p className="px-1 text-xs font-medium text-gray-500">혹은 다음으로 검색하기</p>
                {recognizedFoods.slice(1, 4).map((candidate, index) => (
                  <button
                    key={`${candidate.name}-${index}`}
                    type="button"
                    onClick={() => handleUseResult(candidate)}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-3 py-3 text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{candidate.name}</p>
                      {candidate.brand ? <p className="text-xs text-gray-500">{candidate.brand}</p> : null}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setShowResultModal(false)} className="btn btn-ghost flex-1">
                닫기
              </button>
              <button
                type="button"
                onClick={() => handleUseResult(topCandidate)}
                className="btn btn-primary flex-1"
              >
                <Search className="h-4 w-4" />
                선택
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AddFoodModal
        food={activeFood}
        isOpen={showAddFoodModal}
        onClose={() => {
          setShowAddFoodModal(false);
          setActiveFood(null);

          if (didSaveFromAddFoodModalRef.current) {
            didSaveFromAddFoodModalRef.current = false;
            return;
          }

          setShowResultModal(true);
        }}
        onSaved={() => {
          didSaveFromAddFoodModalRef.current = true;
          clearSelectedFile();
          setShowAddFoodModal(false);
          setActiveFood(null);
        }}
        redirectTo={ROUTES.HOME}
      />

      {errorMessage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5" onClick={() => setErrorMessage(null)}>
          <div className="w-full max-w-[340px] rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">이미지 처리 실패</h3>
              <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
              <div className="mt-6 flex w-full gap-2.5">
                <button
                  type="button"
                  onClick={handleDirectSearch}
                  className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700"
                >
                  직접 검색하기
                </button>
                <button
                  type="button"
                  onClick={handleRetrySelection}
                  className="flex-1 rounded-xl bg-green-500 px-4 py-3 text-sm font-medium text-white"
                >
                  다시 선택
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
