"use server"

import { axiosInstance } from "@/api/axios"
import { cookies } from "next/headers"
import {
    WaterShutdownFilters,
    WaterShutdownListResponse,
    WaterShutdownNotification,
    WaterShutdownTemplate,
    SaveNotificationRequest
} from "@/types/watershutdown.types"

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

/**
 * Get Master Data for Regions, Event Types, and Template Types
 */
export async function getWaterShutdownMasterDataAction(): Promise<{ success: boolean; data?: any; message?: string }> {
    const headers = await getAuthHeaders()
    try {
        const formData = new FormData()
        formData.append('masterType', '')

        const response = await axiosInstance.post(
            "WaterShutdown/GetWaterShutdown",
            formData,
            { headers }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("getWaterShutdownMasterDataAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Get the list of notifications with filters
 */
export async function getNotificationsAction(filters: WaterShutdownFilters): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    const maxRetries = 2
    let lastError: any = null

    const formData = new FormData()
    formData.append('region', filters.region === "ALL" ? "" : filters.region || "")
    formData.append('eventType', filters.eventType === "ALL" ? "" : filters.eventType || "")
    formData.append('fromDate', filters.fromDate || "")
    formData.append('toDate', filters.toDate || "")

    for (let i = 0; i <= maxRetries; i++) {
        try {
            const response = await axiosInstance.post(
                "WaterShutdown/GetEventDetails",
                formData,
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

/**
 * Get single notification details
 */
export async function getNotificationByIdAction(id: string): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const formData = new FormData()
        formData.append('EventID', id)
        formData.append('EventUniqueId', id)
        formData.append('id', id)

        const response = await axiosInstance.post(
            "WaterShutdown/GetWaterShutDownEventDetailsSingle",
            formData,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("getNotificationByIdAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Create or Update Water Shutdown Notification
 */
export async function saveNotificationAction(data: any, endpoint: string): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const formData = new FormData()

        // Populate FormData from the provided data object
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
                if (key === 'contractors' || key === 'focalPoints' || key === 'eventNotificationDetails') {
                    formData.append(key, JSON.stringify(data[key]))
                } else {
                    formData.append(key, data[key].toString())
                }
            }
        })

        // Clean endpoint path (remove leading slash if present)
        const apiPath = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint

        const response = await axiosInstance.post(
            apiPath,
            formData,
            {
                headers: {
                    ...authHeaders,
                    'Origin': 'https://eservicesuat.nws.nama.om',
                    'Referer': 'https://eservicesuat.nws.nama.om/',
                }
            }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("saveNotificationAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Delete a notification
 */
export async function deleteNotificationAction(id: string): Promise<{ success: boolean; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const response = await axiosInstance.delete(
            `WaterShutdown/notifications/${id}`,
            { headers: authHeaders }
        )
        return { success: true }
    } catch (error: any) {
        console.error("deleteNotificationAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Template Operations - Get Template List
 */
export async function getTemplatesAction(): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const formData = new FormData()
        formData.append('TemplateDetailsID', '')

        const response = await axiosInstance.post(
            "WaterShutdown/GetEventTemplateDetails",
            formData,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("getTemplatesAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Template Operations - Save Template (Create/Update/Delete)
 */
export async function saveTemplateAction(data: any): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const formData = new FormData()
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]?.toString() || "")
        })

        const response = await axiosInstance.post(
            "WaterShutdown/InsertEventTemplateDetails",
            formData,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("saveTemplateAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Export to Excel
 */
export async function exportToExcelAction(filters: WaterShutdownFilters): Promise<{ success: boolean; data?: string; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const params = new URLSearchParams()
        if (filters.region && filters.region !== "ALL") params.append('region', filters.region)
        if (filters.eventType && filters.eventType !== "ALL") params.append('eventType', filters.eventType)
        if (filters.status) params.append('status', filters.status)
        if (filters.fromDate) params.append('fromDate', filters.fromDate)
        if (filters.toDate) params.append('toDate', filters.toDate)
        if (filters.searchQuery) params.append('search', filters.searchQuery)

        const response = await axiosInstance.get(
            `WaterShutdown/notifications/export?${params.toString()}`,
            {
                headers: authHeaders,
                responseType: 'arraybuffer'
            }
        )

        const base64 = Buffer.from(response.data).toString('base64')
        return { success: true, data: base64 }
    } catch (error: any) {
        console.error("exportToExcelAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Get User List
 */
export async function getWaterShutdownUserListAction(): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const response = await axiosInstance.post(
            "WaterShutdown/GetWaterShutDownUserList",
            new FormData(),
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("getWaterShutdownUserListAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Get Intermediate History
 */
export async function getIntermediateHistoryAction(eventId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const formData = new FormData()
        formData.append('EventId', eventId)

        const response = await axiosInstance.post(
            "WaterShutdown/GetIntermediateHistory",
            formData,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("getIntermediateHistoryAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Resend Intermediate Notifications
 */
export async function resendIntermediateNotificationsAction(eventId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const response = await axiosInstance.post(
            `WaterShutdown/ResendIntermediateNotifications?EventUniqueId=${eventId}`,
            {},
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("resendIntermediateNotificationsAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Send Intermediate SMS
 */
export async function sendIntermediateSMSAction(eventId: string, data: {
    fromHour: string;
    toHour: string;
    templateEn: string;
    templateAr: string;
}): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const formData = new FormData()
        formData.append('UpdateType', 'INTERMEDIATE TRIGGERED')
        formData.append('EventId', eventId)
        formData.append('UserId', '')
        formData.append('FromHour', data.fromHour)
        formData.append('ToHour', data.toHour)
        formData.append('TemplateEn', data.templateEn)
        formData.append('TemplateAr', data.templateAr)
        formData.append('Lang', 'EN')

        const response = await axiosInstance.post(
            "WaterShutdown/IntermediateSmsEvent",
            formData,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("sendIntermediateSMSAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Send Completion Notification
 */
export async function sendCompletionNotificationAction(eventId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const formData = new FormData()
        formData.append('UpdateType', 'COMPLETION TRIGGERED')
        formData.append('EventId', eventId)
        formData.append('UserId', '')
        formData.append('Comments', 'Completion Success')
        formData.append('Lang', 'EN')

        const response = await axiosInstance.post(
            "WaterShutdown/CompletionNotificationEvent",
            formData,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("sendCompletionNotificationAction error:", error.message)
        return { success: false, message: error.message }
    }
}
