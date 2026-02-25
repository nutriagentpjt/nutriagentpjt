export interface ApiError {
    message: string;
    status?: number;
    data?: unknown;
}