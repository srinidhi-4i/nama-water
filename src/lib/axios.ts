import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError } from '@/types/auth.types';

// Create axios instance with base configuration
// No baseURL needed - we're using Next.js API routes which are relative
// No default headers - let each request set its own (especially important for FormData)
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
            console.log(`axios: Sending Authorization header (Bearer ${token.substring(0, 10)}...)`);
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            const reason = !token ? 'No token found' : 'Placeholder token detected';
            console.log(`axios: ${reason}, NOT sending Authorization header`);
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
        console.log('API Response received:', response.status, response.statusText);
        return response;
    },
    (error: AxiosError) => {
        const errorDetails = {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                baseURL: error.config?.baseURL,
            }
        };

        console.error('Axios Error Details:', errorDetails);

        const apiError: ApiError = {
            message: 'An unexpected error occurred',
            statusCode: error.response?.status,
        };

        if (error.response) {
            // Server responded with error status
            const data = error.response.data as any;

            apiError.message = data?.message || data?.error || error.message;
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
                case 404:
                    apiError.message = 'The requested resource was not found.';
                    break;
                case 500:
                    apiError.message = 'Server error. Please try again later.';
                    break;
            }
        } else if (error.request) {
            // Request made but no response received - likely CORS or network issue
            console.error('No response received. Possible CORS issue or network error.');
            console.error('Request details:', error.request);
            apiError.message = 'Network error. This might be a CORS issue. Please check if the UAT server allows requests from localhost:3000';
        }

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
