import { AlertCircle, Check, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ImagePreviewProps {
  className?: string;
  image: string;
  imageType?: string;
  onConfirm: () => void;
  onRetake: () => void;
}

export function ImagePreview({ className, image, imageType, onConfirm, onRetake }: ImagePreviewProps) {
  const [hasPreviewError, setHasPreviewError] = useState(false);

  useEffect(() => {
    setHasPreviewError(false);
  }, [image]);

  const isHighEfficiencyImage =
    imageType === 'image/heic' ||
    imageType === 'image/heif' ||
    imageType === 'image/heic-sequence' ||
    imageType === 'image/heif-sequence';

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-2xl bg-gray-100">
        {hasPreviewError ? (
          <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 bg-gray-100 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-gray-800">미리보기를 표시할 수 없어요.</p>
              <p className="text-sm leading-relaxed text-gray-500">
                {isHighEfficiencyImage
                  ? '이 기기 브라우저에서 HEIC/HEIF 이미지를 바로 표시하지 못할 수 있어요. 그래도 분석은 계속 진행할 수 있어요.'
                  : '선택한 이미지를 이 브라우저에서 바로 표시하지 못하고 있어요. 그래도 분석은 계속 진행할 수 있어요.'}
              </p>
            </div>
          </div>
        ) : (
          <img
            src={image}
            alt="촬영한 음식 이미지 미리보기"
            loading="lazy"
            decoding="async"
            onError={() => setHasPreviewError(true)}
            className="aspect-[3/4] w-full object-cover"
          />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onRetake}
          className="btn btn-ghost flex-1 border border-gray-200 bg-white hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" />
          다시 촬영하기
        </button>
        <button type="button" onClick={onConfirm} className="btn btn-primary flex-1">
          <Check className="h-4 w-4" />
          확인
        </button>
      </div>
    </div>
  );
}
