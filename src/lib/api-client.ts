import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiResponse } from '@/types'

class ApiClient {
    private client: AxiosInstance

    constructor() {
        this.client = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        })

        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                // You can add auth tokens here if needed
                return config
            },
            (error) => {
                return Promise.reject(error)
            }
        )

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => this.handleResponse(response),
            (error) => this.handleError(error)
        )
    }

    private handleResponse<T>(response: AxiosResponse<ApiResponse<T>>): any {
        const { data } = response

        if (!data) {
            throw new Error('No data received from server')
        }

        // Handle different status codes based on the React app pattern
        switch (data.StatusCode) {
            case 605: // Success
                return data.Data

            case 604: // Session timeout / Unauthorized
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('wcb/APtiypx/sw7lu83P7A==')
                    sessionStorage.removeItem('v!s#c')
                    localStorage.clear()
                    window.location.href = '/login'
                }
                throw new Error('Session expired. Please login again.')

            case 606: // Failed
                throw new Error(data.Message || 'Request failed')

            case 601: // Mandatory data missing
                throw new Error('Mandatory data missing')

            case 612: // Branch login session timeout
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('brUd/APtiypx/sw7lu83P7A==')
                    localStorage.removeItem('wcb/APtiypx/sw7lu83P7A==')
                    localStorage.clear()
                    window.location.href = '/login'
                }
                throw new Error('Session expired. Please login again.')

            case 613: // Insufficient data
                throw new Error('Insufficient data provided')

            case 1010: // Invalid outstanding amount
            case 1011: // Custom error
            case 1014: // Custom error
                throw new Error(String(data.Data) || data.Message || 'An error occurred')

            case 1012: // Timeout
            case 408: // Request timeout
                throw new Error('Request timeout. Please try again.')

            case 2020: // Payment validation error
                throw new Error('Payment amount must be greater than zero')

            default:
                // For unknown status codes, return the data if available
                if (data.Data) {
                    return data.Data
                }
                throw new Error(data.Message || 'An unexpected error occurred')
        }
    }

    private handleError(error: any): Promise<never> {
        // Safely log error details
        try {
            console.error('API Error Details:', {
                url: error?.config?.url || 'unknown',
                method: error?.config?.method || 'unknown',
                status: error?.response?.status || 'no status',
                statusText: error?.response?.statusText || 'no status text',
                data: error?.response?.data || 'no data',
                message: error?.message || 'no message',
                errorType: error?.name || 'unknown error type'
            })
        } catch (logError) {
            console.error('Error logging failed:', logError)
        }

        if (error?.response) {
            // Server responded with error status
            const status = error.response.status
            const data = error.response.data

            // Handle different HTTP status codes
            if (status === 401 || status === 403) {
                // Unauthorized - redirect to login
                if (typeof window !== 'undefined') {
                    localStorage.clear()
                    sessionStorage.clear()
                    window.location.href = '/login'
                }
                return Promise.reject(new Error('Session expired. Please login again.'))
            }

            // Try to extract meaningful error message
            const message = data?.Message || data?.message || error.response.statusText || `Server error (${status})`
            return Promise.reject(new Error(message))
        } else if (error?.request) {
            // Request made but no response
            console.error('No response received from server')
            return Promise.reject(new Error('No response from server. Please check your connection.'))
        } else if (error instanceof Error) {
            // Standard JavaScript error
            return Promise.reject(error)
        } else {
            // Unknown error type
            console.error('Unknown error type:', error)
            return Promise.reject(new Error('An unexpected error occurred'))
        }
    }

    // GET request
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.client.get(url, config)
    }

    // POST request with FormData (matching React app pattern)
    async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        // Convert data to FormData if it's an object
        let formData = data
        if (data && !(data instanceof FormData)) {
            formData = new FormData()
            Object.keys(data).forEach(key => {
                formData.append(key, data[key])
            })
        }

        return this.client.post(url, formData, {
            ...config,
            headers: {
                'Content-Type': 'multipart/form-data',
                ...config?.headers,
            },
        })
    }

    // POST request with JSON (for cases where JSON is needed)
    async postJSON<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.client.post(url, data, config)
    }

    // PUT request
    async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.client.put(url, data, config)
    }

    // DELETE request
    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.client.delete(url, config)
    }

    // Simple API call without data (matching React app getAPIResponse pattern)
    async simplePost<T>(url: string): Promise<T> {
        // Create an empty FormData object to properly generate the multipart boundary
        const formData = new FormData()
        return this.client.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    }
}

// Export singleton instance
export const apiClient = new ApiClient()
