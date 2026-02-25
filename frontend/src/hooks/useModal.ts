import { useUIStore } from '../store';

/**
 * Modal 관리 훅
 * @param modalId 모달 ID
 */
export function useModal(modalId: string) {
  const { openModal, closeModal, isModalOpen, modals } = useUIStore();
  
  return {
    isOpen: isModalOpen(modalId),
    data: modals[modalId]?.data,
    open: (data?: any) => openModal(modalId, data),
    close: () => closeModal(modalId),
  };
}
