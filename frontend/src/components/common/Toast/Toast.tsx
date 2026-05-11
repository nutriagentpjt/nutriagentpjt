import { useEffect } from 'react';
import { CircleX } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export interface ToastProps {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  richColors?: boolean;
}

export function Toast(props: ToastProps) {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      const clickedInsideToast = target.closest('[data-sonner-toaster], [data-sonner-toast]');
      if (clickedInsideToast) {
        return;
      }

      toast.dismiss();
    };

    window.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, []);

  return (
    <Toaster
      closeButton={false}
      richColors={false}
      position="bottom-center"
      offset={20}
      mobileOffset={20}
      icons={{
        error: <CircleX className="h-4.5 w-4.5 shrink-0 text-rose-500" />,
      }}
      toastOptions={{
        style: {
          borderRadius: '0.75rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          padding: '1rem 1.25rem',
          whiteSpace: 'pre-line',
        },
        classNames: {
          toast: 'border rounded-xl shadow-md',
          success: '!bg-green-50 !text-green-700 !border-green-200',
          error: '!bg-pink-50 !text-rose-600 !border-rose-300',
          info: '!bg-white !text-gray-700 !border-gray-200',
          icon: '!mr-3',
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
