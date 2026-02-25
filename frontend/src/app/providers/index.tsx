import { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * 모든 Provider를 통합하는 컴포넌트
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}
