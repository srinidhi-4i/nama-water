import { apiClient } from '@/lib/api-client'
import {
    ValidationType,
    ValidationRequest,
    ValidationResponse,
    ROPUserDetails,
    CustomerInfo,
    AccountSearchResult,
    DEFAULT_VALIDATION_TYPES
} from '@/types/branchops.types'
import { encryptString, decryptString } from '@/lib/crypto'

export const branchOpsService = {
    // Get all validation types
    getValidationTypes: async (): Promise<ValidationType[]> => {
        try {
            const response = await apiClient.simplePost<any>('/BranchOfficer/GetAllList')

            if (response && Array.isArray(response) && response.length > 0) {
                return response
            } else if (response && response.ValidateTypes && Array.isArray(response.ValidateTypes) && response.ValidateTypes.length > 0) {
                return response.ValidateTypes
            }

            // Return default types if API fails or returns empty
            console.log('API returned invalid or empty validation types, using defaults')
            return DEFAULT_VALIDATION_TYPES
        } catch (error) {
            console.warn('Using default validation types due to API error:', error)
            return DEFAULT_VALIDATION_TYPES
        }
    },

    // Validate user by Civil ID, GSM, or CR Number
    validateUser: async (type: string, value: string): Promise<ValidationResponse> => {
        try {
            const formData = new FormData()

            // Determine parameter name based on type
            let paramName = ''
            let paramValue = value

            switch (type) {
                case 'GSM_NUMBER':
                    paramName = 'gsmNumber'
                    paramValue = '968' + value // Add prefix
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

            const response = await apiClient.post<any>(
                '/BranchOfficer/GetBranchOfficerCivilID',
                formData
            )

            if (response === 'Failed' || !response) {
                return {
                    success: false,
                    message: 'User not found'
                }
            }

            if (response && response.UserID) {
                // Chain call to get full user details
                const userDetails = await branchOpsService.getUserDetails(response.UserID)
                return {
                    success: true,
                    data: userDetails || response
                }
            }

            return {
                success: true,
                data: response
            }
        } catch (error: any) {
            console.warn('API/Validation failed:', error)
            // Mock Fallback removed to expose real error
            throw error
        }
    },

    // Get User Details by UserID (Helper for ValidateUser chain)
    getUserDetails: async (userId: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('userID', userId)

            const response = await apiClient.post<any>(
                '/UserActionWeb/GetUserDetailsByUserID',
                formData
            )

            if (response && response.UserID) {
                // Decrypt fields as per reference user.actions.js
                const decryptedUser = {
                    ...response,
                    FullNameEn: response.FullNameEn ? decodeURIComponent(decryptString(response.FullNameEn)) : response.FullNameEn,
                    FullNameAr: response.FullNameAr ? decodeURIComponent(decryptString(response.FullNameAr)) : response.FullNameAr,
                    MobileNumber: response.MobileNumber ? decodeURIComponent(decryptString(response.MobileNumber)) : response.MobileNumber,
                    EmailID: response.EmailID ? decodeURIComponent(decryptString(response.EmailID)) : response.EmailID
                }
                return decryptedUser
            }
            return response
        } catch (error) {
            console.error('Error getting user details:', error)
            return null
        }
    },

    // Get ROP user details
    getROPUserDetails: async (civilId: string, expiryDate: string): Promise<ValidationResponse> => {
        try {
            const formData = new FormData()
            formData.append('civilId', encryptString(civilId))
            formData.append('expiryDate', encryptString(expiryDate))

            const response = await apiClient.post<any>(
                '/BranchOfficer/GetROPUserDetails',
                formData
            )

            if (!response || response === 'Failed') {
                return {
                    success: false,
                    message: 'ROP user details not found'
                }
            }

            // Decrypt response fields
            const ropUserDetails: ROPUserDetails = {
                FullNameAr: response.FullNameAr ? decodeURIComponent(decryptString(response.FullNameAr)) : '',
                FullNameEn: response.FullNameEn ? decodeURIComponent(decryptString(response.FullNameEn)) : '',
                ExpiryDate: expiryDate,
                NationalIDOrCivilID: civilId,
                GsmNumber: response.GSMNumber ? decodeURIComponent(decryptString(response.GSMNumber)) : ''
            }

            return {
                success: true,
                data: ropUserDetails
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get ROP user details'
            }
        }
    },

    // Get service type for account
    getServiceType: async (accountNumber: string): Promise<AccountSearchResult | null> => {
        try {
            const formData = new FormData()
            // Encrypt account number for this specific API call
            formData.append('accountNumber', encryptString(accountNumber))

            const response = await apiClient.post<any>(
                '/CommonService/GetServiceType',
                formData
            )

            if (response) {
                return {
                    AccountNumber: response.AccountNumber || accountNumber,
                    ServiceType: response.ServiceType || '',
                    LegacyId: response.LegacyId || '',
                    CCBAccountNumber: response.AccountNumber || ''
                }
            }

            return null
        } catch (error) {
            console.error('Error getting service type:', error)
            return null
        }
    },

    // Get customer info
    getCustomerInfo: async (accountNumber: string, isLegacy: boolean = false): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('accountNumber', accountNumber)
            // Hardcode islegacy to 0 (number) as per reference
            formData.append('islegacy', '0')
            formData.append('sourceType', 'Web')

            const response = await apiClient.post<any>(
                '/CommonService/GetCustomerInfoService',
                formData
            )

            if (response && typeof response === 'object' && response !== 'Failed') {
                return decryptCustomerInfo(response)
            }

            return null
        } catch (error) {
            console.error('Error getting customer info:', error)
            return null
        }
    },

    // Get AQ URL from service number
    getAQUrl: async (serviceNumber: string): Promise<{ url: string; token: string } | null> => {
        try {
            const formData = new FormData()
            formData.append('SRNo', serviceNumber)
            formData.append('ENV', 'UAT')

            const response = await apiClient.post<any>(
                '/BranchOfficer/GetAQUrlfromServiceNo',
                formData
            )

            if (response && response.AQURL && response.ViewFormToken) {
                return {
                    url: response.AQURL,
                    token: response.ViewFormToken
                }
            }

            return null
        } catch (error) {
            console.error('Error getting AQ URL:', error)
            return null
        }
    },

    // Get total outstanding amount
    getTotalOutstandingAmount: async (accountNumber: string): Promise<string> => {
        try {
            const formData = new FormData()
            formData.append('accountNum', accountNumber)
            const response = await apiClient.post<any>('/AccountDetails/GetTotalOutstandingAccSearch', formData)
            return response || "0.000"
        } catch (error) {
            console.error('Error getting total outstanding amount:', error)
            return "0.000"
        }
    },

    // Get My Request Dashboard Data (Summary)
    getMyRequestDashboard: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('accountNum', accountNumber)
            formData.append('Option', '') // Default option
            const response = await apiClient.post<any>('/MyRequest/GetDashboradMyRequestAccSearch', formData)
            return response
        } catch (error) {
            console.error('Error getting my request dashboard:', error)
            return null
        }
    },

    // Get Payment Transaction Count / History
    getPaymentHistory: async (accountNumber: string): Promise<any[]> => {
        try {
            const formData = new FormData()
            formData.append('accountNum', accountNumber)
            formData.append('fromDate', '')
            formData.append('toDate', '')
            const response = await apiClient.post<any[]>('/AccountDetails/GetPaymentDashboardHistoryAccSearch', formData)
            return response || []
        } catch (error) {
            console.error('Error getting payment history:', error)
            return []
        }
    },

    // Get AMR Alert History
    getAMRAlertHistory: async (accountNumber: string): Promise<any[]> => {
        try {
            const formData = new FormData()
            // Hardcoded params as per reference
            formData.append('langCode', 'EN')
            formData.append('LegacyIDs', 'ALL')
            formData.append('AlertType', 'ALL')
            formData.append('ServiceType', 'ALL')

            // Date range: Last month to today
            const today = new Date()
            const lastMonth = new Date(today)
            lastMonth.setMonth(today.getMonth() - 1)

            const formatDate = (date: Date) => {
                const year = date.getFullYear()
                const month = (date.getMonth() + 1).toString().padStart(2, '0')
                const day = date.getDate().toString().padStart(2, '0')
                return `${year}-${month}-${day}`
            }

            formData.append('Start_Date', formatDate(lastMonth))
            formData.append('End_Date', formatDate(today))


            const response = await apiClient.post<any[]>('/WaterLeakAlarm/GetAMRAlertHistoryAccSearch', formData)
            return response || []
        } catch (error) {
            console.error('Error getting AMR alert history:', error)
            return []
        }
    },

    // Get My Request List
    getMyRequestList: async (accountNumber: string): Promise<any[]> => {
        try {
            const formData = new FormData()
            formData.append('accountNum', accountNumber)
            formData.append("langCode", "EN")
            formData.append("ServiceNo", "null")
            formData.append("RequestedDate", "null")
            formData.append("ServiceName", "null")
            formData.append("ToDate", "null")

            const response = await apiClient.post<any[]>('/MyRequest/GetMyRequestAccSearch', formData)
            return response || []
        } catch (error) {
            console.error('Error getting request list:', error)
            return []
        }
    },

    // Get Appointment List
    getAppointmentList: async (accountNumber: string): Promise<any[]> => {
        try {
            const formData = new FormData()
            formData.append('accountNum', accountNumber)
            // Reference doesn't show params clearly in view_file but typically accountNum
            const response = await apiClient.post<any>('/BranchOfficer/GetAppointmentDetailsForAccount', formData)
            return response?.Table || []
        } catch (error) {
            console.error('Error getting appointment list:', error)
            return []
        }
    },


    // Get Change Service Type Details
    getChangeServiceTypeDet: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('accountNumber', encryptString(accountNumber))
            const response = await apiClient.post<any>('/BranchOfficer/GetChangeServiceTypeDet', formData)
            return response
        } catch (error) {
            console.error('Error getting change service type details:', error)
            return null
        }
    },

    // Get Service Names
    getServiceNames: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()

            const response = await apiClient.post<any>('/MyRequest/GetServiceNamesAccSearch', formData)
            return response
        } catch (error) {
            console.error('Error getting service names:', error)
            return null
        }
    },

    // Get Outstanding By Group
    getOutstandingByGroup: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('accountNum', accountNumber)
            const response = await apiClient.post<any>('/AccountDetails/GetOutstandingByGroupAccSearch', formData)
            return response
        } catch (error) {
            console.error('Error getting outstanding by group:', error)
            return null
        }
    },

    // Get Consumption Data (Monthly)
    getConsumptionData: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('AccountNumber', accountNumber)
            const response = await apiClient.post<any>('/AccountDetails/GetActConsumptionDataMonthlyAccSearch', formData)
            return response
        } catch (error) {
            console.error('Error getting consumption data:', error)
            return null
        }
    },

    // View Bill Payment
    viewBillPayment: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('AccountNumber', encryptString(accountNumber))
            formData.append('Mn', encryptString("12")) // Hardcoded as per reference
            const response = await apiClient.post<any>('/AccountDetails/ViewBillPayment_V1', formData)
            return response
        } catch (error) {
            console.error('Error viewing bill payment:', error)
            return null
        }
    },

    // Logout
    logout: async (): Promise<boolean> => {
        try {
            await apiClient.simplePost('/InternalPortal/LogOut')
            return true
        } catch (error) {
            console.error('Error during logout:', error)
            return false
        }
    },
}

// Helper for decrypting customer info fields (using function declaration for hoisting)
function decryptCustomerInfo(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj

    const keysToDecrypt = [
        'personName',
        'personNameArabic',
        'tenantEmailId',
        'tenantGsmNumber',
        'tenantNameEn',
        'tenantNameAr',
        'gsmNumber',
        'civilId',
        'emailId',
    ]

    const result = { ...obj }
    keysToDecrypt.forEach(key => {
        const val = result[key]
        if (val !== null && val !== undefined && val !== 'null' && val !== 'undefined' && val !== '') {
            try {
                const decrypted = decryptString(val)
                if (decrypted) {
                    result[key] = decrypted
                }
            } catch (e) {
                // Not encrypted or decryption failed, keep original
            }
        }
    })
    return result
}
