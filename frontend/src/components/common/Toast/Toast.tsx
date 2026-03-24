import { toast, Toaster } from 'sonner';

export interface ToastProps {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  richColors?: boolean;
}

export function Toast(props: ToastProps) {
  return (
    <Toaster
      closeButton={false}
      richColors={false}
      position="bottom-center"
      offset={20}
      mobileOffset={20}
      toastOptions={{
        style: {
          background: '#f0fdf4',
          color: '#15803d',
          border: '1px solid #bbf7d0',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          padding: '1rem 1.25rem',
        },
      }}
      {...props}
    />
  );
}

export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast(message),
};
