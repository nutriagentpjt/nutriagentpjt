import { useUIStore } from '../store';

export function useModal(modalId: string) {
  const { openModal, closeModal, isModalOpen, modalProps } = useUIStore();

  return {
    isOpen: isModalOpen(modalId),
    data: isModalOpen(modalId) ? modalProps : undefined,
    open: (data?: Record<string, unknown>) => openModal(modalId, data),
    close: () => closeModal(),
  };
}
