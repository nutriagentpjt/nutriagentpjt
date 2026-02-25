import { useUIStore } from '../store';

/**
 * Toast 메시지 훅
 */
export function useToast() {
  const { addToast, removeToast, toasts } = useUIStore();
  
  return {
    toasts,
    showToast: addToast,
    hideToast: removeToast,
    success: (message: string, duration?: number) => 
      addToast({ message, type: 'success', duration }),
    error: (message: string, duration?: number) => 
      addToast({ message, type: 'error', duration }),
    info: (message: string, duration?: number) => 
      addToast({ message, type: 'info', duration }),
    warning: (message: string, duration?: number) => 
      addToast({ message, type: 'warning', duration }),
  };
}
