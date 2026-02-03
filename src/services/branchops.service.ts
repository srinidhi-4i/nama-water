import { api } from '@/lib/axios'
import {
    ValidationType,
    ValidationRequest,
    ValidationResponse,
    ROPUserDetails,
    CustomerInfo,
    AccountSearchResult,
    AccountPaymentDetails,
    DEFAULT_VALIDATION_TYPES,
    OTPLog
} from '@/types/branchops.types'
import { encryptString, decryptString } from '@/lib/crypto'

// In-memory cache for static/infrequently changing data
const cache: {
    validationTypes: ValidationType[] | null;
} = {
    validationTypes: null
}

export const branchOpsService = {
    // Get all validation types
    getValidationTypes: async (): Promise<ValidationType[]> => {
        // Return cached data if available
        if (cache.validationTypes) {
            return cache.validationTypes
        }

        try {
            // Use empty FormData to trigger multipart/form-data
            const formData = new FormData()
            const response = await api.post<any>('/BranchOfficer/GetAllList', formData)
            const data = response.data.Data || response.data

            let types: ValidationType[] = DEFAULT_VALIDATION_TYPES

            if (data && Array.isArray(data) && data.length > 0) {
                types = data
            } else if (data && data.ValidateTypes && Array.isArray(data.ValidateTypes) && data.ValidateTypes.length > 0) {
                types = data.ValidateTypes
            }

            // Update cache
            cache.validationTypes = types
            return types
        } catch (error) {
            // Silently fallback to default types
            return DEFAULT_VALIDATION_TYPES
        }
    },

    // Validate user by Civil ID, GSM, or CR Number
    validateUser: async (type: string, value: string): Promise<ValidationResponse> => {
        try {
            const formData = new FormData()
            let paramName = ''
            let paramValue = value.trim() // Ensure whitespace is removed

            switch (type) {
                case 'GSM_NUMBER':
                    paramName = 'gsmNumber' // UAT uses camelCase and 968 prefix
                    if (!paramValue.startsWith('968')) {
                        paramValue = '968' + paramValue
                    }
                    break
                case 'CIVIL_ID':
                    paramName = 'civilId' // Match UAT camelCase exactly
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

            // Log final payload for debugging
            const payload: any = {}
            formData.forEach((val, key) => { payload[key] = val })
            console.log(`validateUser Payload [${type}]:`, payload)

            const response = await api.post<any>(
                '/BranchOfficer/GetBranchOfficerCivilID',
                formData
            )

            const data = response.data

            if (data.StatusCode === 612) {
                return {
                    success: false,
                    message: "Session expired. Please login again."
                }
            }

            if (data === 'Failed' || !data || data.StatusCode === 606 || (typeof data.Data === 'string' && data.Data.includes('User not found'))) {
                return {
                    success: false,
                    message: 'User not found'
                }
            }

            // Handle both unwrapped (apiClient style) and wrapped (api style) data
            const UserID = data.Data?.UserID || data.UserID

            if (UserID) {
                const userDetails = await branchOpsService.getUserDetails(UserID)

                // Sync with ROP/MOC as per UAT flow (Uses UserId and CustomerType)
                if (userDetails) {
                    console.log('Syncing ROP/MOC data for UserID:', UserID)
                    await branchOpsService.getROPMOCSyncData(UserID, userDetails.CustomerType || 'IND')
                }

                return {
                    success: true,
                    data: userDetails || data.Data || data
                }
            }

            return {
                success: true,
                data: data.Data || data
            }
        } catch (error: any) {
            // Handle GSM specific not available message if requested by UI logic
            return {
                success: false,
                message: type === 'GSM_NUMBER' ? 'GSM number not available' : (error.message || 'Validation failed')
            }
        }
    },

    // Get User Details by UserID (Helper for ValidateUser chain)
    getUserDetails: async (userId: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('userID', userId) // UAT uses camelCase userID
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')
            formData.append('islegacy', '0')

            const response = await api.post<any>(
                '/UserActionWeb/GetUserDetailsByUserID',
                formData
            )

            const data = response.data.Data || response.data

            if (data && typeof data === 'object') {
                return {
                    ...data,
                    FullNameEn: data.FullNameEn ? decodeURIComponent(decryptString(data.FullNameEn)) : '',
                    FullNameAr: data.FullNameAr ? decodeURIComponent(decryptString(data.FullNameAr)) : '',
                    // Contact details and IDs are plaintext in this API response
                    MobileNumber: data.MobileNumber || '',
                    EmailID: data.EmailID || '',
                    ExpiryDate: data.ExpiryDate || '',
                    CustomerType: data.CustomerTypeName || data.PersonType || ''
                }
            }
            return data
        } catch (error) {
            return null
        }
    },

    // Get ROP/MOC sync data
    getROPMOCSyncData: async (userId: string, customerType: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('UserId', userId) // UAT uses PascalCase UserId
            formData.append('CustomerType', customerType) // UAT uses PascalCase CustomerType
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')
            formData.append('islegacy', '0')

            const response = await api.post<any>(
                '/UserActionWeb/GetROPMOCSyncData',
                formData
            )

            const data = response.data
            console.log('GetROPMOCSyncData Response:', data)
            return data.Data || data
        } catch (error) {
            return null
        }
    },

    // Get ROP user details
    getROPUserDetails: async (civilId: string, expiryDate: string): Promise<ValidationResponse> => {
        try {
            const formData = new FormData()
            formData.append('CivilID', encryptString(civilId))
            formData.append('ExpiryDate', encryptString(expiryDate))
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')
            formData.append('islegacy', '0')

            const response = await api.post<any>(
                '/BranchOfficer/GetROPUserDetails',
                formData
            )

            const data = response.data.Data || response.data

            if (!data || data === 'Failed') {
                return {
                    success: false,
                    message: 'ROP user details not found'
                }
            }

            const ropUserDetails: ROPUserDetails = {
                FullNameAr: data.FullNameAr ? decodeURIComponent(decryptString(data.FullNameAr)) : '',
                FullNameEn: data.FullNameEn ? decodeURIComponent(decryptString(data.FullNameEn)) : '',
                ExpiryDate: expiryDate,
                NationalIDOrCivilID: civilId,
                GsmNumber: data.GSMNumber ? decodeURIComponent(decryptString(data.GSMNumber)) : ''
            }

            return {
                success: true,
                data: ropUserDetails
            }
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to get ROP user details'
            }
        }
    },

    // Get service type for account
    getServiceType: async (accountNumber: string): Promise<AccountSearchResult | null> => {
        try {
            const formData = new FormData()
            formData.append('accountNumber', encryptString(accountNumber))
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')

            const response = await api.post<any>(
                '/CommonService/GetServiceType',
                formData
            )

            const data = response.data.Data || response.data

            if (data) {
                return {
                    AccountNumber: data.AccountNumber || accountNumber,
                    ServiceType: data.ServiceType || '',
                    LegacyId: data.LegacyId || '',
                    CCBAccountNumber: data.AccountNumber || ''
                }
            }

            return null
        } catch (error) {
            return null
        }
    },

    // Get customer info
    getCustomerInfo: async (accountNumber: string, isLegacy: boolean = false): Promise<any> => {
        try {
            const formData = new FormData()
            // Try lowercase 'accountNumber' - backend might be case-sensitive
            formData.append('accountNumber', accountNumber)
            formData.append('islegacy', isLegacy ? '1' : '0')
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')

            // Log what we're sending
            console.log('GetCustomerInfoService Request:', {
                accountNumber: accountNumber,
                islegacy: isLegacy ? '1' : '0',
                sourceType: 'Web',
                langCode: 'EN',
                endpoint: '/api/CommonService/GetCustomerInfoService'
            })

            const response = await api.post<any>(
                '/api/CommonService/GetCustomerInfoService',
                formData,
                { timeout: 60000 }
            )

            console.log('GetCustomerInfoService Raw Response:', response.data)

            const data = response.data.Data || response.data

            if (data && typeof data === 'object' && data !== 'Failed') {
                const decrypted = decryptCustomerInfo(data)
                return decrypted
            }

            return null
        } catch (error) {
            console.error('GetCustomerInfoService error:', error)
            return null
        }
    },

    // Get AQ URL from service number
    getAQUrl: async (serviceNumber: string): Promise<{ url: string; token: string } | null> => {
        try {
            const formData = new FormData()
            formData.append('SRNo', serviceNumber)
            formData.append('ENV', 'UAT')
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')

            const response = await api.post<any>(
                '/BranchOfficer/GetAQUrlfromServiceNo',
                formData
            )

            const data = response.data.Data || response.data

            if (data && data.AQURL && data.ViewFormToken) {
                return {
                    url: data.AQURL,
                    token: data.ViewFormToken
                }
            }

            return null
        } catch (error) {
            return null
        }
    },

    // Get total outstanding amount
    getTotalOutstandingAmount: async (accountNumber: string): Promise<string> => {
        try {
            const formData = new FormData()
            formData.append('accountNum', accountNumber)
            formData.append('langCode', 'EN')

            // Use /api and 60s timeout
            const response = await api.post<any>('/api/AccountDetails/GetTotalOutstandingAccSearch', formData, { timeout: 60000 })
            const data = response.data.Data
            // STRICT SAFETY: Only return data if it's a string/number. 
            if (typeof data === 'string' || typeof data === 'number') {
                return String(data)
            }
            return "0.000"
        } catch (error) {
            return "0.000"
        }
    },

    // Get My Request Dashboard Data (Summary)
    getMyRequestDashboard: async (accountNumber: string, option: string = ''): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('accountNum', accountNumber)
            // UAT expects Option: "" (All Time), "Month", or "Week"
            formData.append('Option', option === 'all' ? '' : (option === 'month' ? 'Month' : (option === 'week' ? 'Week' : option)))
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')

            // Use /api and 60s timeout for slow UAT
            const response = await api.post<any>('/api/MyRequest/GetDashboradMyRequestAccSearch', formData, { timeout: 60000 })
            const data = response.data.Data
            if (data && Array.isArray(data) && data.length > 0) {
                return data
            }
            return []
        } catch (error) {
            console.error('GetDashboradMyRequestAccSearch error:', error)
            return []
        }
    },

    // Get Payment Transaction Count / History
    getPaymentHistory: async (accountNumber: string, fromDate: string = '', toDate: string = ''): Promise<any[]> => {
        try {
            const formData = new FormData()
            formData.append('accountNum', accountNumber)
            formData.append('FromDate', fromDate)
            formData.append('ToDate', toDate)
            formData.append('langCode', 'EN')

            // Use /api and 60s timeout
            const response = await api.post<any>('/api/AccountDetails/GetPaymentDashboardHistoryAccSearch', formData, { timeout: 60000 })
            const data = response.data.Data
            if (Array.isArray(data)) return data
            return []
        } catch (error) {
            console.error('GetPaymentDashboardHistoryAccSearch error:', error)
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


            // Use /api and 60s timeout for slow UAT
            const response = await api.post<any>('/api/WaterLeakAlarm/GetAMRAlertHistoryAccSearch', formData, { timeout: 60000 })
            const data = response.data.Data
            if (Array.isArray(data)) return data
            return []
        } catch (error) {
            return []
        }
    },

    // Get My Request List
    getMyRequestList: async (accountNumber: string, legacyId?: string): Promise<any[]> => {
        const accs = [accountNumber]
        if (legacyId && legacyId !== accountNumber) accs.push(legacyId)

        // Only try the most reliable UAT endpoints
        const endpoints = [
            '/api/MyRequest/GetMyRequestAccSearch',
            '/api/MyRequest/GetMyRequestListAccSearch',
            '/api/MyRequest/GetMyRequest_AccSearch'
        ]

        for (const acc of accs) {
            for (const url of endpoints) {
                try {
                    const formData = new FormData()
                    formData.append('accountNum', acc)
                    formData.append('langCode', 'EN')

                    // Use empty strings instead of "null" as strings to avoid UAT rejections/crashes
                    formData.append("ServiceNo", "")
                    formData.append("RequestedDate", "")
                    formData.append("ServiceName", "")
                    formData.append("ToDate", "")

                    console.log(`[getMyRequestList] Trying ${url} with accountNum=${acc}`)
                    // Increased timeout to 60s for UAT search
                    const response = await api.post<any>(url, formData, { timeout: 60000 })
                    const data = response.data?.Data || response.data

                    if (data && (Array.isArray(data) && data.length > 0)) {
                        return data
                    }
                    if (data && data.Table && Array.isArray(data.Table) && data.Table.length > 0) {
                        return data.Table
                    }
                } catch (e: any) {
                    console.error(`[getMyRequestList] Failed ${url}:`, e.message)
                }
            }
        }

        return []
    },

    // Get Appointment List
    getAppointmentList: async (accountNumber: string): Promise<any[]> => {
        try {
            const formData = new FormData()
            formData.append('accountNumber', encryptString(accountNumber))
            // Reference doesn't show params clearly in view_file but typically accountNum
            const response = await api.post<any>('/BranchOfficer/GetAppointmentDetailsForAccount', formData)
            const data = response.data.Data
            if (data && Array.isArray(data.Table)) {
                return data.Table
            }
            return []
        } catch (error) {
            console.error('GetAppointmentDetailsForAccount error:', error)
            return []
        }
    },

    // Get Change Service Type Details
    getChangeServiceTypeDet: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('accountNumber', encryptString(accountNumber))
            const response = await api.post<any>('/BranchOfficer/GetChangeServiceTypeDet', formData)
            return response.data.Data || response.data
        } catch (error) {
            console.error('GetChangeServiceTypeDet error:', error)
            return null
        }
    },

    // Get Service Names
    getServiceNames: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()

            // Use /api and 60s timeout
            const response = await api.post<any>('/api/MyRequest/GetServiceNamesAccSearch', formData, { timeout: 60000 })
            return response.data.Data || response.data
        } catch (error) {
            return null
        }
    },

    // Get Menu Data
    getMenudata: async (): Promise<any[]> => {
        try {
            const formData = new FormData()
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')
            const response = await api.post<any>('/Menu/GetMenudata', formData)
            const data = response.data.Data || response.data
            return Array.isArray(data) ? data : []
        } catch (error) {
            return []
        }
    },

    // Get CCB Connection Status
    getCCBConnectionStatus: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('AccountNumber', accountNumber)
            // Use /api and 60s timeout
            const response = await api.post<any>('/api/Account/GetCCBConnectionStatus', formData, { timeout: 60000 })
            return response.data.Data || response.data
        } catch (error) {
            return null
        }
    },

    // Get Outstanding By Group
    getOutstandingByGroup: async (accountNumber: string): Promise<any[]> => {
        try {
            const formData = new FormData()
            // UAT often uses 'accountNum' (lowercase n) for Group Outstanding
            formData.append('accountNum', accountNumber)
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')

            // Increased timeout to 60s because UAT takes >30s for this call
            // Use /api prefix to hit local proxy route
            const response = await api.post<any>('/api/AccountDetails/GetOutstandingByGroupAccSearch', formData, { timeout: 60000 })
            const data = response.data.Data
            if (Array.isArray(data)) return data
            return []
        } catch (error: any) {
            console.error('GetOutstandingByGroupAccSearch error:', error?.message || error)
            return []
        }
    },

    // Get Consumption Data (Monthly)
    getConsumptionData: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('accountNum', accountNumber)
            // Use /api prefix to hit local proxy route for better header forwarding 
            // and increase timeout for slow UAT
            const response = await api.post<any>('/api/AccountDetails/GetActConsumptionDataMonthlyAccSearch', formData, { timeout: 60000 })
            const data = response.data.Data
            if (Array.isArray(data)) return data
            return []
        } catch (error) {
            return []
        }
    },

    // Get Consumption Data (Daily)
    getConsumptionDataDaily: async (accountNumber: string): Promise<any[]> => {
        const endpoints = [
            '/AccountDetails/GetActConsumptionDataDailyAccSearch',
            '/AccountDetails/GetConsumptionDataDailyAccSearch'
        ]

        for (const url of endpoints) {
            try {
                const formData = new FormData()
                formData.append('accountNum', accountNumber)
                // Hits local proxy and use longer timeout for slow UAT
                const apiUrl = url.startsWith('/api') ? url : `/api${url}`
                const response = await api.post<any>(apiUrl, formData, { timeout: 60000 })
                if (response.data && Array.isArray(response.data.Data)) return response.data.Data
            } catch (error) { }
        }
        return []
    },

    // Get SMR History (Last Meter Reading)
    getSMRHistory: async (accountNumbers: string[]): Promise<any[]> => {
        try {
            const formData = new FormData()
            // UAT expects CSV of account IDs
            formData.append('AccountNo', accountNumbers.join(','))
            // Use /api and 60s timeout
            const response = await api.post<any>('/api/AccountDetails/GetSMRHistory', formData, { timeout: 60000 })
            const data = response.data.Data
            return Array.isArray(data) ? data : []
        } catch (error) {
            console.error('GetSMRHistory error:', error)
            return []
        }
    },

    // Get Consumption Data (Hourly)
    getConsumptionDataHourly: async (accountNumber: string): Promise<any[]> => {
        const endpoints = [
            '/AccountDetails/GetActConsumptionDataHourlyAccSearch',
            '/AccountDetails/GetConsumptionDataHourlyAccSearch'
        ]

        for (const url of endpoints) {
            try {
                const formData = new FormData()
                formData.append('accountNum', accountNumber)
                // Hits local proxy and use longer timeout for slow UAT
                const apiUrl = url.startsWith('/api') ? url : `/api${url}`
                const response = await api.post<any>(apiUrl, formData, { timeout: 60000 })
                if (response.data && Array.isArray(response.data.Data)) return response.data.Data
            } catch (error) { }
        }
        return []
    },

    // View Bill Payment
    viewBillPayment: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('accountNum', accountNumber)
            const currentMonth = new Date().getMonth() + 1
            formData.append('Mn', encryptString(String(currentMonth)))
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')
            // Use /api and 60s timeout
            const response = await api.post<any>('/api/AccountDetails/ViewBillPayment_V1', formData, { timeout: 60000 })
            return response.data.Data || response.data
        } catch (error) {
            return null
        }
    },

    // Get Account Payment Details (Aggregated)
    getAccountPaymentDetails: async (accountNumber: string): Promise<AccountPaymentDetails | null> => {
        try {
            const formData = new FormData()
            formData.append('accountNum', accountNumber)
            const currentMonth = new Date().getMonth() + 1
            formData.append('Mn', encryptString(String(currentMonth)))
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')

            const response = await api.post<any>('/AccountDetails/ViewBillPayment_V1', formData)
            let responseData = response.data.Data || response.data

            // Handle if response is an array
            if (Array.isArray(responseData) && responseData.length > 0) {
                responseData = responseData[0]
            }

            // Handle double wrapping if backend returns { Status: "Success", Data: { Data: { ... } } }
            if (responseData && responseData.Data && typeof responseData.Data === 'object' && !responseData.CustomerName) {
                responseData = responseData.Data
            }

            // DEBUG LOG: Please check this in the browser console
            console.log('RAW VIEW_BILL_PAYMENT Keys:', Object.keys(responseData || {}))
            console.log('RAW VIEW_BILL_PAYMENT Preview:', JSON.stringify(responseData).substring(0, 500))

            if (responseData && responseData.Message !== 'Failed') {
                // Try to get prepaid outstanding if service type is prepaid
                let outstanding = responseData.TotalResult || '0.000'
                // Removed redundant call - we fetch everything in Promise.all below

                // Safely decrypt and map fields
                const getValue = (val: any) => {
                    if (val === null || val === undefined || val === 'null' || val === 'undefined') return ''
                    if (typeof val !== 'string') return String(val)

                    try {
                        // Only try to decrypt if it looks like Base64 and NOT masked (doesn't contain *)
                        // Base64 strings for these APIs are usually > 24 chars and often end in =
                        if ((val.includes('=') || val.length > 24) && !val.includes('*')) {
                            const decrypted = decryptString(val)
                            if (decrypted && decrypted.length > 0) {
                                return decodeURIComponent(decrypted)
                            }
                        }
                    } catch (e) { }
                    return val
                }

                console.log(`Fetching aggregated details for: ${accountNumber}`)
                const [customerInfo, serviceInfo, prepaidData, installment, generalOutstanding] = await Promise.all([
                    branchOpsService.getCustomerInfo(accountNumber),
                    branchOpsService.getServiceType(accountNumber),
                    branchOpsService.getPrepaidOutstanding(accountNumber),
                    branchOpsService.getInstallmentOutstanding(accountNumber),
                    branchOpsService.getTotalOutstandingAmount(accountNumber)
                ])

                // Identify if any outstanding-related call failed (returned null or 0.000 unexpectedly)
                const fetchError = !prepaidData || !installment || (generalOutstanding === "0.000" && !prepaidData)

                console.log('Parallel fetch results:', {
                    hasCustomerInfo: !!customerInfo,
                    hasPrepaid: !!prepaidData,
                    hasInstallment: !!installment,
                    generalOutstanding,
                    fetchError
                })

                // Prioritize English name mapping with Arabic detection
                const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text)
                const isNumericOrAcc = (text: string) => {
                    const t = text.trim()
                    return /^\d+$/.test(t) || t === accountNumber || t === getValue(responseData.LegacyNumber) || t === getValue(serviceInfo?.LegacyId)
                }

                const valNameEn = getValue(customerInfo?.personNameEn) || getValue(customerInfo?.FullNameEn) || getValue(customerInfo?.PersonNameEn) || getValue(customerInfo?.CustomerNameEn) || getValue(customerInfo?.PNameEn)
                const valNameAr = getValue(customerInfo?.personNameArabic) || getValue(customerInfo?.FullNameAr) || getValue(customerInfo?.PersonNameArabic)
                const valNameGeneric = getValue(customerInfo?.personName) || getValue(customerInfo?.Name) || getValue(customerInfo?.CustomerName)

                // Strong filter: Ignore any name that is just a number or matches accounts
                const cleanName = (n: string) => (n && !isNumericOrAcc(n)) ? n.trim() : ''

                const nameEn = cleanName(valNameEn) || (!isArabic(cleanName(valNameGeneric)) ? cleanName(valNameGeneric) : '')
                const nameAr = cleanName(valNameAr) || (isArabic(cleanName(valNameGeneric)) ? cleanName(valNameGeneric) : '')

                const respName = cleanName(
                    getValue(responseData.CustomerName) ||
                        getValue(responseData.ConsumerName) ||
                        getValue(responseData.AccountName) ||
                        getValue(responseData.customerName) ||
                        getValue(responseData.consumerName) ||
                        getValue(responseData.accountName) ||
                        getValue(responseData.AccountHolderName) ||
                        getValue(responseData.Account_Holder_Name) ||
                        getValue(responseData.Consumer_Name) ||
                        getValue(responseData.DisplayName) ||
                        getValue(responseData.CustomerFullname) ||
                        getValue(responseData.FullName) ||
                        getValue(responseData.fullNameEn) ||
                        getValue(responseData.FullNameEn) ||
                        getValue(responseData.NameEn) ||
                        getValue(responseData.Name) ||
                        getValue(responseData.consumerNameEn) ||
                        getValue(responseData.PName) ||
                        getValue(responseData.PNameEn) ||
                        getValue(responseData.FullnameEn) ||
                        getValue(responseData.FULL_NAME) ||
                        // Aggressive pattern matching: Find ANY field that contains '*' (masked name) or starts with 'Mo'
                        Object.keys(responseData).find(k => {
                            const v = responseData[k];
                            return typeof v === 'string' && (v.includes('*') || v.startsWith('Mo')) && v.length > 2;
                        }) ? getValue(responseData[Object.keys(responseData).find(k => {
                            const v = responseData[k];
                            return typeof v === 'string' && (v.includes('*') || v.startsWith('Mo')) && v.length > 2;
                        })!]) : ''
                )

                const name = nameEn || respName || nameAr || ''

                console.log('Name Selection Debug:', {
                    rawEn: valNameEn,
                    rawAr: valNameAr,
                    rawGeneric: valNameGeneric,
                    respName,
                    finalName: name
                })

                // Fetch real outstanding amount
                const gOut: any = generalOutstanding

                // Waste Water Fixed Charge mapping - Check all possible sources
                let fixedChargeValue = getValue(installment?.wasteWaterDeductionAmount) ||
                    getValue(prepaidData?.wasteWaterFixedCharge) ||
                    getValue(responseData.WasteWaterFixedCharge) ||
                    (gOut && typeof gOut === 'object' ? getValue(gOut.WasteWaterFixedCharge) : '') || '0.000'

                let outstandingAmount = getValue(prepaidData?.OutstandingAmount) ||
                    getValue(prepaidData?.currentBalance) || // Prepaid balance might be the outstanding
                    getValue(installment?.OutstandingAmount) ||
                    (gOut && typeof gOut === 'object' ? getValue(gOut.OutstandingAmount) : getValue(gOut)) ||
                    getValue(responseData.TotalResult) || ''

                // Clean outstanding amount (if it's negative like in prepaid response, treat as positive outstanding)
                if (outstandingAmount.startsWith('-')) outstandingAmount = outstandingAmount.substring(1)

                // Make sure we have a number
                if (outstandingAmount === '' || outstandingAmount === 'null' || outstandingAmount === 'undefined') {
                    // Final fallback: if fixed charge > 0, use it as outstanding
                    outstandingAmount = (fixedChargeValue !== '0.000' && fixedChargeValue !== '') ? fixedChargeValue : '0.000'
                }

                // High-confidence fallback for fixed charge if it's missing but outstanding exists
                if ((fixedChargeValue === '0.000' || fixedChargeValue === '') && (outstandingAmount !== '0.000' && outstandingAmount !== '')) {
                    fixedChargeValue = outstandingAmount
                }

                // Fetch additional details if needed
                const topUpDet = responseData.ServiceType === 'PREPAID' ? await branchOpsService.getTopUpDetails(accountNumber) : null
                const ccbStatus = await branchOpsService.getCCBStatus(accountNumber)

                console.log('Additional fetch results:', {
                    hasTopUpDet: !!topUpDet,
                    ccbStatus: ccbStatus?.CCBStatus || ccbStatus?.Status || ccbStatus
                })

                return {
                    AccountHolderName: name,
                    OldAccountNumber: getValue(responseData.LegacyNumber) || getValue(serviceInfo?.LegacyId) || '',
                    NewAccountNumber: responseData.AccountNumber || accountNumber,
                    ServiceType: responseData.ServiceType || getValue(serviceInfo?.ServiceType) || 'PREPAID',
                    LastPaymentAmount: getValue(responseData.LastPaymentAmount) || getValue(responseData.LastPayAmount) || '0.000',
                    LastPaymentDate: getValue(responseData.LastPaymentDate) || getValue(responseData.LastPayDate) || '',
                    TotalOutstandingAmount: outstandingAmount,
                    CurrentBalance: getValue(responseData.CurrentBalance) || '0.000',
                    CurrentBalanceM3: getValue(responseData.CurrentBalanceM3) || getValue(topUpDet?.CurrentBalanceM3) || '0',
                    WasteWaterFixedCharge: fixedChargeValue,
                    VAT: getValue(responseData.VAT) || '0.000',
                    NetTopUpAmount: getValue(responseData.NetTopUpAmount) || '0.000',
                    NetTopUpAmountM3: getValue(responseData.NetTopUpAmountM3) || '0',
                    InitialCredit: getValue(responseData.InitialCredit) || getValue(topUpDet?.InitialCredit) || '0.000',
                    InstallmentActiveFlag: responseData.InstallmentActiveFlag === 'Y' || !!installment?.OutstandingAmount,
                    CCBStatus: getValue(ccbStatus?.CCBStatus) || getValue(ccbStatus?.Status) || (ccbStatus === 'Active' ? 'Active' : ''),
                    OutstandingFetchError: fetchError && (outstandingAmount === '0.000' || outstandingAmount === '')
                }
            }
            return null
        } catch (error) {
            return null
        }
    },

    // Get CCB Server Status
    getCCBStatus: async (accountNumber?: string): Promise<any> => {
        try {
            const formData = new FormData()
            if (accountNumber) {
                formData.append('accountNum', accountNumber)
            }
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')
            const response = await api.post<any>('/api/PrePaid/GetCCBSServertatus', formData, { timeout: 60000 })
            return response.data.Data || response.data
        } catch (error) {
            return null
        }
    },

    getPrepaidOutstanding: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('accountNum', accountNumber)
            const response = await api.post<any>('/api/PrePaid/GetOutstandingForPrepaid', formData, { timeout: 60000 })
            return response.data.Data || response.data
        } catch (error) {
            return null
        }
    },

    getInstallmentOutstanding: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('accountNum', accountNumber)
            const response = await api.post<any>('/api/CommonService/GetInstallmentOutstandingAmount', formData, { timeout: 60000 })
            return response.data.Data || response.data
        } catch (error) {
            return null
        }
    },

    // Get Top Up Amount Details
    getTopUpDetails: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('AccountId', encryptString(accountNumber))
            // Use /api and 60s timeout
            const response = await api.post<any>('/api/PrePaid/GetTopUp', formData, { timeout: 60000 })
            return response.data.Data || response.data
        } catch (error) {
            return null
        }
    },

    // Check Transaction Status
    checkTransactionStatus: async (transactionId: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('TransactionID', transactionId)
            // Use /api and 60s timeout
            const response = await api.post<any>('/api/PrePaid/CheckTransactionStatus', formData, { timeout: 60000 })
            return response.data.Data || response.data
        } catch (error) {
            return null
        }
    },

    // Get OTP Log
    getOtpLog: async (mobile: string): Promise<OTPLog[]> => {
        try {
            const formData = new FormData()
            formData.append('GSMNumber', mobile)
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')
            const response = await api.post<any>('/BranchOfficer/GetOtpLog', formData)
            const data = response.data.Data || response.data || []
            const logData = Array.isArray(data) ? data : []

            return logData.map((item: any) => {
                let formattedDate = item.OTPTriggeredDateTime || item.OTPDate || ""
                if (formattedDate && formattedDate.includes('T')) {
                    try {
                        const date = new Date(formattedDate)
                        formattedDate = date.toLocaleString('en-GB', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true
                        }).toUpperCase()
                    } catch (e) { }
                }
                return {
                    SI_No: item.SlNo || item.SI_No || 0,
                    GSM_Number: item.GSMNumber || item.GSM_Number || mobile,
                    OTP_Triggered_Date_Time: formattedDate,
                    Message_Delivery_Status: item.MessageDeliveryStatus || item.Message_Delivery_Status || "Pending"
                }
            })
        } catch (error) {
            return []
        }
    },

    // Submit Guest Service (Generic)
    submitGuestService: async (endpoint: string, serviceType: string, processData: any): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('ServiceType', serviceType)
            formData.append('ProcessType', 'New')
            formData.append('SourceType', 'Web')
            formData.append('RequestedBy', '') // Empty for guest
            const now = new Date()
            const day = String(now.getDate()).padStart(2, '0')
            const month = String(now.getMonth() + 1).padStart(2, '0')
            const year = now.getFullYear()
            formData.append('RequestedTime', `${day}-${month}-${year}`)
            formData.append('SecurityToken', 'INTERTEC')
            if (processData.ServiceSeggreagation) {
                formData.append('ServiceSeggreagation', processData.ServiceSeggreagation.toString())
                delete processData.ServiceSeggreagation
            }
            formData.append('ProcessData', JSON.stringify({ ...processData, LanguageCode: 'EN' }))
            const response = await api.post<any>(`/${endpoint}`, formData)
            const data = response.data.Data || response.data
            if (data === 'Failed' || !data) return { success: false, message: 'Submission failed' }
            return { success: true, requestNumber: data }
        } catch (error: any) {
            return { success: false, message: error.message || 'Submission failed' }
        }
    },

    // Specific Guest Service Wrappers
    submitContractorWorkComplaint: (data: any) => branchOpsService.submitGuestService('CommonService/CWGuestSubmitNewDetails', 'CMCACWRK', data),
    submitWastewaterComplaint: (data: any) => branchOpsService.submitGuestService('CommonService/ReportWasteWaterSubmitNewDetails', 'WASTEWSRVC', data),
    submitWaterQualityComplaint: (data: any) => branchOpsService.submitGuestService('CommonService/ReportWaterQualitySubmitNewDetails', 'WATERQUALT', data),
    submitWaterLeakageComplaint: (data: any) => branchOpsService.submitGuestService('CommonService/ReportWaterLeakageSubmitNewDetails', 'WATERLEAK', data),
    submitWaterOverflowComplaint: (data: any) => branchOpsService.submitGuestService('CommonService/ReportWasteWaterSubmitNewDetails', 'WASTEWSRVC', data),
    submitSewerOdorComplaint: (data: any) => branchOpsService.submitGuestService('CommonService/ReportWasteWaterSubmitNewDetails', 'WASTEWSRVC', { ...data, ServiceSeggreagation: 2539 }),
    submitPressureComplaint: (data: any) => branchOpsService.submitGuestService('CommonService/OperationIssueSubmitNewDetails', 'WLOPRISU', data),
    submitCompanyVehicleComplaint: (data: any) => branchOpsService.submitGuestService('CommonService/VehicleComplaintSubmitNewDetails', 'VEHICLECOMP', data),

    getCustomerClass: async (): Promise<any[]> => {
        try {
            const formData = new FormData()
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')
            const response = await api.post<any>('/CustomerRegistrationWeb/GetCustomerClass', formData)
            const data = response.data.Data || response.data
            return Array.isArray(data) ? data : []
        } catch (error) {
            return []
        }
    },

    getMasterLanguage: async (): Promise<any[]> => {
        try {
            const formData = new FormData()
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')
            const response = await api.post<any>('/CustomerRegistrationWeb/GetMasterLanguage', formData)
            const data = response.data.Data || response.data
            return Array.isArray(data) ? data : []
        } catch (error) {
            return []
        }
    },

    validateNationalID: async (nationalId: string): Promise<ValidationResponse> => {
        try {
            const formData = new FormData()
            formData.append('NationalID', nationalId)
            formData.append('UserGuid', '')
            const response = await api.post<any>('/UserActionWeb/ValidateNationalID', formData)
            const data = response.data
            if (data.StatusCode === 605 && data.Status === 'success') {
                return { success: true, message: 'National ID validated', data: data.Data }
            }
            return { success: false, message: data.Message || 'National ID validation failed' }
        } catch (error: any) {
            return { success: false, message: error.message || 'National ID validation failed' }
        }
    },

    getROPGSMNumber: async (nationalId: string, expiryDate: string): Promise<ValidationResponse> => {
        try {
            const formData = new FormData()
            formData.append('NationalId', encryptString(nationalId))
            formData.append('ExpiryDate', encryptString(expiryDate))
            const response = await api.post<any>('/CommonService/GetROPGSMNumber', formData)
            const data = response.data
            if (data.StatusCode === 605 && data.Status === 'success') {
                return { success: true, message: 'ROP data retrieved', data: data.Data }
            }
            return { success: false, message: data.Data?.ResponseMessageEn || 'Failed to retrieve ROP data' }
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to retrieve ROP data' }
        }
    },

    submitIndividualRegistration: async (registrationData: any): Promise<ValidationResponse> => {
        try {
            const formData = new FormData()
            Object.keys(registrationData).forEach(key => {
                if (registrationData[key] !== null && registrationData[key] !== undefined) {
                    formData.append(key, String(registrationData[key]))
                }
            })
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')
            const response = await api.post<any>('/CustomerRegistrationWeb/RegisterCustomer', formData)
            const data = response.data
            if (data.StatusCode === 605 || data === 'Success') {
                return { success: true, message: 'Registration successful', data: data.Data || data }
            }
            return { success: false, message: data.Message || 'Registration failed' }
        } catch (error: any) {
            return { success: false, message: error.message || 'Registration failed' }
        }
    },

    submitCorporateRegistration: async (registrationData: any): Promise<ValidationResponse> => {
        try {
            const formData = new FormData()
            Object.keys(registrationData).forEach(key => {
                if (registrationData[key] !== null && registrationData[key] !== undefined) {
                    formData.append(key, String(registrationData[key]))
                }
            })
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')
            formData.append('CustomerType', 'CORP')
            const response = await api.post<any>('/CustomerRegistrationWeb/RegisterCustomer', formData)
            const data = response.data
            if (data.StatusCode === 605 || data === 'Success') {
                return { success: true, message: 'Registration successful', data: data.Data || data }
            }
            return { success: false, message: data.Message || 'Registration failed' }
        } catch (error: any) {
            return { success: false, message: error.message || 'Registration failed' }
        }
    },

    logout: async (): Promise<boolean> => {
        try {
            const formData = new FormData()
            await api.post('/InternalPortal/LogOut', formData)
            return true
        } catch (error) {
            console.error('Error during logout:', error)
            return false
        }
    }
}

// Helper for decrypting customer info fields (using function declaration for hoisting)
function decryptCustomerInfo(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj

    const keysToDecrypt = [
        'personName',
        'personNameEn',
        'personNameArabic',
        'FullNameEn',
        'FullNameAr',
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
        if (typeof val === 'string' && val !== '' && val !== 'null' && val !== 'undefined') {
            try {
                // Only try to decrypt if it looks like Base64 and NOT masked (doesn't contain *)
                if ((val.includes('=') || val.length > 24) && !val.includes('*')) {
                    const decrypted = decryptString(val)
                    if (decrypted && decrypted.length > 0) {
                        result[key] = decodeURIComponent(decrypted)
                    }
                }
            } catch (e) {
                // Not encrypted or decryption failed, keep original
            }
        }
    })
    return result
}
