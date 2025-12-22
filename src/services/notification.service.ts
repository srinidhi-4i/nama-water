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
            // #region agent log
            if (typeof window !== 'undefined') {
                fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'notification.service.ts:22',message:'Calling getTemplates',data:{endpoint:'/PushNotification/NewGetTemplates'},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
            }
            // #endregion
            const response = await apiClient.simplePost<TemplateResponse>('/PushNotification/NewGetTemplates')
            // #region agent log
            if (typeof window !== 'undefined') {
                fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'notification.service.ts:26',message:'getTemplates response received',data:{hasResponse:!!response,hasNotifications:!!response?.Notifications,notificationsCount:response?.Notifications?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
            }
            // #endregion
            return response
        } catch (error) {
            // #region agent log
            if (typeof window !== 'undefined') {
                fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'notification.service.ts:30',message:'getTemplates error',data:{errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
            }
            // #endregion
            console.error('Error fetching templates:', error)
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
            console.error('Error creating notification:', error)
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
                '/PushNotification/ExportNotifications',
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
