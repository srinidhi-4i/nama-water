"use server"

import { axiosInstance } from "@/api/axios"
import { cookies } from "next/headers"
import {
    TemplateResponse,
    SaveTemplateRequest,
    NotificationFilters,
    NotificationListResponse,
    CreateNotificationRequest,
    UpdateNotificationRequest
} from "@/types/notification.types"

/**
 * Common helper to get cookies for server-side requests
 */
async function getCookieHeader() {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    return allCookies.map(c => `${c.name}=${c.value}`).join('; ')
}

export async function getTemplatesAction(): Promise<{ success: boolean; data?: TemplateResponse; message?: string }> {
    try {
        const cookieHeader = await getCookieHeader()
        const response = await axiosInstance.post(
            "PushNotification/NewGetTemplates",
            {},
            {
                headers: {
                    "Cookie": cookieHeader
                }
            }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("getTemplatesAction error:", error.message)
        return { success: false, message: error.message }
    }
}

export async function saveTemplateAction(data: SaveTemplateRequest): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const cookieHeader = await getCookieHeader()
        const isEdit = !!data.NotificationId && data.NotificationId !== 0

        const formData = new FormData()
        formData.append("UpdateType", isEdit ? "UPDATE" : "CREATE")
        formData.append("NotificationID", (data.NotificationId || 0).toString())
        formData.append("EventCode", data.EventCode)
        formData.append("NotificationCategory", data.NotificationCategory)
        formData.append("TemplateEn", data.TemplateEn)
        formData.append("TemplateAr", data.TemplateAr)
        formData.append("ModifiedBy", data.ModifiedBy)
        formData.append("UserID", data.ModifiedBy)

        const response = await axiosInstance.post(
            "PushNotification/InsertUpdateTemplate",
            formData,
            {
                headers: {
                    "Cookie": cookieHeader,
                    'Origin': 'https://eservicesuat.nws.nama.om',
                    'Referer': 'https://eservicesuat.nws.nama.om/',
                }
            }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("saveTemplateAction error:", error.message)
        return { success: false, message: error.message }
    }
}

export async function getNotificationsAction(filters: NotificationFilters): Promise<{ success: boolean; data?: NotificationListResponse; message?: string }> {
    try {
        const cookieHeader = await getCookieHeader()
        const payload = {
            FromDate: filters.fromDate || '',
            ToDate: filters.toDate || '',
            EventCode: filters.eventCode || '',
            SearchQuery: filters.searchQuery || ''
        }
        const response = await axiosInstance.post(
            "PushNotification/NewGetNotificationScreen",
            payload,
            {
                headers: {
                    "Cookie": cookieHeader
                }
            }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("getNotificationsAction error:", error.message)
        return { success: false, message: error.message }
    }
}

export async function createNotificationAction(data: CreateNotificationRequest): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const cookieHeader = await getCookieHeader()

        const formData = new FormData()
        formData.append("UpdateType", "CREATE")
        formData.append("NotificationID", (data.NotificationId || 0).toString())
        formData.append("EventTypeCode", data.EventTypeCode)
        formData.append("NotificationCategory", data.NotificationCategory)
        formData.append("UserType", data.UserType)
        formData.append("ScheduledDateTime", data.ScheduledDateTime)
        formData.append("CreatedBy", data.CreatedBy)
        formData.append("UserID", data.CreatedBy)

        const response = await axiosInstance.post(
            "PushNotification/InsertUpdatePushNotification",
            formData,
            {
                headers: {
                    "Cookie": cookieHeader,
                    'Origin': 'https://eservicesuat.nws.nama.om',
                    'Referer': 'https://eservicesuat.nws.nama.om/',
                }
            }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("createNotificationAction error:", error.message)
        return { success: false, message: error.message }
    }
}

export async function updateNotificationAction(data: UpdateNotificationRequest): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const cookieHeader = await getCookieHeader()

        const formData = new FormData()
        formData.append("UpdateType", "UPDATE")
        formData.append("NotificationID", data.NotificationId.toString())
        formData.append("ScheduledDateTime", data.ScheduledDateTime)
        formData.append("ModifiedBy", data.ModifiedBy)
        formData.append("UserID", data.ModifiedBy)

        const response = await axiosInstance.post(
            "PushNotification/InsertUpdatePushNotification",
            formData,
            {
                headers: {
                    "Cookie": cookieHeader,
                    'Origin': 'https://eservicesuat.nws.nama.om',
                    'Referer': 'https://eservicesuat.nws.nama.om/',
                }
            }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}

export async function exportToExcelAction(filters: NotificationFilters): Promise<{ success: boolean; data?: string; message?: string }> {
    try {
        const cookieHeader = await getCookieHeader()
        const payload = {
            FromDate: filters.fromDate || '',
            ToDate: filters.toDate || '',
            EventCode: filters.eventCode || '',
            SearchQuery: filters.searchQuery || ''
        }
        const response = await axiosInstance.post(
            "PushNotification/ExportNotifications",
            payload,
            {
                headers: {
                    "Cookie": cookieHeader
                },
                responseType: 'arraybuffer'
            }
        )
        // Convert arraybuffer to base64 for transport over Server Action
        const base64 = Buffer.from(response.data).toString('base64')
        return { success: true, data: base64 }
    } catch (error: any) {
        console.error("exportToExcelAction error:", error.message)
        return { success: false, message: error.message }
    }
}
