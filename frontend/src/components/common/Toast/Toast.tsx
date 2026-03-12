import { toast, Toaster } from 'sonner';

export interface ToastProps {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  richColors?: boolean;
}

export function Toast(props: ToastProps) {
  return <Toaster closeButton richColors position="top-center" {...props} />;
}

export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast(message),
};
