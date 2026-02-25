import axios, {
    AxiosInstance,
    AxiosError,
    InternalAxiosRequestConfig,
} from 'axios';
import type { ApiError } from '@types/api';
import { getAccessToken, removeAccessToken } from '@utils/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 🔹 Request Interceptor
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (import.meta.env.DEV) {
            console.log('🚀 API Request:', {
                method: config.method?.toUpperCase(),
                url: config.url,
            });
        }

        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// 🔹 Response Interceptor
api.interceptors.response.use(
    (response) => {
        if (import.meta.env.DEV) {
            console.log('✅ API Response:', {
                url: response.config.url,
                status: response.status,
            });
        }
        return response;
    },
    (error: AxiosError): Promise<ApiError> => {
        const apiError: ApiError = {
            message: 'Unexpected error occurred',
        };

        if (error.response) {
            apiError.status = error.response.status;
            apiError.data = error.response.data;

            switch (error.response.status) {
                case 401:
                    removeAccessToken();
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
    }
);

export default api;