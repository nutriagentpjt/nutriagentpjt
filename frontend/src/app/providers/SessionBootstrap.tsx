import { useEffect, useState, type ReactNode } from 'react';
import { sessionService } from '@/services/sessionService';
import { useAuthStore } from '@/store';

interface SessionBootstrapProps {
  children: ReactNode;
}

export function SessionBootstrap({ children }: SessionBootstrapProps) {
  const [isReady, setIsReady] = useState(false);
  const setUserId = useAuthStore((state) => state.setUserId);
  const clearUser = useAuthStore((state) => state.clearUser);

  useEffect(() => {
    let isCancelled = false;

    const bootstrap = async () => {
      try {
        const guestId = await sessionService.ensureSession();
        if (!isCancelled) {
          setUserId(guestId);
        }
      } catch {
        if (!isCancelled) {
          clearUser();
        }
      } finally {
        if (!isCancelled) {
          setIsReady(true);
        }
      }
    };

    void bootstrap();

    return () => {
      isCancelled = true;
    };
  }, [clearUser, setUserId]);

  if (!isReady) {
    return <div className="min-h-screen bg-white" aria-hidden="true" />;
  }

  return <>{children}</>;
}
