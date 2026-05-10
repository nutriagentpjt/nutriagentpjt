import { useEffect, useState, type ReactNode } from 'react';
import { authService } from '@/services/authService';
import { sessionService } from '@/services/sessionService';
import { useAuthStore } from '@/store';

interface SessionBootstrapProps {
  children: ReactNode;
}

export function SessionBootstrap({ children }: SessionBootstrapProps) {
  const [isReady, setIsReady] = useState(false);
  const setGuestSession = useAuthStore((state) => state.setGuestSession);
  const setAuthenticatedUser = useAuthStore((state) => state.setAuthenticatedUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    let isCancelled = false;

    const bootstrap = async () => {
      try {
        const restoredSession = authService.restoreSession();

        if (restoredSession.mode === 'authenticated') {
          if (!isCancelled) {
            setAuthenticatedUser(restoredSession.user);
          }
          return;
        }

        const guestId = await sessionService.ensureSession();
        if (!isCancelled) {
          setGuestSession(guestId);
        }
      } catch {
        if (!isCancelled) {
          clearAuth();
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
  }, [clearAuth, setAuthenticatedUser, setGuestSession]);

  if (!isReady) {
    return <div className="min-h-screen bg-white" aria-hidden="true" />;
  }

  return <>{children}</>;
}
