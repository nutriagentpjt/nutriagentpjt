import axios, { AxiosError } from 'axios';
import type { ApiError } from '@/types';
import { getAccessToken } from '@/utils/auth';
import { GUEST_ID_STORAGE_KEY } from './sessionService';

export const apiBaseUrl = import.meta.env.VITE_API_URL as string;
const apiProxyBaseUrl = '/__api_proxy__';

const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? apiProxyBaseUrl : apiBaseUrl,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const accessToken = getAccessToken();

      if (accessToken) {
        config.headers.set('Authorization', `Bearer ${accessToken}`);
        config.headers.delete('X-Guest-Id');
      } else {
        const guestId = window.localStorage.getItem(GUEST_ID_STORAGE_KEY);
        if (guestId) {
          config.headers.set('X-Guest-Id', guestId);
        }
      }
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: 'Unexpected error occurred',
      code: error.code,
    };

    if (error.response) {
      apiError.status = error.response.status;
      apiError.data = error.response.data;

      switch (error.response.status) {
        case 401:
          apiError.message = 'Unauthorized';
          break;
        case 403:
          apiError.message = 'Forbidden';
          break;
        case 404:
          apiError.message = 'Not Found';
          break;
        case 500:
          apiError.message = 'Server Error';
          break;
        default:
          apiError.message = 'API Error';
      }
    } else if (error.request) {
      apiError.message = 'No response from server';
    } else {
      apiError.message = error.message;
    }

    return Promise.reject(apiError);
  },
);

export default apiClient;
