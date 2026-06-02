import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { showToast } from '@/components/common/Toast/Toast';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store';
import { getOnboardingAccessBlockMessage, hasCompleteOnboardingProfile } from '@/utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCompleted = hasCompleteOnboardingProfile();

  useEffect(() => {
    if (!isCompleted && !isAuthenticated) {
      showToast.info(getOnboardingAccessBlockMessage());
    }
  }, [isAuthenticated, isCompleted]);

  if (!isCompleted && !isAuthenticated) {
    return <Navigate to={ROUTES.ONBOARDING_WELCOME} replace />;
  }

  return <>{children}</>;
}
