import { Camera, RefreshCw } from 'lucide-react';
import { useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { useCamera } from '@/hooks';

interface CameraCaptureProps {
  className?: string;
  onCapture: (imageDataUrl: string) => void;
  onCancel?: () => void;
  onError?: (message: string) => void;
}

export function CameraCapture({ className, onCapture, onCancel, onError }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam | null>(null);
  const { error, permission, startCamera } = useCamera();

  useEffect(() => {
    void startCamera();
  }, [startCamera]);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const handleCapture = () => {
    const screenshot = webcamRef.current?.getScreenshot();

    if (screenshot) {
      onCapture(screenshot);
      return;
    }

    onError?.('이미지를 캡처하지 못했습니다.');
  };

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-2xl bg-black">
        <Webcam
          ref={webcamRef}
          audio={false}
          className="aspect-[3/4] w-full object-cover"
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: { ideal: 'environment' } }}
        />
        {permission !== 'granted' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-6 text-center text-sm text-white">
            카메라 권한을 확인하고 있습니다.
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" onClick={onCancel} className="btn btn-ghost flex-1">
          취소
        </button>
        <button type="button" onClick={() => void startCamera()} className="btn btn-ghost">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button type="button" onClick={handleCapture} className="btn btn-primary flex-1">
          <Camera className="h-4 w-4" />
          촬영
        </button>
      </div>
    </div>
  );
}
