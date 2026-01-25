import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError } from '@/types/auth.types';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
    timeout: 30000, // 30 seconds
    withCredentials: true,
});

// Request interceptor - Add auth token if available
apiClient.interceptors.request.use(
    (config) => {
        // Get token from sessionStorage or localStorage
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('AU/@/#/TO/#/VA') || sessionStorage.getItem('AU/@/#/TO/#/VA')
            : null;

        if (token && token !== 'branch-authenticated' && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: AxiosError) => {
        // Create a user-friendly error object
        const apiError: ApiError = {
            message: 'An unexpected error occurred',
            statusCode: error.response?.status,
        };

        if (error.response) {
            // Server responded with error status
            const data = error.response.data as any;

            // Extract the most relevant error message
            apiError.message = data?.message ||
                data?.error ||
                data?.ResponseMessage ||
                data?.Data?.ResponseMessage ||
                error.message;

            apiError.errors = data?.errors;

            // Handle specific status codes
            switch (error.response.status) {
                case 401:
                    // Unauthorized - clear auth data and redirect to login
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('brUd/APtiypx/sw7lu83P7A==');
                        sessionStorage.removeItem('AU/@/#/TO/#/VA');
                        // Only redirect if not already on login page
                        if (!window.location.pathname.includes('/login')) {
                            window.location.href = '/login';
                        }
                    }
                    apiError.message = 'Session expired. Please login again.';
                    break;
                case 403:
                    apiError.message = 'You do not have permission to perform this action.';
                    break;
            }
        } else if (error.request) {
            // Request made but no response received
            apiError.message = 'Network error. Please check your connection.';
        }

        // Return a Promise REJECTION that is handled by the caller without triggering dev overlays
        return Promise.reject(apiError);
    }
);

// API helper methods
export const api = {
    get: <T = any>(url: string, config?: AxiosRequestConfig) =>
        apiClient.get<T>(url, config),

    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
        apiClient.post<T>(url, data, config),

    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
        apiClient.put<T>(url, data, config),

    delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
        apiClient.delete<T>(url, config),

    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
        apiClient.patch<T>(url, data, config),
};

export default apiClient;
