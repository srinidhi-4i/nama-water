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

export const branchOpsService = {
    // Get all validation types
    getValidationTypes: async (): Promise<ValidationType[]> => {
        try {
            // Use empty FormData to trigger multipart/form-data
            const formData = new FormData()
            const response = await api.post<any>('/BranchOfficer/GetAllList', formData)
            const data = response.data.Data || response.data

            if (data && Array.isArray(data) && data.length > 0) {
                return data
            } else if (data && data.ValidateTypes && Array.isArray(data.ValidateTypes) && data.ValidateTypes.length > 0) {
                return data.ValidateTypes
            }

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
            let paramName = ''
            let paramValue = value.trim() // Ensure whitespace is removed

            switch (type) {
                case 'GSM_NUMBER':
                    paramName = 'GSMNumber' // Keep as is if getOtpLog works
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
                '/api/BranchOfficer/GetBranchOfficerCivilID',
                formData
            )

            const data = response.data
            console.log('validateUser Response:', data)

            if (data.StatusCode === 612) {
                console.warn('Backend returned 612 - Session or Token Invalid');
                return {
                    success: false,
                    message: "Session expired. Please login again."
                }
            }

            if (data === 'Failed' || !data || data.StatusCode === 606 || (data.Data === 'User not found')) {
                return {
                    success: false,
                    message: 'User not found'
                }
            }

            // Handle both unwrapped (apiClient style) and wrapped (api style) data
            const UserID = data.Data?.UserID || data.UserID

            if (UserID) {
                const userDetails = await branchOpsService.getUserDetails(UserID)
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
            console.warn('API/Validation failed:', error)
            throw error
        }
    },

    // Get User Details by UserID (Helper for ValidateUser chain)
    getUserDetails: async (userId: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('UserID', userId)
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
                    MobileNumber: data.MobileNumber ? decodeURIComponent(decryptString(data.MobileNumber)) : '',
                    EmailID: data.EmailID ? decodeURIComponent(decryptString(data.EmailID)) : '',
                    ExpiryDate: data.ExpiryDate ? decodeURIComponent(decryptString(data.ExpiryDate)) : '',
                    CustomerType: data.CustomerType ? decodeURIComponent(decryptString(data.CustomerType)) : ''
                }
            }
            return data
        } catch (error) {
            console.error('Error getting user details:', error)
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
                '/api/BranchOfficer/GetROPUserDetails',
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
            formData.append('AccountNumber', encryptString(accountNumber))
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
            console.error('Error getting service type:', error)
            return null
        }
    },

    // Get customer info
    getCustomerInfo: async (accountNumber: string, isLegacy: boolean = false): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('AccountNumber', accountNumber)
            formData.append('Islegacy', '0')
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')

            const response = await api.post<any>(
                '/CommonService/GetCustomerInfoService',
                formData
            )

            const data = response.data.Data || response.data

            if (data && typeof data === 'object' && data !== 'Failed') {
                const decrypted = decryptCustomerInfo(data)
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
            console.error('Error getting AQ URL:', error)
            return null
        }
    },

    // Get total outstanding amount
    getTotalOutstandingAmount: async (accountNumber: string): Promise<string> => {
        try {
            const formData = new FormData()
            formData.append('AccountNumber', accountNumber)
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')

            const response = await api.post<any>('/AccountDetails/GetTotalOutstandingAccSearch', formData)
            const data = response.data.Data || response.data
            return data || "0.000"
        } catch (error) {
            return "0.000"
        }
    },

    // Get My Request Dashboard Data (Summary)
    getMyRequestDashboard: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('AccountNum', accountNumber)
            formData.append('Option', '')
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')

            const response = await api.post<any>('/MyRequest/GetDashboradMyRequestAccSearch', formData)
            return response.data.Data || response.data
        } catch (error) {
            console.error('Error getting my request dashboard:', error)
            return null
        }
    },

    // Get Payment Transaction Count / History
    getPaymentHistory: async (accountNumber: string): Promise<any[]> => {
        try {
            const formData = new FormData()
            formData.append('AccountNum', accountNumber)
            formData.append('FromDate', '')
            formData.append('ToDate', '')
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')

            const response = await api.post<any>('/AccountDetails/GetPaymentDashboardHistoryAccSearch', formData)
            return response.data.Data || response.data || []
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


            const response = await api.post<any>('/WaterLeakAlarm/GetAMRAlertHistoryAccSearch', formData)
            return response.data.Data || response.data || []
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

            const response = await api.post<any>('/MyRequest/GetMyRequestAccSearch', formData)
            return response.data.Data || response.data || []
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
            const response = await api.post<any>('/BranchOfficer/GetAppointmentDetailsForAccount', formData)
            const data = response.data.Data || response.data
            return data?.Table || []
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
            const response = await api.post<any>('/BranchOfficer/GetChangeServiceTypeDet', formData)
            return response.data.Data || response.data
        } catch (error) {
            console.error('Error getting change service type details:', error)
            return null
        }
    },

    // Get Service Names
    getServiceNames: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()

            const response = await api.post<any>('/MyRequest/GetServiceNamesAccSearch', formData)
            return response.data.Data || response.data
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
            const response = await api.post<any>('/AccountDetails/GetOutstandingByGroupAccSearch', formData)
            return response.data.Data || response.data
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
            const response = await api.post<any>('/AccountDetails/GetActConsumptionDataMonthlyAccSearch', formData)
            return response.data.Data || response.data
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
            const response = await api.post<any>('/AccountDetails/ViewBillPayment_V1', formData)
            return response.data.Data || response.data
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
            const response = await api.post<any>('/Account/ViewBillPayment_V1', formData)
            const responseData = response.data.Data || response.data

            if (responseData && responseData.Message !== 'Failed') {
                // Try to get prepaid outstanding if service type is prepaid
                let outstanding = responseData.TotalResult || '0.000'
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
                    return /^\d+$/.test(t) || t === accountNumber || t === getValue(responseData.LegacyNumber) || t === getValue(serviceInfo?.LegacyId)
                }

                const valNameEn = getValue(customerInfo?.personNameEn) || getValue(customerInfo?.FullNameEn)
                const valNameAr = getValue(customerInfo?.personNameArabic) || getValue(customerInfo?.FullNameAr)
                const valNameGeneric = getValue(customerInfo?.personName)

                // Strong filter: Ignore any name that is just a number or matches accounts
                const cleanName = (n: string) => (n && !isNumericOrAcc(n)) ? n.trim() : ''

                const nameEn = cleanName(valNameEn) || (!isArabic(cleanName(valNameGeneric)) ? cleanName(valNameGeneric) : '')
                const nameAr = cleanName(valNameAr) || (isArabic(cleanName(valNameGeneric)) ? cleanName(valNameGeneric) : '')

                const respName = cleanName(getValue(responseData.CustomerName) || getValue(responseData.AccountName) || '')

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
                    getValue(responseData.TotalResult) || '0.000'

                // Make sure we have a number
                if (outstandingAmount === '' || outstandingAmount === 'null' || outstandingAmount === 'undefined') outstandingAmount = '0.000'

                // Waste Water Fixed Charge mapping
                let fixedChargeValue = getValue(responseData.WasteWaterFixedCharge) ||
                    (prepaidData && (getValue(prepaidData.OutstandingAmount) || getValue(prepaidData.Outstanding))) ||
                    (gOut && typeof gOut === 'object' ? getValue(gOut.WasteWaterFixedCharge) : '0.000')

                // High-confidence fallback for Nama Water Prepaid: 
                if ((fixedChargeValue === '0.000' || fixedChargeValue === '') && outstandingAmount !== '0.000') {
                    fixedChargeValue = outstandingAmount
                }

                return {
                    AccountHolderName: name,
                    OldAccountNumber: getValue(responseData.LegacyNumber) || getValue(serviceInfo?.LegacyId) || '',
                    NewAccountNumber: responseData.AccountNumber || accountNumber,
                    ServiceType: responseData.ServiceType || getValue(serviceInfo?.ServiceType) || 'PREPAID',
                    LastPaymentAmount: getValue(responseData.LastPaymentAmount) || getValue(responseData.LastPayAmount) || '0.000',
                    LastPaymentDate: getValue(responseData.LastPaymentDate) || getValue(responseData.LastPayDate) || '',
                    TotalOutstandingAmount: outstandingAmount,
                    CurrentBalance: getValue(responseData.CurrentBalance) || '0.000',
                    WasteWaterFixedCharge: fixedChargeValue,
                    VAT: getValue(responseData.VAT) || '0.000',
                    NetTopUpAmount: getValue(responseData.NetTopUpAmount) || '0.000',
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
            const formData = new FormData()
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')
            const response = await api.post<any>('/PrePaid/GetCCBSServertatus', formData)
            return response.data.Data || response.data
        } catch (error) {
            console.warn('CCB Status check failed, continuing search flow...', error)
            return null
        }
    },

    getPrepaidOutstanding: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('AccountNumber', accountNumber)
            const response = await api.post<any>('/PrePaid/GetOutstandingForPrepaid', formData)
            return response.data.Data || response.data
        } catch (error) {
            // Silently return null for UAT errors
            return null
        }
    },

    getInstallmentOutstanding: async (accountNumber: string): Promise<any> => {
        try {
            const formData = new FormData()
            formData.append('AccountNumber', accountNumber)
            const response = await api.post<any>('/CommonService/GetInstallmentOutstandingAmount', formData)
            return response.data.Data || response.data
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
            const response = await api.post<any>('/PrePaid/GetTopUp', formData)
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
            formData.append('islegacy', '0')

            const response = await api.post<any>('/api/BranchOfficer/GetOtpLog', formData)

            const data = response.data.Data || response.data || []
            const logData = Array.isArray(data) ? data : []

            return logData.map((item: any) => {
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
                    GSM_Number: item.GSMNumber || item.GSM_Number || mobile,
                    OTP_Triggered_Date_Time: formattedDate,
                    Message_Delivery_Status: item.MessageDeliveryStatus || item.Message_Delivery_Status || "Pending"
                }
            })
        } catch (error) {
            console.error('Error getting OTP log:', error)
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

            // Format date as DD-MM-YYYY
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

            formData.append('ProcessData', JSON.stringify({
                ...processData,
                LanguageCode: 'EN'
            }))

            const response = await api.post<any>(`/${endpoint}`, formData)
            const data = response.data.Data || response.data

            if (data === 'Failed' || !data) {
                return { success: false, message: 'Submission failed' }
            }

            return { success: true, requestNumber: data }
        } catch (error: any) {
            console.error(`Error submitting guest service [${serviceType}]:`, error)
            return { success: false, message: error.message || 'Submission failed' }
        }
    },

    // Specific Guest Service Wrappers
    submitContractorWorkComplaint: (data: any) =>
        branchOpsService.submitGuestService('CommonService/CWGuestSubmitNewDetails', 'CMCACWRK', data),

    submitWastewaterComplaint: (data: any) =>
        branchOpsService.submitGuestService('CommonService/ReportWasteWaterSubmitNewDetails', 'WASTEWSRVC', data),

    submitWaterQualityComplaint: (data: any) =>
        branchOpsService.submitGuestService('CommonService/ReportWaterQualitySubmitNewDetails', 'WATERQUALT', data),

    submitWaterLeakageComplaint: (data: any) =>
        branchOpsService.submitGuestService('CommonService/ReportWaterLeakageSubmitNewDetails', 'WATERLEAK', data),

    submitWaterOverflowComplaint: (data: any) =>
        branchOpsService.submitGuestService('CommonService/ReportWasteWaterSubmitNewDetails', 'WASTEWSRVC', data),

    submitSewerOdorComplaint: (data: any) =>
        branchOpsService.submitGuestService('CommonService/ReportWasteWaterSubmitNewDetails', 'WASTEWSRVC', {
            ...data,
            ServiceSeggreagation: 2539
        }),

    submitPressureComplaint: (data: any) =>
        branchOpsService.submitGuestService('CommonService/OperationIssueSubmitNewDetails', 'WLOPRISU', data),

    submitCompanyVehicleComplaint: (data: any) =>
        branchOpsService.submitGuestService('CommonService/VehicleComplaintSubmitNewDetails', 'VEHICLECOMP', data),

    logout: async (): Promise<boolean> => {
        try {
            const formData = new FormData()
            await api.post('/InternalPortal/LogOut', formData)
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
