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
    ExpiryDate?: string
    CustomerType?: string
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

export interface CommonData {
    Description?: string
    Value?: string
    Key?: string
    [key: string]: any
}

export interface GuestService {
    MenuId: number
    Module_Name: string
    Module_Name_Arabic: string
    Menu_Icon: string
    Target_Url: string
    BracnhServiceURL?: string
    BranchServiceURL?: string
    BranchServiceEnablementFlag?: number
    PersonTypeCode?: string
    quickMenu?: string
    order: number
}


export interface GuestServiceGroup {
    title: string
    titleAr: string
    icon: string
    services: GuestService[]
}

export interface AccountPaymentDetails {
    AccountHolderName: string
    OldAccountNumber: string
    NewAccountNumber: string
    ServiceType: string
    LastPaymentAmount: string
    LastPaymentDate: string
    TotalOutstandingAmount: string
    CurrentBalance: string
    WasteWaterFixedCharge: string
    VAT: string
    NetTopUpAmount: string
    OutstandingFetchError?: boolean
}

export interface OTPLog {
    SI_No: number
    GSM_Number: string
    OTP_Triggered_Date_Time: string
    Message_Delivery_Status: string
}

// Customer Registration Types
export interface CustomerClass {
    Key: string
    Value: string
    Description?: string
}

export interface MasterLanguage {
    Key: string
    Value: string
    Description?: string
}

export type RegistrationType = 'Individual' | 'Corporate'

export interface IndividualRegistrationData {
    NationalId: string
    ExpiryDate: string
    FullNameEn?: string
    FullNameAr?: string
    EmailId?: string
    MobileNumber?: string
    PreferredLanguage?: string
}

export interface CorporateRegistrationData {
    OrganizationName: string
    CRNumber: string
    CRExpiryDate: string
    EmailId: string
    GSMNumber: string
    PreferredLanguage: string
    CommercialActivity: string
}

export type RegistrationFormData = IndividualRegistrationData | CorporateRegistrationData
