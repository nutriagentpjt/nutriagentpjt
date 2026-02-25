import { create } from 'zustand';

interface AuthState {
    userId: number | null;

    setUserId: (id: number) => void;
    clearUser: () => void;
}

/**
 * 로그인 사용자 정보 관리
 * 현재 임시 userId = 1 사용
 */
export const useAuthStore = create<AuthState>((set) => ({
    userId: 1, // 임시 기본값 (로그인 추가 후 null로 변경)

    setUserId: (id) => set({ userId: id }),
    clearUser: () => set({ userId: null }),
}));