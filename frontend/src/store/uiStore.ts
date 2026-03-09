import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface UIState {
  toasts: Toast[];
  activeModal: string | null;
  modalProps: Record<string, unknown>;
  isLoading: boolean;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  openModal: (name: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  isModalOpen: (name: string) => boolean;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      toasts: [],
      activeModal: null,
      modalProps: {},
      isLoading: false,
      addToast: (toast) => {
        const id = `toast-${Date.now()}`;
        const nextToast: Toast = { ...toast, id };
        set((state) => ({ toasts: [...state.toasts, nextToast] }));

        const duration = toast.duration ?? 3000;
        setTimeout(() => get().removeToast(id), duration);
      },
      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
      clearToasts: () => set({ toasts: [] }),
      openModal: (name, props = {}) => set({ activeModal: name, modalProps: props }),
      closeModal: () => set({ activeModal: null, modalProps: {} }),
      isModalOpen: (name) => get().activeModal === name,
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    { name: 'UIStore' },
  ),
);
