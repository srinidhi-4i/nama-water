import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiResponse } from '@/types'

class ApiClient {
    private client: AxiosInstance

    constructor() {
        this.client = axios.create({
            // No baseURL - use relative URLs to leverage Next.js rewrites in next.config.ts
            withCredentials: true,
            headers: {},
        })

        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                // Add auth token
                if (typeof window !== 'undefined') {
                    try {
                        const token = localStorage.getItem('AU/@/#/TO/#/VA') || sessionStorage.getItem('AU/@/#/TO/#/VA')
                        if (token && token !== 'branch-authenticated') {
                            config.headers.Authorization = `Bearer ${token}`
                        }
                    } catch (error) {
                        // Silent fail for token retrieval to avoid dev overlays
                    }
                }
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

        // Standardize behavior: extract message and throw a simplified Error
        // This Error will be caught by the component and shown as a toast.

        switch (data.StatusCode) {
            case 605: // Success
                return data.Data

            case 604: // Session timeout
            case 612: // Branch login session timeout
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('AU/@/#/TO/#/VA')
                    localStorage.removeItem('brUd/APtiypx/sw7lu83P7A==')
                }
                throw new Error('Session expired. Please login again.')

            case 606: // Failed
                throw new Error(data.Message || data.Data?.toString() || 'Request failed')

            case 601: // Mandatory data missing
                throw new Error('Mandatory data missing')

            case 613: // Insufficient data
                throw new Error('Insufficient data provided')

            default:
                if (data.Data && data.StatusCode === undefined) {
                    return data.Data
                }

                if (data.StatusCode === undefined) {
                    return data
                }

                // If error but message exists
                if (data.StatusCode !== 605 && (data.Message || data.Data)) {
                    throw new Error(data.Message || data.Data?.toString() || 'An unexpected error occurred')
                }

                return data.Data || data
        }
    }

    private handleError(error: any): Promise<never> {
        let errorMessage = 'An unexpected error occurred'

        if (error?.response) {
            const data = error.response.data
            errorMessage = data?.Message || data?.message || data?.ResponseMessage || error.response.statusText || `Server error (${error.response.status})`

            if (error.response.status === 401 || error.response.status === 403) {
                errorMessage = 'Session expired. Please login again.'
            }
        } else if (error?.request) {
            errorMessage = 'No response from server. Please check your connection.'
        } else if (error instanceof Error) {
            errorMessage = error.message
        }

        // Return a simplified Error object to avoid triggering Turbopack overlays with complex objects
        return Promise.reject(new Error(errorMessage))
    }

    // GET request
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.client.get(url, config)
    }

    // POST request with FormData
    async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        let formData = data
        if (data && !(data instanceof FormData)) {
            formData = new FormData()
            Object.keys(data).forEach(key => {
                formData.append(key, data[key])
            })
        }
        return this.client.post(url, formData, config)
    }

    // POST request with JSON
    async postJSON<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.client.post(url, data, {
            ...config,
            headers: {
                ...config?.headers,
                'Content-Type': 'application/json',
            },
        })
    }

    // PUT request
    async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.client.put(url, data, config)
    }

    // DELETE request
    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.client.delete(url, config)
    }

    // Simple API call without data
    async simplePost<T>(url: string): Promise<T> {
        const formData = new FormData()
        return this.client.post(url, formData)
    }
}

export const apiClient = new ApiClient()
