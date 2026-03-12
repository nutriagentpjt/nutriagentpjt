import { create } from 'zustand';

interface AuthState {
  userId: number | null;
  isAuthenticated: boolean;
  setUserId: (id: number | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: 1,
  isAuthenticated: true,
  setUserId: (id) => set({ userId: id, isAuthenticated: id !== null }),
  clearUser: () => set({ userId: null, isAuthenticated: false }),
}));
