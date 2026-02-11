"use server"

import { axiosInstance } from "@/api/axios"
import { cookies } from "next/headers"
import {
    WetlandSlot,
    WetlandHoliday,
    CreateSlotRequest,
    CreateHolidayRequest,
    WetlandHolidayListItem,
    InsertHolidayRequest,
} from "@/types/wetland.types"

/**
 * Common helper to get cookies for server-side requests
 */
async function getAuthHeaders() {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join('; ')

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
 * Get Wetland Slots
 */
export async function getSlotsAction(month: number, year: number): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const formData = new FormData()
        formData.append('type', 'GetSlotsInformationCreateSlotScreen')
        formData.append('BranchID', '1')
        formData.append('Lang', 'EN')

        const now = new Date()
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())

        const fromDate = oneYearAgo.toISOString().split('T')[0]
        const toDate = oneYearLater.toISOString().split('T')[0]

        formData.append('FromDate', fromDate)
        formData.append('ToDate', toDate)

        const response = await axiosInstance.post(
            "WetLand/CheckAvailableTimeSlotsByType",
            formData,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("getSlotsAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Create Wetland Slot
 */
export async function createSlotAction(data: CreateSlotRequest): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const slotData = [{
            SlotDate: data.date,
            SlotCount: 1,
            Slots: [{
                SlotID: '',
                SlotDuration: '1',
                MaximumVisitors: data.capacity.toString(),
                StartTime: data.startTime,
                EndTime: data.endTime,
                IsDeleted: '',
                Reason: ''
            }]
        }]

        const formData = new FormData()
        formData.append('GovernorateID', '1')
        formData.append('WillayatID', '1')
        formData.append('BranchId', '1')
        formData.append('UserId', '1')
        formData.append('Lang', 'En')
        formData.append('JsonSlotData', JSON.stringify(slotData))

        const response = await axiosInstance.post(
            "WetLand/CreateWetlandSlots",
            formData,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("createSlotAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Update Wetland Slot
 */
export async function updateSlotAction(id: string, slotData: any): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const formData = new FormData()
        formData.append('GovernorateID', '1')
        formData.append('WillayatID', '1')
        formData.append('BranchId', '1')
        formData.append('UserId', '1')
        formData.append('Lang', 'En')
        formData.append('JsonSlotData', JSON.stringify(slotData))

        const response = await axiosInstance.post(
            "WetLand/EditWetlandSlots",
            formData,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("updateSlotAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Delete Wetland Slot
 */
export async function deleteSlotAction(id: string, slotData: any): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const formData = new FormData()
        formData.append('GovernorateID', '1')
        formData.append('WillayatID', '1')
        formData.append('BranchId', '1')
        formData.append('UserId', '1')
        formData.append('Lang', 'En')
        formData.append('JsonSlotData', JSON.stringify(slotData))

        const response = await axiosInstance.post(
            "WetLand/EditWetlandSlots",
            formData,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("deleteSlotAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Get Holidays
 */
export async function getHolidaysAction(year: number): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const fromDate = `${year}-01-01`
        const toDate = `${year}-12-31`

        const formData = new FormData()
        formData.append('fromDate', fromDate)
        formData.append('toDate', toDate)

        const response = await axiosInstance.post(
            "Wetland/GetHolidayDates",
            formData,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("getHolidaysAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Create Holiday
 */
export async function createHolidayAction(data: CreateHolidayRequest): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const formData = new FormData()
        formData.append('holidayType', data.holidayType)
        formData.append('year', data.year.toString())
        formData.append('date', data.date)
        if (data.name) formData.append('name', data.name)
        if (data.nameAr) formData.append('nameAr', data.nameAr)
        if (data.description) formData.append('description', data.description)

        const response = await axiosInstance.post(
            "Wetland/holidays",
            formData,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("createHolidayAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Delete Holiday
 */
export async function deleteHolidayAction(id: string): Promise<{ success: boolean; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const response = await axiosInstance.delete(
            `Wetland/holidays/${id}`,
            { headers: authHeaders }
        )
        return { success: true }
    } catch (error: any) {
        console.error("deleteHolidayAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Get Master Data
 */
export async function getMasterDataAction(keyType: string): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const formData = new FormData()
        formData.append('keyType', keyType)

        const response = await axiosInstance.post(
            "Wetland/GetMasterData",
            formData,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("getMasterDataAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Get Holiday Dates
 */
export async function getHolidayDatesAction(fromDate: string, toDate: string): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const formData = new FormData()
        formData.append('fromDate', fromDate)
        formData.append('toDate', toDate)

        const response = await axiosInstance.post(
            "Wetland/GetHolidayDates",
            formData,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("getHolidayDatesAction error:", error.message)
        return { success: false, message: error.message }
    }
}

/**
 * Insert Wetland Holiday
 */
export async function insertWetlandHolidayAction(data: InsertHolidayRequest): Promise<{ success: boolean; data?: any; message?: string }> {
    const authHeaders = await getAuthHeaders()
    try {
        const formData = new FormData()
        formData.append('Lang', data.Lang)
        formData.append('Action', data.Action)
        formData.append('HolidayType', data.HolidayType)
        formData.append('StartDate', data.StartDate)
        formData.append('EndDate', data.EndDate)
        formData.append('InternalUserID', data.InternalUserID as any)
        formData.append('HolidayDesriptionEN', data.HolidayDesriptionEN)
        formData.append('HolidayDesriptionAR', data.HolidayDesriptionAR)

        if (data.Weekends) {
            formData.append('Weekends', data.Weekends)
        }

        if (data.Year) {
            formData.append('Year', data.Year.toString())
        }

        const response = await axiosInstance.post(
            "Wetland/InsertWetlandHoliday",
            formData,
            { headers: authHeaders }
        )
        return { success: true, data: response.data }
    } catch (error: any) {
        console.error("insertWetlandHolidayAction error:", error.message)
        return { success: false, message: error.message }
    }
}
