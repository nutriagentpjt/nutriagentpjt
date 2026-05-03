import api from './api';

export const GUEST_ID_STORAGE_KEY = 'guestId';

function readStoredGuestId() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(GUEST_ID_STORAGE_KEY);
}

function writeStoredGuestId(guestId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(GUEST_ID_STORAGE_KEY, guestId);
}

export const sessionService = {
  getStoredGuestId: readStoredGuestId,

  clearStoredGuestId() {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(GUEST_ID_STORAGE_KEY);
  },

  async issueGuestSession(): Promise<string> {
    const response = await api.post<string>('/guest/session');
    writeStoredGuestId(response.data);
    return response.data;
  },

  async renewSession(guestId: string): Promise<void> {
    await api.post('/renew/session', { guestId });
  },

  async ensureSession(): Promise<string> {
    const storedGuestId = readStoredGuestId();

    if (storedGuestId) {
      try {
        await this.renewSession(storedGuestId);
        return storedGuestId;
      } catch {
        this.clearStoredGuestId();
      }
    }

    return this.issueGuestSession();
  },
};
