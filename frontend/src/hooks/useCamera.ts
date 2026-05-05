import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraPermissionState = 'idle' | 'prompt' | 'granted' | 'denied' | 'unsupported';

interface UseCameraOptions {
  constraints?: MediaStreamConstraints;
  autoStart?: boolean;
}

interface UseCameraResult {
  error: string | null;
  isActive: boolean;
  permission: CameraPermissionState;
  startCamera: () => Promise<MediaStream | null>;
  stopCamera: () => void;
  stream: MediaStream | null;
}

const defaultConstraints: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: 'environment' },
  },
};

export function useCamera(options: UseCameraOptions = {}): UseCameraResult {
  const { constraints = defaultConstraints, autoStart = false } = options;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permission, setPermission] = useState<CameraPermissionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission('unsupported');
      setError('이 브라우저는 카메라 접근을 지원하지 않습니다.');
      return null;
    }

    setPermission('prompt');
    setError(null);

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = nextStream;
      setStream(nextStream);
      setPermission('granted');
      return nextStream;
    } catch (requestError) {
      const nextError = requestError instanceof Error ? requestError.message : '카메라를 시작할 수 없습니다.';
      setPermission('denied');
      setError(nextError);
      stopCamera();
      return null;
    }
  }, [constraints, stopCamera]);

  useEffect(() => {
    if (autoStart) {
      void startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  return {
    error,
    isActive: stream !== null,
    permission,
    startCamera,
    stopCamera,
    stream,
  };
}
