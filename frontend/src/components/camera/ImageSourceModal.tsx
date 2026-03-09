import { Camera, Image as ImageIcon } from 'lucide-react';

interface ImageSourceModalProps {
  isOpen: boolean;
  onCamera: () => void;
  onClose: () => void;
  onGallery: () => void;
}

export function ImageSourceModal({ isOpen, onCamera, onClose, onGallery }: ImageSourceModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5" onClick={onClose}>
      <div className="w-full max-w-[340px] rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <Camera className="h-7 w-7 text-green-500" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-gray-900">이미지 출처 선택</h3>
          <p className="mb-6 text-sm text-gray-600">
            음식을 인식할 이미지를 선택하세요.
            <br />
            <span className="text-xs text-gray-500">카메라 및 갤러리 권한이 필요합니다.</span>
          </p>
          <div className="flex w-full gap-2.5">
            <button
              type="button"
              onClick={onCamera}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-colors active:bg-gray-200"
            >
              <Camera className="h-5 w-5" />
              <span>카메라</span>
            </button>
            <button
              type="button"
              onClick={onGallery}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-green-500 px-4 py-3 text-sm font-medium text-white transition-colors active:bg-green-600"
            >
              <ImageIcon className="h-5 w-5" />
              <span>갤러리</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
