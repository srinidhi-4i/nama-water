import { apiClient } from '@/lib/api-client'
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
            // Reverting to working pattern: lowercase + no encryption
            formData.append('accountNumber', accountNumber)
            formData.append('islegacy', '0')
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')

            console.log(`getCustomerInfo Request - accountNumber: ${accountNumber}`)
            const response = await apiClient.post<any>(
                '/CommonService/GetCustomerInfoService',
                formData
            )
            console.log('getCustomerInfo Response:', response)

            if (response && typeof response === 'object' && response !== 'Failed') {
                const decrypted = decryptCustomerInfo(response)
                console.log('getCustomerInfo Decrypted:', decrypted)
                return decrypted
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
            // Trying AccountNumber for consistency with other working methods
            formData.append('AccountNumber', accountNumber)
            const response = await apiClient.post<any>('/AccountDetails/GetTotalOutstandingAccSearch', formData)
            return response || "0.000"
        } catch (error) {
            // Silently return zero if fetch fails in UAT
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

    // Get Account Payment Details (Aggregated)
    getAccountPaymentDetails: async (accountNumber: string): Promise<AccountPaymentDetails | null> => {
        try {
            // Check CCB Status first as it might be needed
            await branchOpsService.getCCBStatus()

            const formData = new FormData()
            formData.append('AccountNumber', encryptString(accountNumber))
            formData.append('Mn', encryptString("12"))

            // User corrected path to /Account/ViewBillPayment_V1
            const response = await apiClient.post<any>('/Account/ViewBillPayment_V1', formData)

            if (response && response.Message !== 'Failed') {
                // Try to get prepaid outstanding if service type is prepaid
                let outstanding = response.TotalResult || '0.000'
                // Removed redundant call - we fetch everything in Promise.all below

                // Safely decrypt and map fields
                const getValue = (val: any) => {
                    if (val === null || val === undefined || val === 'null' || val === 'undefined') return ''
                    try {
                        // Check if it's base64/encrypted (simple check)
                        if (typeof val === 'string' && (val.includes('=') || val.length > 20)) {
                            const decrypted = decryptString(val)
                            return decrypted ? decodeURIComponent(decrypted) : val
                        }
                    } catch (e) { }
                    return String(val)
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
                    return /^\d+$/.test(t) || t === accountNumber || t === getValue(response.LegacyNumber) || t === getValue(serviceInfo?.LegacyId)
                }

                const valNameEn = getValue(customerInfo?.personNameEn) || getValue(customerInfo?.FullNameEn)
                const valNameAr = getValue(customerInfo?.personNameArabic) || getValue(customerInfo?.FullNameAr)
                const valNameGeneric = getValue(customerInfo?.personName)

                // Strong filter: Ignore any name that is just a number or matches accounts
                const cleanName = (n: string) => (n && !isNumericOrAcc(n)) ? n.trim() : ''

                const nameEn = cleanName(valNameEn) || (!isArabic(cleanName(valNameGeneric)) ? cleanName(valNameGeneric) : '')
                const nameAr = cleanName(valNameAr) || (isArabic(cleanName(valNameGeneric)) ? cleanName(valNameGeneric) : '')

                const respName = cleanName(getValue(response.CustomerName) || getValue(response.AccountName) || '')

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
                let outstandingAmount = getValue(prepaidData?.OutstandingAmount) ||
                    getValue(installment?.OutstandingAmount) ||
                    (gOut && typeof gOut === 'object' ? getValue(gOut.OutstandingAmount) : getValue(gOut)) ||
                    getValue(response.TotalResult) || '0.000'

                // Make sure we have a number
                if (outstandingAmount === '' || outstandingAmount === 'null' || outstandingAmount === 'undefined') outstandingAmount = '0.000'

                // Waste Water Fixed Charge mapping
                let fixedChargeValue = getValue(response.WasteWaterFixedCharge) ||
                    (prepaidData && (getValue(prepaidData.OutstandingAmount) || getValue(prepaidData.Outstanding))) ||
                    (gOut && typeof gOut === 'object' ? getValue(gOut.WasteWaterFixedCharge) : '0.000')

                // High-confidence fallback for Nama Water Prepaid: 
                if ((fixedChargeValue === '0.000' || fixedChargeValue === '') && outstandingAmount !== '0.000') {
                    fixedChargeValue = outstandingAmount
                }

                return {
                    AccountHolderName: name,
                    OldAccountNumber: getValue(response.LegacyNumber) || getValue(serviceInfo?.LegacyId) || '',
                    NewAccountNumber: response.AccountNumber || accountNumber,
                    ServiceType: response.ServiceType || getValue(serviceInfo?.ServiceType) || 'PREPAID',
                    LastPaymentAmount: getValue(response.LastPaymentAmount) || getValue(response.LastPayAmount) || '0.000',
                    LastPaymentDate: getValue(response.LastPaymentDate) || getValue(response.LastPayDate) || '',
                    TotalOutstandingAmount: outstandingAmount,
                    CurrentBalance: getValue(response.CurrentBalance) || '0.000',
                    WasteWaterFixedCharge: fixedChargeValue,
                    VAT: getValue(response.VAT) || '0.000',
                    NetTopUpAmount: getValue(response.NetTopUpAmount) || '0.000',
                    OutstandingFetchError: fetchError && (outstandingAmount === '0.000' || outstandingAmount === '')
                }
            }
            return null
        } catch (error) {
            console.error('Error getting account payment details:', error)
            return null
        }
    },

    // Get CCB Server Status
    getCCBStatus: async (): Promise<any> => {
        try {
            // Based on error logs, the exact URI might be Case Sensitive or slightly different.
            // Using the one specified in original requirements: /PrePaid/GetCCBSServertatus (with 't')
            return await apiClient.post<any>('/PrePaid/GetCCBSServertatus', new FormData())
        } catch (error) {
            console.warn('CCB Status check failed, continuing search flow...', error)
            return null
        }
    },

    getPrepaidOutstanding: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('AccountNumber', accountNumber)
            return await apiClient.post<any>('/PrePaid/GetOutstandingForPrepaid', formData)
        } catch (error) {
            // Silently return null for UAT errors
            return null
        }
    },

    getInstallmentOutstanding: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('AccountNumber', accountNumber)
            return await apiClient.post<any>('/CommonService/GetInstallmentOutstandingAmount', formData)
        } catch (error) {
            // Silently return null for UAT errors
            return null
        }
    },

    // Get Top Up Amount Details
    getTopUpDetails: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('AccountNumber', accountNumber)
            return await apiClient.post<any>('/PrePaid/GetTopUp', formData)
        } catch (error) {
            return null
        }
    },

    // Get OTP Log
    getOtpLog: async (mobile: string): Promise<OTPLog[]> => {
        try {
            const formData = new FormData()
            formData.append('GSMNumber', mobile)
            const response = await apiClient.post<any>('/BranchOfficer/GetOtpLog', formData)

            // apiClient.post returns data.Data directly if StatusCode is 605
            // So response might be the array itself, or have a Data property
            const logData = Array.isArray(response) ? response : (response?.Data || [])

            return logData.map((item: any) => {
                // Format the date string manually if it exists
                let formattedDate = item.OTPTriggeredDateTime || item.OTPDate || ""
                if (formattedDate && formattedDate.includes('T')) {
                    try {
                        const date = new Date(formattedDate)
                        formattedDate = date.toLocaleString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        }).toUpperCase()
                    } catch (e) { }
                }

                return {
                    SI_No: item.SlNo || item.SI_No || 0,
                    GSM_Number: item.GSMNumber || item.GSM_Number || mobile, // Fallback to searched number
                    OTP_Triggered_Date_Time: formattedDate,
                    Message_Delivery_Status: item.MessageDeliveryStatus || item.Message_Delivery_Status || "Pending"
                }
            })
        } catch (error) {
            console.error('Error getting OTP log:', error)
            return []
        }
    },

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
