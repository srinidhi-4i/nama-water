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
async function getAuthHeaders() {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join('; ')

    // Check if the specific auth token cookie exists
    const tokenCookie = cookieStore.get('AU/@/#/TO/#/VA')
    const headers: any = {
        "Cookie": cookieHeader
    }

    if (tokenCookie?.value) {
        headers.Authorization = `Bearer ${tokenCookie.value}`
    }

    return headers
}

export async function getTemplatesAction(): Promise<{ success: boolean; data?: TemplateResponse; message?: string }> {
    try {
        const headers = await getAuthHeaders()
        const response = await axiosInstance.post(
            "PushNotification/NewGetTemplates",
            {},
            { headers }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("getTemplatesAction error:", error.message)
        return { success: false, message: error.message }
    }
}

export async function saveTemplateAction(data: SaveTemplateRequest): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const authHeaders = await getAuthHeaders()

        const formData = new FormData()
        formData.append("NotificationCategory", data.NotificationCategory)
        formData.append("TemplateEn", data.TemplateEn)
        formData.append("TemplateAr", data.TemplateAr)

        const response = await axiosInstance.post(
            "PushNotification/InsertUpdateTemplate",
            formData,
            {
                headers: {
                    ...authHeaders,
                    'Origin': 'https://eservicesuat.nws.nama.om',
                    'Referer': 'https://eservicesuat.nws.nama.om/',
                }
            }
        )

        // UAT may return results in an array or a wrapper object. 
        const responseData = response.data;
        const mainObj = Array.isArray(responseData) ? responseData[0] : responseData;

        if (mainObj?.Status === "fail" || mainObj?.StatusCode === 606) {
            return { success: false, message: mainObj?.ResponseMessage || "Failed to save template" }
        }

        return { success: true, data: responseData }
    } catch (error: any) {
        console.error("saveTemplateAction error:", error.message)
        return { success: false, message: error.message }
    }
}

export async function getNotificationsAction(filters: NotificationFilters): Promise<{ success: boolean; data?: NotificationListResponse; message?: string }> {
    try {
        const authHeaders = await getAuthHeaders()
        const payload = {
            FromDate: filters.fromDate || '',
            ToDate: filters.toDate || '',
            EventCode: filters.eventCode || '',
            SearchQuery: filters.searchQuery || ''
        }
        const response = await axiosInstance.post(
            "PushNotification/NewGetNotificationScreen",
            payload,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("getNotificationsAction error:", error.message)
        return { success: false, message: error.message }
    }
}

export async function createNotificationAction(data: any): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const authHeaders = await getAuthHeaders()

        const formData = new FormData()
        // ... same logic for create ...
        // Using existing createNotificationAction body but with authHeaders
        formData.append("NotificationEn", data.NotificationEn)
        formData.append("NotificationAr", data.NotificationAr || "")
        formData.append("NotificationCategory", data.NotificationCategory)
        formData.append("NotificationType", "Read_Only")
        formData.append("UserID", data.UserID || "")
        formData.append("NotificationSend", "0")
        formData.append("NotificationResponse", "")
        formData.append("NotificationSubject", data.NotificationSubject)
        formData.append("NotificationSubjectAr", data.NotificationSubjectAr || "")
        formData.append("IsRead", "0")
        formData.append("ActionName", "")
        formData.append("ActionURL", "")
        formData.append("JsonData", JSON.stringify({
            NotificationCategory: data.NotificationCategory,
            StartTime: "",
            EndTime: ""
        }))
        formData.append("NotificationRquestID", "0")
        formData.append("IsAdminScreen", "1")
        formData.append("NotificationScheduledDatetime", data.NotificationScheduledDatetime)
        formData.append("UserType", data.UserType === "ALL" ? "GUSR" : "RGUSR")
        formData.append("IsDataMandatory", data.IsDataMandatory?.toString() === "false" ? "false" : "true")
        formData.append("StartTime", "")
        formData.append("EndTime", "")

        const response = await axiosInstance.post(
            "PushNotification/InsertUpdateScreen",
            formData,
            {
                headers: {
                    ...authHeaders,
                    'Origin': 'https://eservicesuat.nws.nama.om',
                    'Referer': 'https://eservicesuat.nws.nama.om/',
                }
            }
        )

        if (response.data?.Status === "fail" || response.data?.StatusCode === 606) {
            return { success: false, message: response.data?.ResponseMessage || "Failed to create notification" }
        }

        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("createNotificationAction error:", error.message)
        return { success: false, message: error.message }
    }
}

export async function updateNotificationAction(data: any): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const authHeaders = await getAuthHeaders()

        const formData = new FormData()
        // Update uses the same InsertUpdateScreen endpoint as Create
        // but with the actual NotificationId passed as NotificationRquestID
        formData.append("NotificationEn", data.NotificationEn || "")
        formData.append("NotificationAr", data.NotificationAr || "")
        formData.append("NotificationCategory", data.NotificationCategory)
        formData.append("NotificationType", "Read_Only")
        formData.append("UserID", data.UserID || "")
        formData.append("NotificationSend", "0")
        formData.append("NotificationResponse", "")
        formData.append("NotificationSubject", data.NotificationSubject || "")
        formData.append("NotificationSubjectAr", data.NotificationSubjectAr || "")
        formData.append("IsRead", "0")
        formData.append("ActionName", "")
        formData.append("ActionURL", "")
        formData.append("UpdateType", "Update")
        formData.append("JsonData", JSON.stringify({
            NotificationCategory: data.NotificationCategory,
            StartTime: "",
            EndTime: ""
        }))
        formData.append("NotificationRquestID", (data.NotificationId || data.NotificationRquestID || "0").toString())
        formData.append("IsAdminScreen", "1")
        formData.append("NotificationScheduledDatetime", data.ScheduledDateTime || data.NotificationScheduledDatetime)
        formData.append("UserType", data.UserType === "ALL" ? "GUSR" : "RGUSR")
        formData.append("IsDataMandatory", data.IsDataMandatory?.toString() === "false" ? "false" : "true")
        formData.append("StartTime", "")
        formData.append("EndTime", "")

        const response = await axiosInstance.post(
            "PushNotification/InsertUpdateScreen",
            formData,
            {
                headers: {
                    ...authHeaders,
                    'Origin': 'https://eservicesuat.nws.nama.om',
                    'Referer': 'https://eservicesuat.nws.nama.om/',
                }
            }
        )

        if (response.data?.Status === "fail" || response.data?.StatusCode === 606) {
            return { success: false, message: response.data?.ResponseMessage || "Failed to update notification" }
        }

        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("updateNotificationAction error:", error.message)
        return { success: false, message: error.message }
    }
}

export async function exportToExcelAction(filters: NotificationFilters): Promise<{ success: boolean; data?: string; message?: string }> {
    try {
        const authHeaders = await getAuthHeaders()
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
                headers: { ...authHeaders },
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
