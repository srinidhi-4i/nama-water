import {
    TemplateResponse,
    NotificationFilters,
    NotificationListResponse,
    CreateNotificationRequest,
    UpdateNotificationRequest,
    SaveTemplateRequest
} from '@/types/notification.types'
import {
    getTemplatesAction,
    saveTemplateAction,
    getNotificationsAction,
    createNotificationAction,
    updateNotificationAction,
    exportToExcelAction
} from '@/app/actions/notification/notification'

export const notificationService = {
    /**
     * Get all templates, event types, and categories
     */
    async getTemplates(): Promise<TemplateResponse> {
        const result = await getTemplatesAction()
        if (!result.success || !result.data) {
            throw new Error(result.message || "Failed to load templates")
        }
        return (result.data as any).Data || result.data
    },

    /**
     * Save or update a notification template
     */
    async saveTemplate(data: SaveTemplateRequest): Promise<any> {
        const result = await saveTemplateAction(data)
        if (!result.success) {
            throw new Error(result.message || "Failed to save template")
        }
        return (result.data as any).Data || result.data
    },

    /**
     * Get custom notifications with filters
     */
    async getNotifications(filters: NotificationFilters): Promise<NotificationListResponse> {
        const result = await getNotificationsAction(filters)
        if (!result.success || !result.data) {
            return { Table: [], TotalCount: 0 }
        }
        return (result.data as any).Data || result.data
    },

    /**
     * Create a new custom notification
     */
    async createNotification(data: any): Promise<any> {
        const result = await createNotificationAction(data)
        if (!result.success) {
            throw new Error(result.message || "Failed to create notification")
        }
        return (result.data as any).Data || result.data
    },

    /**
     * Update an existing custom notification
     */
    async updateNotification(data: UpdateNotificationRequest): Promise<any> {
        const result = await updateNotificationAction(data)
        if (!result.success) {
            throw new Error(result.message || "Failed to update notification")
        }
        return (result.data as any).Data || result.data
    },

    /**
     * Export notifications to Excel
     */
    async exportToExcel(filters: NotificationFilters): Promise<Blob> {
        const result = await exportToExcelAction(filters)
        if (!result.success || !result.data) {
            throw new Error(result.message || "Failed to export to Excel")
        }

        // Convert base64 back to blob
        const byteCharacters = atob(result.data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        return new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    }
}
