// Branch Operations Types

export interface ValidationType {
    ValidateTypeId: number
    ValidateTypeCode: string
    ValidateTypeName: string
}

export interface ValidationRequest {
    type: string
    value: string
    civilId?: string
    expiryDate?: string
    accountNumber?: string
    requestNumber?: string
    gsmNumber?: string
    crNumber?: string
}

export interface ValidationResponse {
    success: boolean
    data?: any
    message?: string
    error?: string
}

export interface ROPUserDetails {
    FullNameAr: string
    FullNameEn: string
    ExpiryDate: string
    NationalIDOrCivilID: string
    GsmNumber: string
}

export interface CustomerInfo {
    UserID: string
    FullNameEn: string
    FullNameAr: string
    EmailID: string
    MobileNumber: string
    CivilID: string
    [key: string]: any
}

export interface AccountSearchResult {
    AccountNumber: string
    ServiceType: string
    LegacyId: string
    CCBAccountNumber: string
    CustomerInfo?: any
}

// Default validation types (hardcoded fallback)
export const DEFAULT_VALIDATION_TYPES: ValidationType[] = [
    { ValidateTypeId: 1, ValidateTypeCode: "GSM_NUMBER", ValidateTypeName: "GSM Number" },
    { ValidateTypeId: 2, ValidateTypeCode: "CIVIL_ID", ValidateTypeName: "Civil ID" },
    { ValidateTypeId: 3, ValidateTypeCode: "CR_NUMBER", ValidateTypeName: "CR Number" },
    { ValidateTypeId: 4, ValidateTypeCode: "ACCOUNT_PAYMENT", ValidateTypeName: "Account Payment" },
    { ValidateTypeId: 5, ValidateTypeCode: "ACCOUNT_SEARCH", ValidateTypeName: "Account Search" },
    { ValidateTypeId: 6, ValidateTypeCode: "REQUEST_NUMBER_SEARCH", ValidateTypeName: "Request Number Search" },
    { ValidateTypeId: 7, ValidateTypeCode: "RETRIEVE_OTP_LOG", ValidateTypeName: "Retrieve the OTP Log" },
    { ValidateTypeId: 8, ValidateTypeCode: "VALIDATE_CUSTOMER_DETAILS_ROP", ValidateTypeName: "Validate Customer Details in Using BOP" }
]
