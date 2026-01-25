import { apiClient } from '@/lib/api-client'
import {
    NotificationTemplate,
    TemplateResponse,
    NotificationFilters,
    NotificationListResponse,
    CreateNotificationRequest,
    UpdateNotificationRequest,
    SaveTemplateRequest,
    CustomNotification
} from '@/types/notification.types'



export const notificationService = {
    /**
     * Get all templates, event types, and categories
     * Matches React app: PushNotification/NewGetTemplates
     */
    async getTemplates(): Promise<TemplateResponse> {
        try {
            const response = await apiClient.simplePost<TemplateResponse>('/PushNotification/NewGetTemplates')
            return response
        } catch (error) {
            throw error
        }
    },

    /**
     * Save or update a notification template
     * Matches React app: PushNotification/InsertUpdateTemplate
     */
    async saveTemplate(data: SaveTemplateRequest): Promise<any> {
        try {
            // Match payload from React app (Template.jsx)
            const formData = {
                NotificationCategory: data.NotificationCategory,
                TemplateEn: data.TemplateEn,
                TemplateAr: data.TemplateAr
            }
            const response = await apiClient.post<any>('/PushNotification/InsertUpdateTemplate', formData)
            return response
        } catch (error) {
            throw error
        }
    },

    /**
     * Get custom notifications with filters
     * Matches React app: PushNotification/NewGetNotificationScreen
     */
    async getNotifications(filters: NotificationFilters): Promise<NotificationListResponse> {
        try {
            const formData = {
                FromDate: filters.fromDate || '',
                ToDate: filters.toDate || '',
                EventCode: filters.eventCode || '',
                SearchQuery: filters.searchQuery || ''
            }
            const response = await apiClient.post<NotificationListResponse>(
                '/PushNotification/NewGetNotificationScreen',
                formData
            )
            return response || { Table: [], TotalCount: 0 }
        } catch (error) {
            // Return empty list on error
            return { Table: [], TotalCount: 0 }
        }
    },

    /**
     * Create a new custom notification
     * Matches React app: PushNotification/InsertUpdatePushNotification
     */
    async createNotification(data: CreateNotificationRequest): Promise<any> {
        try {
            const formData = {
                NotificationID: data.NotificationID || 0,
                EventTypeCode: data.EventTypeCode,
                NotificationCategory: data.NotificationCategory,
                UserType: data.UserType,
                ScheduledDateTime: data.ScheduledDateTime,
                CreatedBy: data.CreatedBy
            }
            const response = await apiClient.post<any>('/PushNotification/InsertUpdatePushNotification', formData)
            return response
        } catch (error) {
            throw error
        }
    },

    /**
     * Update an existing custom notification
     * Matches React app: PushNotification/InsertUpdatePushNotification
     */
    async updateNotification(data: UpdateNotificationRequest): Promise<any> {
        try {
            const formData = {
                NotificationID: data.NotificationID,
                ScheduledDateTime: data.ScheduledDateTime,
                ModifiedBy: data.ModifiedBy
            }
            const response = await apiClient.post<any>('/PushNotification/InsertUpdatePushNotification', formData)
            return response
        } catch (error) {
            throw error
        }
    },

    /**
     * Export notifications to Excel
     */
    async exportToExcel(filters: NotificationFilters): Promise<Blob> {
        try {
            const formData = {
                FromDate: filters.fromDate || '',
                ToDate: filters.toDate || '',
                EventCode: filters.eventCode || '',
                SearchQuery: filters.searchQuery || ''
            }
            const response = await apiClient.post<Blob>(
                '/PushNotification/ExportNotifications',
                formData,
                {
                    responseType: 'blob'
                }
            )
            return response
        } catch (error) {
            throw error
        }
    }
}
