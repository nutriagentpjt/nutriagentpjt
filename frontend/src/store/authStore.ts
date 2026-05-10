import { create } from 'zustand';
import type { AuthenticatedUser, AuthMode, GoogleAuthIntentSource } from '@/services/authService';

interface AuthState {
  authMode: AuthMode;
  guestId: string | null;
  user: AuthenticatedUser | null;
  lastGoogleLinkingSource: GoogleAuthIntentSource | null;
  isAuthenticated: boolean;
  isLinking: boolean;
  beginGoogleLinking: (source: GoogleAuthIntentSource) => void;
  setGuestSession: (guestId: string | null) => void;
  setAuthenticatedUser: (user: AuthenticatedUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  authMode: 'guest',
  guestId: null,
  user: null,
  lastGoogleLinkingSource: null,
  isAuthenticated: false,
  isLinking: false,
  beginGoogleLinking: (source) =>
    set((state) => ({
      ...state,
      authMode: 'linking',
      lastGoogleLinkingSource: source,
      isLinking: true,
    })),
  setGuestSession: (guestId) =>
    set({
      authMode: 'guest',
      guestId,
      user: null,
      lastGoogleLinkingSource: null,
      isAuthenticated: false,
      isLinking: false,
    }),
  setAuthenticatedUser: (user) =>
    set({
      authMode: 'authenticated',
      guestId: null,
      user,
      lastGoogleLinkingSource: null,
      isAuthenticated: true,
      isLinking: false,
    }),
  clearAuth: () =>
    set({
      authMode: 'guest',
      guestId: null,
      user: null,
      lastGoogleLinkingSource: null,
      isAuthenticated: false,
      isLinking: false,
    }),
}));
