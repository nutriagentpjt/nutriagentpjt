import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isCompleted =
    typeof window !== 'undefined' &&
    window.localStorage.getItem('onboardingComplete') === 'true' &&
    !!window.localStorage.getItem('userProfile');

  if (!isCompleted) {
    return <Navigate to={ROUTES.ONBOARDING_WELCOME} replace />;
  }

  return <>{children}</>;
}
