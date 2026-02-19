"use server"

import { axiosInstance } from "@/api/axios"
import { encryptString } from "@/lib/crypto"
import { cookies } from "next/headers"
import { LoginRequest, LoginResponse } from "@/types/auth.types"

export async function loginAction(loginData: LoginRequest): Promise<{ success: boolean; message?: string; data?: any; token?: string }> {
    try {
        console.log("Login Action: Starting LDAP Validation for", loginData.username)

        // Step 1: LDAP Validation
        const encryptedUsername = encryptString(loginData.username)
        const encryptedPassword = encryptString(loginData.password)

        const ldapParams = new URLSearchParams()
        ldapParams.append("UserName", encryptedUsername)
        ldapParams.append("Password", encryptedPassword)

        console.log(`[${Date.now()}] Login Action: Sending LDAP request...`);
        const ldapResponse = await axiosInstance.post(
            "InternalPortal/GetLDAPLoginValidation",
            ldapParams,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                timeout: 15000 // 15s timeout
            }
        )

        console.log("Login Action: LDAP Response Status:", ldapResponse.status)
        const ldapData = ldapResponse.data

        // Debug: log full LDAP response to diagnose validation issues
        console.log("Login Action: LDAP Full Response:", JSON.stringify(ldapData, null, 2))

        if (ldapData.StatusCode === 612) {
            return { success: false, message: "Session expired" }
        }

        if (!ldapData || ldapData.StatusCode === 606) {
            return {
                success: false,
                message: ldapData?.Data?.ErrMessage || "Invalid username or password",
            }
        }

        if (ldapData.StatusCode !== 605 || ldapData.Data?.StatusCode !== "Success") {
            return {
                success: false,
                message: ldapData?.Data?.ErrMessage || "LDAP validation failed",
            }
        }

        // Capture and set cookies from LDAP response
        const cookieStore = await cookies()
        const ldapCookies = ldapResponse.headers["set-cookie"]
        if (ldapCookies && Array.isArray(ldapCookies)) {
            console.log("Login Action: Setting LDAP cookies:", ldapCookies.length)
            ldapCookies.forEach((cookieStr) => {
                // Simple parser to get name, value and other options
                // For now, we just want to forward them to the browser
                // We'll set them as essential cookies
                const firstPart = cookieStr.split(";")[0]
                const [name, value] = firstPart.split("=")
                if (name && value) {
                    cookieStore.set({
                        name: name.trim(),
                        value: value.trim(),
                        httpOnly: true, // true by default for safety
                        secure: process.env.NODE_ENV === 'production',
                        path: '/',
                        sameSite: 'lax',
                        maxAge: 60 * 60 * 24 // 1 day
                    })
                }
            })
        }

        // Capture Token from LDAP (BranchOps might need this)
        const token = ldapData.Data?.Token
        if (token) {
            // Also set auth_token cookie for our middleware
            cookieStore.set({
                name: 'auth_token',
                value: token,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                sameSite: 'lax'
            })
        }

        // Step 2: Get Branch Details
        console.log("Login Action: Getting Branch Details")
        const branchParams = new URLSearchParams()
        branchParams.append("UserADId", loginData.username)

        // IMPORTANT: We must forward the cookies we just received to the next call!
        // Since axios is server-side, it doesn't persist cookies automatically between requests
        // unless we use a cookie jar. Here we manually extract from previous response.
        let cookieHeader = ""
        if (ldapCookies) {
            cookieHeader = ldapCookies.map(c => c.split(';')[0]).join('; ')
        }

        console.log(`[${Date.now()}] Login Action: Sending Branch Details request...`);
        const branchResponse = await axiosInstance.post(
            "InternalPortal/GetBranchDetails",
            branchParams,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Cookie": cookieHeader // Forward cookies!
                },
                timeout: 10000 // 10s timeout
            }
        )

        console.log("Login Action: Branch Response Status:", branchResponse.status)
        const branchData = branchResponse.data

        if (branchData.StatusCode === 605) {
            const apiData = branchData.Data

            if (apiData && apiData.UserID === 0) {
                return { success: false, message: apiData.Outmessage || "Invalid user" }
            }

            // Capture cookies from Branch Response (e.g. sys_PAW might be here or updated)
            const branchCookies = branchResponse.headers["set-cookie"]
            if (branchCookies && Array.isArray(branchCookies)) {
                console.log("Login Action: Setting Branch cookies:", branchCookies.length)
                branchCookies.forEach((cookieStr) => {
                    const firstPart = cookieStr.split(";")[0]
                    const [name, value] = firstPart.split("=")
                    if (name && value) {
                        cookieStore.set({
                            name: name.trim(),
                            value: value.trim(),
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            path: '/',
                            sameSite: 'lax',
                            maxAge: 60 * 60 * 24 // 1 day
                        })
                    }
                })
            }

            // Return data for client logic
            return {
                success: true,
                data: apiData,
                token: token || apiData.Token
            }
        } else {
            return {
                success: false,
                message: branchData.Data?.ErrMessage || "Failed to get branch details",
            }
        }

    } catch (error: any) {
        console.error("Login Action Error:", error.message)
        if (error.response) {
            console.error("Login Action Error Data:", error.response.data)
        }
        return { success: false, message: error.message || "An unexpected error occurred" }
    }
}
