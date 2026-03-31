import { Check, RotateCcw } from 'lucide-react';

interface ImagePreviewProps {
  className?: string;
  image: string;
  onConfirm: () => void;
  onRetake: () => void;
}

export function ImagePreview({ className, image, onConfirm, onRetake }: ImagePreviewProps) {
  return (
    <div className={className}>
      <div className="overflow-hidden rounded-2xl bg-gray-100">
        <img
          src={image}
          alt="촬영한 음식 이미지 미리보기"
          loading="lazy"
          decoding="async"
          className="aspect-[3/4] w-full object-cover"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" onClick={onRetake} className="btn btn-ghost flex-1">
          <RotateCcw className="h-4 w-4" />
          다시 촬영
        </button>
        <button type="button" onClick={onConfirm} className="btn btn-primary flex-1">
          <Check className="h-4 w-4" />
          확인
        </button>
      </div>
    </div>
  );
}
