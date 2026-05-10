export const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';
export const AUTH_USER_STORAGE_KEY = 'authenticatedUser';
export const GOOGLE_AUTH_INTENT_STORAGE_KEY = 'pendingGoogleAuthIntent';

export const getAccessToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
};

export const setAccessToken = (accessToken: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
};

export const removeAccessToken = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
};
