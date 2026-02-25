import type { ApiError } from './types/api';

declare module '@tanstack/react-query' {
    interface Register {
        defaultError: ApiError;
    }
}