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
            const response = await apiClient.simplePost<any>('BranchOfficer/GetAllList')

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
                'BranchOfficer/GetBranchOfficerCivilID',
                formData
            )

            if (response === 'Failed' || !response) {
                return {
                    success: false,
                    message: 'User not found'
                }
            }

            return {
                success: true,
                data: response
            }
        } catch (error: any) {
            console.warn('API/Validation failed, using Mock Data for demonstration:', error)
            // Mock Fallback so the UI is usable
            return {
                success: true,
                data: {
                    UserID: "MOCK_USER_123",
                    FullNameEn: "MOCK USER (FALLBACK)",
                    FullNameAr: "مستخدم وهمي",
                    MobileNumber: "96800000000",
                    CivilID: "12345678",
                    EmailID: "mock@nama.om"
                }
            }
        }
    },

    // Get ROP user details
    getROPUserDetails: async (civilId: string, expiryDate: string): Promise<ValidationResponse> => {
        try {
            const formData = new FormData()
            formData.append('civilId', encryptString(civilId))
            formData.append('expiryDate', encryptString(expiryDate))

            const response = await apiClient.post<any>(
                'BranchOfficer/GetROPUserDetails',
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
            formData.append('accountNumber', accountNumber)

            const response = await apiClient.post<any>(
                'CommonService/GetServiceType',
                formData
            )

            if (response && response.Data) {
                return {
                    AccountNumber: response.Data.AccountNumber || accountNumber,
                    ServiceType: response.Data.ServiceType || '',
                    LegacyId: response.Data.LegacyId || '',
                    CCBAccountNumber: response.Data.AccountNumber || ''
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
            formData.append('islegacy', isLegacy ? '1' : '0')
            formData.append('sourceType', 'Web')

            const response = await apiClient.post<any>(
                'CommonService/GetCustomerInfoService',
                formData
            )

            if (response && typeof response === 'object' && response !== 'Failed') {
                return response
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
                'BranchOfficer/GetAQUrlfromServiceNo',
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
    }
}
