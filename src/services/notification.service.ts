import {
    TemplateResponse,
    NotificationFilters,
    NotificationListResponse,
    CreateNotificationRequest,
    UpdateNotificationRequest,
    SaveTemplateRequest
} from '@/types/notification.types'
import { api } from '@/lib/axios'

export const notificationService = {
    /**
     * Get all templates, event types, and categories
     */
    async getTemplates(): Promise<TemplateResponse> {
        const response = await api.post('/api/PushNotification/NewGetTemplates', {})
        const data = response.data?.Data || response.data
        return data
    },

    /**
     * Save or update a notification template
     */
    async saveTemplate(data: SaveTemplateRequest): Promise<any> {
        const formData = new FormData()
        // Simple payload as per working UAT sample
        formData.append("NotificationCategory", data.NotificationCategory)
        formData.append("TemplateEn", data.TemplateEn)
        formData.append("TemplateAr", data.TemplateAr)

        const response = await api.post('/api/PushNotification/InsertUpdateTemplate', formData)

        // Based on UAT log, 605 is success. 
        // We only throw if status is explicitly "fail" or error code 606
        if (response.data?.Status === "fail" || response.data?.StatusCode === 606) {
            throw new Error(response.data?.ResponseMessage || "Failed to save template")
        }

        return response.data?.Data || response.data
    },

    /**
     * Get custom notifications with filters
     */
    async getNotifications(filters: NotificationFilters): Promise<NotificationListResponse> {
        const payload = {
            FromDate: filters.fromDate || '',
            ToDate: filters.toDate || '',
            EventCode: filters.eventCode || '',
            SearchQuery: filters.searchQuery || ''
        }
        const response = await api.post('/api/PushNotification/NewGetNotificationScreen', payload)
        const data = response.data?.Data || response.data
        return data || { Table: [], TotalCount: 0 }
    },

    /**
     * Create a new custom notification
     */
    async createNotification(data: CreateNotificationRequest): Promise<any> {
        const formData = new FormData()
        formData.append("UpdateType", "CREATE")
        formData.append("NotificationID", (data.NotificationId || 0).toString())
        formData.append("EventTypeCode", data.EventTypeCode)
        formData.append("NotificationCategory", data.NotificationCategory)
        formData.append("UserType", data.UserType)
        formData.append("ScheduledDateTime", data.ScheduledDateTime)
        formData.append("CreatedBy", data.CreatedBy)
        formData.append("UserID", data.CreatedBy)

        const response = await api.post('/api/PushNotification/InsertUpdatePushNotification', formData)

        if (response.data?.StatusCode === 606 || response.data?.Status === "fail") {
            throw new Error(response.data?.ResponseMessage || "Failed to create notification")
        }

        return response.data?.Data || response.data
    },

    /**
     * Update an existing custom notification
     */
    async updateNotification(data: UpdateNotificationRequest): Promise<any> {
        const formData = new FormData()
        formData.append("UpdateType", "UPDATE")
        formData.append("NotificationID", data.NotificationId.toString())
        formData.append("ScheduledDateTime", data.ScheduledDateTime)
        formData.append("ModifiedBy", data.ModifiedBy)
        formData.append("UserID", data.ModifiedBy)

        const response = await api.post('/api/PushNotification/InsertUpdatePushNotification', formData)

        if (response.data?.StatusCode === 606 || response.data?.Status === "fail") {
            throw new Error(response.data?.ResponseMessage || "Failed to update notification")
        }

        return response.data?.Data || response.data
    },

    /**
     * Export notifications to Excel
     */
    async exportToExcel(filters: NotificationFilters): Promise<Blob> {
        const payload = {
            FromDate: filters.fromDate || '',
            ToDate: filters.toDate || '',
            EventCode: filters.eventCode || '',
            SearchQuery: filters.searchQuery || ''
        }
        const response = await api.post('/api/PushNotification/ExportNotifications', payload, {
            responseType: 'blob'
        })
        return response.data
    }
}
