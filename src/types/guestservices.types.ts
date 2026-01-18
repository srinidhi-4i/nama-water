// Shared types for guest service forms

export interface GuestContactData {
    personName: string
    phoneNumber: string
    email?: string
}

export interface GuestLocationData {
    latitude: number
    longitude: number
    displayAddress: string
    wayNo?: string
    buildingNo?: string
    governorate?: string
    governorateId?: string
    villayat?: string
    villayatId?: string
    town?: string
    townId?: string
}

export interface GuestAttachmentData {
    files: File[]
    description?: string
}

export interface GuestOTPData {
    otp: string
    verified: boolean
}

export interface GuestFormData extends GuestContactData, GuestLocationData, GuestAttachmentData {
    // Common fields across all guest services
}

// Company Vehicles specific types
export interface ViolationType {
    ID: number
    Code: string
    Name: string
}

export interface CompanyVehicleData extends GuestFormData {
    violationType: string
    carModel: string
    carPlateNumber: string
    carCode: string
    incidentDateTime: string
    caseDetails: string
}

// Contract Workers specific types
export interface ComplaintCategory {
    Code: string
    Name: string
}

export interface ComplaintSubType {
    Code: string
    Name: string
    CategoryCode: string
}

export interface AccountDetails {
    accountNumber: string
    customerNameEnglish: string
    customerNameArabic: string
    gsmNumber: string
    emailId: string
    civilId: string
    legacyAccountNumber: string
    governorate: string
    wilayat: string
    premiseType: string
    customerClass: string
    plotNumber: string
}

export interface ContractWorkerData {
    accountNumber: string
    accountDetails?: AccountDetails
    complaintCategory: string
    complaintSubType: string
    otherDetails?: string
}

// Water Quality specific types
export interface WaterQualityData {
    accountNumber: string
    accountDetails?: AccountDetails
    typeOfComplaint: string
    sampleSource: string
    durationOfIssue: string
    homeTankHygieneChecked: boolean
    waterUsedContinuously: boolean
    comments: string
    materialsUsedForInternalConnection: string
    attachments: File[]
}

// API Response types
export interface ApiResponse<T = any> {
    StatusCode: number
    Data?: T
    Message?: string
    RequestNumber?: string
    Output?: number
}

export interface OTPResponse {
    StatusCode: number
    Output: number
    Message: string
}
