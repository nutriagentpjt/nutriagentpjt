import { create } from 'zustand';

interface AuthState {
  userId: string | null;
  isAuthenticated: boolean;
  setUserId: (id: string | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  isAuthenticated: false,
  setUserId: (id) => set({ userId: id, isAuthenticated: id !== null }),
  clearUser: () => set({ userId: null, isAuthenticated: false }),
}));
