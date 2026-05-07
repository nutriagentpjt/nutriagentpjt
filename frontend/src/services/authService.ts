import {
  ACCESS_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  GOOGLE_AUTH_INTENT_STORAGE_KEY,
  getAccessToken,
  removeAccessToken,
} from '@/utils/auth';

export type AuthMode = 'guest' | 'linking' | 'authenticated';
export type GoogleAuthIntentSource = 'existing-account-login' | 'post-onboarding-link';

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  name?: string | null;
  provider: 'google';
}

export interface GoogleAuthIntent {
  source: GoogleAuthIntentSource;
  returnTo: string;
  createdAt: string;
}

type StartGoogleAuthResult =
  | { status: 'redirected' }
  | { status: 'unavailable' };

function getConfiguredGoogleAuthUrl() {
  return (import.meta.env.VITE_GOOGLE_AUTH_URL as string | undefined)?.trim() ?? '';
}

function readStoredAuthenticatedUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthenticatedUser;
  } catch {
    return null;
  }
}

function writeStoredAuthenticatedUser(user: AuthenticatedUser) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

function writePendingGoogleAuthIntent(intent: GoogleAuthIntent) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(GOOGLE_AUTH_INTENT_STORAGE_KEY, JSON.stringify(intent));
}

export const authService = {
  getStoredAuthenticatedUser: readStoredAuthenticatedUser,

  getStoredGoogleAuthIntent() {
    if (typeof window === 'undefined') {
      return null;
    }

    const raw = window.localStorage.getItem(GOOGLE_AUTH_INTENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as GoogleAuthIntent;
    } catch {
      return null;
    }
  },

  clearPendingGoogleAuthIntent() {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(GOOGLE_AUTH_INTENT_STORAGE_KEY);
  },

  storeAuthenticatedUser(user: AuthenticatedUser) {
    writeStoredAuthenticatedUser(user);
  },

  clearAuthenticatedSession() {
    if (typeof window === 'undefined') {
      return;
    }

    removeAccessToken();
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    window.localStorage.removeItem(GOOGLE_AUTH_INTENT_STORAGE_KEY);
  },

  restoreSession() {
    const accessToken = getAccessToken();
    const user = readStoredAuthenticatedUser();

    if (!accessToken || !user) {
      return { mode: 'guest' as const };
    }

    return {
      mode: 'authenticated' as const,
      user,
    };
  },

  hasGoogleAuthConfiguration() {
    return getConfiguredGoogleAuthUrl().length > 0;
  },

  startGoogleAuthFlow({
    source,
    returnTo,
  }: {
    source: GoogleAuthIntentSource;
    returnTo: string;
  }): StartGoogleAuthResult {
    const authUrl = getConfiguredGoogleAuthUrl();

    if (!authUrl || typeof window === 'undefined') {
      return { status: 'unavailable' };
    }

    const redirectUrl = new URL(authUrl);
    redirectUrl.searchParams.set('returnTo', returnTo);
    redirectUrl.searchParams.set('source', source);

    writePendingGoogleAuthIntent({
      source,
      returnTo,
      createdAt: new Date().toISOString(),
    });

    window.location.assign(redirectUrl.toString());
    return { status: 'redirected' };
  },
};

export function isAuthenticatedUser(user: AuthenticatedUser | null): user is AuthenticatedUser {
  return Boolean(user?.id);
}

export function hasStoredAuthenticatedSession() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) && window.localStorage.getItem(AUTH_USER_STORAGE_KEY));
}
