import type { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { Toast } from '@/components/common';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      {children}
      <Toast />
    </QueryProvider>
  );
}
