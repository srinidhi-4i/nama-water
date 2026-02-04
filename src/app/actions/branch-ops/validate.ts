"use server"

import { axiosInstance } from "@/api/axios"
import { cookies } from "next/headers"

export async function validateUserAction(type: string, value: string): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll()
        // Construct Cookie header manually
        const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join('; ')

        console.log(`Validate Action: Validating ${type} for ${value}`)
        console.log(`Validate Action: Cookies present: ${allCookies.length}`)

        const formData = new FormData()
        let paramName = ''
        let paramValue = value.trim()

        switch (type) {
            case 'GSM_NUMBER':
                paramName = 'gsmNumber'
                if (!paramValue.startsWith('968')) {
                    paramValue = '968' + paramValue
                }
                break
            case 'CIVIL_ID':
                paramName = 'civilId'
                break
            case 'CR_NUMBER':
                paramName = 'crNumber'
                break
            default:
                throw new Error('Invalid validation type')
        }

        formData.append(paramName, paramValue)
        formData.append('sourceType', 'Web')
        formData.append('langCode', 'EN')
        formData.append('islegacy', '0')

        const response = await axiosInstance.post(
            "BranchOfficer/GetBranchOfficerCivilID",
            formData,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded", // axios serializes FormData automatically but explicit is good
                    "Cookie": cookieHeader,
                    // Forward Auth token if available in cookies (our middleware one)
                    "Authorization": cookieStore.get('auth_token') ? `Bearer ${cookieStore.get('auth_token')?.value}` : ''
                },
            }
        )

        console.log("Validate Action: Response Status:", response.status)
        const data = response.data

        if (data.StatusCode === 612) {
            return { success: false, message: "Session expired. Please login again." }
        }

        if (data === 'Failed' || !data || data.StatusCode === 606 || (typeof data.Data === 'string' && data.Data.includes('User not found'))) {
            return { success: false, message: 'User not found' }
        }

        return { success: true, data: data }

    } catch (error: any) {
        console.error("Validate Action Error:", error.message)
        if (error.response) {
            console.error("Validate Action Error Data:", error.response.data)
            if (error.response.status === 401 || error.response.status === 403) {
                return { success: false, message: "Session expired" }
            }
        }
        return { success: false, message: error.message || "An unexpected error occurred" }
    }
}
