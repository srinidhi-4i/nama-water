import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Create axios instance for DIRECT UAT API calls (bypassing Next.js proxy)
// This is needed for cookie-based authentication to work properly
const uatClient: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_UAT_BASE_URL || 'https://eservicesuat.nws.nama.om:444',
    timeout: 30000, // 30 seconds
    withCredentials: true, // CRITICAL: Send and receive cookies from UAT
    headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
    }
});

// API helper methods for direct UAT calls
export const uatApi = {
    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
        uatClient.post<T>(url, data, config),

    get: <T = any>(url: string, config?: AxiosRequestConfig) =>
        uatClient.get<T>(url, config),
};

export default uatClient;
