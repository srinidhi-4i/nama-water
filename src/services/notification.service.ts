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
            const response = await apiClient.simplePost<TemplateResponse>('PushNotification/NewGetTemplates')
            return response || { EventType: [], Category: [], Notifications: [] }
        } catch (error) {
            console.error('Error fetching templates:', error)
            return { EventType: [], Category: [], Notifications: [] }
        }
    },

    /**
     * Save or update a notification template
     * Matches React app: PushNotification/SaveTemplate
     */
    async saveTemplate(data: SaveTemplateRequest): Promise<any> {
        try {
            const formData = {
                NotificationID: data.NotificationID || '',
                EventCode: data.EventCode,
                NotificationCategory: data.NotificationCategory,
                TemplateEn: data.TemplateEn,
                TemplateAr: data.TemplateAr,
                ModifiedBy: data.ModifiedBy
            }
            const response = await apiClient.post<any>('PushNotification/SaveTemplate', formData)
            return response
        } catch (error) {
            console.error('Error saving template:', error)
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
                'PushNotification/NewGetNotificationScreen',
                formData
            )
            return response || { Table: [], TotalCount: 0 }
        } catch (error) {
            console.error('Error fetching notifications:', error)
            return { Table: [], TotalCount: 0 }
        }
    },

    /**
     * Create a new custom notification
     * Matches React app: PushNotification/CreateNotification
     */
    async createNotification(data: CreateNotificationRequest): Promise<any> {
        try {
            const formData = {
                EventTypeCode: data.EventTypeCode,
                NotificationCategory: data.NotificationCategory,
                UserType: data.UserType,
                ScheduledDateTime: data.ScheduledDateTime,
                CreatedBy: data.CreatedBy
            }
            const response = await apiClient.post<any>('PushNotification/CreateNotification', formData)
            return response
        } catch (error) {
            console.error('Error creating notification:', error)
            throw error
        }
    },

    /**
     * Update an existing custom notification
     * Matches React app: PushNotification/UpdateNotification
     */
    async updateNotification(data: UpdateNotificationRequest): Promise<any> {
        try {
            const formData = {
                NotificationID: data.NotificationID,
                ScheduledDateTime: data.ScheduledDateTime,
                ModifiedBy: data.ModifiedBy
            }
            const response = await apiClient.post<any>('PushNotification/UpdateNotification', formData)
            return response
        } catch (error) {
            console.error('Error updating notification:', error)
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
                'PushNotification/ExportNotifications',
                formData,
                {
                    responseType: 'blob'
                }
            )
            return response
        } catch (error) {
            console.error('Error exporting notifications:', error)
            throw error
        }
    }
}
