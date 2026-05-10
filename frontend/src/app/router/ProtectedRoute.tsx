import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCompleted =
    typeof window !== 'undefined' &&
    window.localStorage.getItem('onboardingComplete') === 'true' &&
    !!window.localStorage.getItem('userProfile');

  if (!isCompleted && !isAuthenticated) {
    return <Navigate to={ROUTES.ONBOARDING_WELCOME} replace />;
  }

  return <>{children}</>;
}
