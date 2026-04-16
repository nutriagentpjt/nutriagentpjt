import type { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { SessionBootstrap } from './SessionBootstrap';
import { Toast } from '@/components/common';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <SessionBootstrap>
        {children}
        <Toast />
      </SessionBootstrap>
    </QueryProvider>
  );
}
