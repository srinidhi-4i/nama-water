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
    const headers = await getAuthHeaders()
    const maxRetries = 2
    let lastError: any = null

    for (let i = 0; i <= maxRetries; i++) {
        try {
            const response = await axiosInstance.post(
                "PushNotification/NewGetTemplates",
                { _t: Date.now() }, // Cache buster
                {
                    headers: {
                        ...headers,
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            )
            return { success: true, data: response.data }
        } catch (error: any) {
            lastError = error
            console.error(`getTemplatesAction attempt ${i + 1} failed:`, error.message)

            // Only retry on connection reset or timeout
            if (i < maxRetries && (error.message.includes('ECONNRESET') || error.code === 'ECONNABORTED' || error.message.includes('timeout'))) {
                const delay = (i + 1) * 1000
                await new Promise(resolve => setTimeout(resolve, delay))
                continue
            }
            break
        }
    }

    return { success: false, message: lastError?.message || "Failed to load templates" }
}

export async function saveTemplateAction(data: SaveTemplateRequest): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const authHeaders = await getAuthHeaders()

        const formData = new FormData()
        formData.append("NotificationId", (data as any).NotificationId?.toString() || "")
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
    const authHeaders = await getAuthHeaders()
    const payload: any = {
        FromDate: filters.fromDate || '',
        ToDate: filters.toDate || '',
        EventCode: filters.eventCode || '',
        EventType: filters.eventCode || '', // Send as both EventCode and EventType
        NotificationCategory: filters.eventCode || '', // Some endpoints use Category for filtering
        SearchQuery: filters.searchQuery || '',
        _t: Date.now() // Cache buster
    }
    const maxRetries = 2
    let lastError: any = null

    for (let i = 0; i <= maxRetries; i++) {
        try {
            const response = await axiosInstance.post(
                "PushNotification/NewGetNotificationScreen",
                payload,
                {
                    headers: {
                        ...authHeaders,
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }
            )
            return { success: true, data: response.data }
        } catch (error: any) {
            lastError = error
            console.error(`getNotificationsAction attempt ${i + 1} failed:`, error.message)

            if (i < maxRetries && (error.message.includes('ECONNRESET') || error.code === 'ECONNABORTED' || error.message.includes('timeout'))) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                continue
            }
            break
        }
    }

    return { success: false, message: lastError?.message || "Failed to load notifications" }
}

export async function createNotificationAction(data: any): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const authHeaders = await getAuthHeaders()

        const formData = new FormData()
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
        const idValue = (data.NotificationId || data.NotificationRquestID || data.id || "0").toString()

        // Multi-layered identifier mapping to prevent new row creation
        formData.append("UpdateType", "UPDATE")
        formData.append("IsEdit", "1")
        formData.append("NotificationId", idValue)
        formData.append("NolificationId", idValue) // Tyo fix
        formData.append("NotificationRquestID", idValue)
        formData.append("EventTypeID", idValue)
        formData.append("EventID", idValue)
        formData.append("NotifyID", idValue)
        formData.append("id", idValue)

        formData.append("NotificationEn", data.NotificationEn || "")
        formData.append("NotificationAr", data.NotificationAr || "")
        formData.append("NotificationCategory", data.NotificationCategory || "")
        formData.append("NotificationSubject", data.NotificationSubject || "")
        formData.append("NotificationSubjectAr", data.NotificationSubjectAr || "")

        formData.append("NotificationType", "Read_Only")
        formData.append("NotificationSend", "0")
        formData.append("NotificationResponse", "")
        formData.append("IsRead", "0")
        formData.append("ActionName", "")
        formData.append("ActionURL", "")
        formData.append("IsAdminScreen", "1")

        const userId = data.ModifiedBy || "1"
        formData.append("ModifiedBy", userId)
        formData.append("UserID", userId)

        formData.append("UserType", data.UserType === "ALL" ? "GUSR" : "RGUSR")
        formData.append("IsDataMandatory", data.IsDataMandatory !== false && data.IsDataMandatory !== "false" ? "true" : "false")
        formData.append("TsDataMandatory", data.IsDataMandatory !== false && data.IsDataMandatory !== "false" ? "true" : "false")

        const scheduledDate = data.ScheduledDateTime || data.NotificationScheduledDatetime || ""
        formData.append("ScheduledDateTime", scheduledDate)
        formData.append("NotificationScheduledDatetime", scheduledDate)
        formData.append("NotificationScheduledDate", scheduledDate)
        formData.append("ScheduleNotificationDate", scheduledDate)
        formData.append("StartTime", "")
        formData.append("EndTime", "")

        formData.append("JsonData", JSON.stringify({
            NotificationCategory: data.NotificationCategory,
            NotificationId: idValue,
            NotificationRquestID: idValue,
            StartTime: "",
            EndTime: ""
        }))

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

        const resData = response.data;
        if (resData?.Status === "fail" || resData?.StatusCode === 606) {
            return { success: false, message: resData?.ResponseMessage || "Failed to update notification" }
        }

        return { success: true, data: resData }
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
