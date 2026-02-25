import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/* =========================
   Toast Types
========================= */

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

/* =========================
   Modal Types
========================= */

export interface Modal<T = unknown> {
    id: string;
    isOpen: boolean;
    data?: T;
}

/* =========================
   UI State Interface
========================= */

interface UIState {
    /* -------------------------
       Toast Management
    -------------------------- */
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    clearToasts: () => void;

    /* -------------------------
       Modal Management
    -------------------------- */
    modals: Record<string, Modal>;
    openModal: <T = unknown>(id: string, data?: T) => void;
    closeModal: (id: string) => void;
    isModalOpen: (id: string) => boolean;

    /* -------------------------
       Global Loading
    -------------------------- */
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
}

/* =========================
   Store
========================= */

export const useUIStore = create<UIState>()(
    devtools(
        (set, get) => ({
            /* =========================
               Toast Logic
            ========================= */

            toasts: [],

            addToast: (toast) => {
                const id = `toast-${Date.now()}`;
                const newToast: Toast = { ...toast, id };

                set((state) => ({
                    toasts: [...state.toasts, newToast],
                }));

                // 자동 제거 (기본 3초)
                const duration = toast.duration ?? 3000;

                setTimeout(() => {
                    get().removeToast(id);
                }, duration);
            },

            removeToast: (id) =>
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                })),

            clearToasts: () => set({ toasts: [] }),

            /* =========================
               Modal Logic
            ========================= */

            modals: {},

            openModal: (id, data) => {
                set((state) => ({
                    modals: {
                        ...state.modals,
                        [id]: {
                            id,
                            isOpen: true,
                            data,
                        },
                    },
                }));
            },

            closeModal: (id) => {
                set((state) => ({
                    modals: {
                        ...state.modals,
                        [id]: {
                            ...state.modals[id],
                            isOpen: false,
                        },
                    },
                }));
            },

            isModalOpen: (id) => {
                return get().modals[id]?.isOpen ?? false;
            },

            /* =========================
               Global Loading
            ========================= */

            isLoading: false,

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'UIStore',
        }
    )
);