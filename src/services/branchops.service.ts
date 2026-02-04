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
import { validateUserAction } from '@/app/actions/branch-ops/validate'

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
            console.log(`Calling validateUserAction for ${type}`)
            const result = await validateUserAction(type, value)

            if (!result.success) {
                return {
                    success: false,
                    message: result.message || 'Validation failed'
                }
            }

            const data = result.data
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
                '/BranchOfficer/GetServiceType',
                formData
            )

            // API returns { Data: { ServiceType: "...", CCBAccountNumber: "..." } }
            const data = response.data.Data || response.data

            if (!data || !data.ServiceType) {
                return null
            }

            return data as AccountSearchResult
        } catch (error) {
            console.error('Service type check failed:', error)
            return null
        }
    },

    // Get customer info
    getCustomerInfo: async (accountNumber: string, isLegacy: boolean): Promise<CustomerInfo> => {
        try {
            const formData = new FormData()
            formData.append('accountNumber', isLegacy ? accountNumber : encryptString(accountNumber))
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')
            formData.append('islegacy', isLegacy ? '1' : '0')

            const response = await api.post<any>(
                '/BranchOfficer/GetCustomerInfo',
                formData
            )

            const data = response.data.Data || response.data

            // Transform response to match interface
            return {
                AccountName: data.AccountName || '',
                MobileNumber: data.MobileNumber || '',
                EmailID: data.EmailID || '',
                AccountStatus: data.AccountStatus || '',
                OutstandingAmount: data.OutstandingAmount || '0.000',
                BillDate: data.BillDate || '',
                DeferredAmount: data.DeferredAmount || '0.000',
                LastPaymentAmount: data.LastPaymentAmount || '0.000',
                LastPaymentDate: data.LastPaymentDate || '',
                DisconnectionStatus: data.DisconnectionStatus || ''
            }
        } catch (error) {
            // Return empty/default data on error
            return {
                AccountName: '',
                MobileNumber: '',
                EmailID: '',
                AccountStatus: '',
                OutstandingAmount: '0.000',
                BillDate: '',
                DeferredAmount: '0.000',
                LastPaymentAmount: '0.000',
                LastPaymentDate: '',
                DisconnectionStatus: ''
            }
        }
    },

    // Get account payment details
    getAccountPaymentDetails: async (accountNumber: string, isLegacy: boolean): Promise<AccountPaymentDetails> => {
        try {
            const formData = new FormData()
            formData.append('accountNumber', isLegacy ? accountNumber : encryptString(accountNumber))
            formData.append('sourceType', 'Web')
            formData.append('langCode', 'EN')
            formData.append('islegacy', isLegacy ? '1' : '0')

            const response = await api.post<any>(
                '/BranchOfficer/GetAccountPaymentDetails',
                formData
            )

            const data = response.data.Data || response.data

            return {
                AccountHolderName: data.AccountName || '',
                TotalOutstandingAmount: data.OutstandingAmount || '0.000',
                LastPaymentAmount: data.LastPaymentAmount || '0.000',
                LastPaymentDate: data.LastPaymentDate || '',
                // Initialize missing mandatory fields
                OldAccountNumber: '',
                NewAccountNumber: '',
                ServiceType: '',
                CurrentBalance: '0.000',
                WasteWaterFixedCharge: '0.000',
                VAT: '0.000',
                NetTopUpAmount: '0.000'
            }
        } catch (error) {
            // Return defaults on error
            return {
                AccountHolderName: '',
                TotalOutstandingAmount: '0.000',
                LastPaymentAmount: '0.000',
                LastPaymentDate: '',
                OldAccountNumber: '',
                NewAccountNumber: '',
                ServiceType: '',
                CurrentBalance: '0.000',
                WasteWaterFixedCharge: '0.000',
                VAT: '0.000',
                NetTopUpAmount: '0.000'
            }
        }
    },

    // Save payment
    savePayment: async (paymentData: any): Promise<boolean> => {
        try {
            const formData = new FormData()
            // Add payment fields...
            Object.keys(paymentData).forEach(key => {
                formData.append(key, paymentData[key])
            })

            const response = await api.post<any>('/BranchOfficer/SavePayment', formData)
            return response.data?.StatusCode === 605 || response.data === 'Success'
        } catch (error) {
            console.error('Save payment failed:', error)
            return false
        }
    },

    // Get AQ URL for request number
    getAQUrl: async (requestNumber: string): Promise<{ url: string, token: string } | null> => {
        try {
            const formData = new FormData()
            formData.append('RequestNumber', requestNumber)

            const response = await api.post<any>('/BranchOfficer/GetAQUrl', formData)
            const data = response.data.Data || response.data

            if (data && data.URL && data.Token) {
                return {
                    url: data.URL,
                    token: data.Token
                }
            }
            return null
        } catch (error) {
            console.error('Get AQ URL failed:', error)
            return null
        }
    },

    // Get OTP logs
    getOTPLogs: async (gsmNumber: string): Promise<OTPLog[]> => {
        try {
            const formData = new FormData()
            formData.append('GSMNumber', gsmNumber)

            const response = await api.post<any>('/BranchOfficer/GetOTPLogs', formData)
            const data = response.data.Data || response.data

            if (Array.isArray(data)) {
                return data
            }
            return []
        } catch (error) {
            console.error('Get OTP logs failed:', error)
            return []
        }
    }
}
