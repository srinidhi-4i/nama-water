// Core API Response Types
export interface ApiResponse<T = any> {
    StatusCode: number
    Status: string
    Data: T
    Message?: string
}

// User Types
export interface User {
    PersonId: string
    FullNameEn: string
    FullNameAr: string
    PersonType: string
    Email: string
    MobileNo: string
    username?: string
    BranchId?: string
    BranchNameEn?: string
    BranchNameAr?: string
    RoleId?: string
    RoleName?: string
}

// Menu Types
export interface MenuItem {
    personTypeCode?: string | null;
    MenuId: number
    Parent_Id: number | null
    Menu_Name_EN: string
    Menu_Name_AR: string
    Target_Url: string
    Icon_Class: string
    order: number
    IsActive: boolean
    ApplicationNameEn?: string
    children?: MenuItem[]
}

export interface MenuData {
    MenuData: MenuItem[]
}

// Announcement Types
export interface Announcement {
    ID: number
    AnnouncementsEN: string
    AnnouncementsAR: string
    AnnoncementContentEN: string
    AnnouncementContentAR: string
    IsActive: boolean
    CreatedDate: string
}

// Appointment Types
export interface AppointmentCategory {
    ID: number
    CategoryCode: string
    NameEn: string
    NameAr: string
    IsActive: boolean
}

export interface AppointmentMasterData {
    "Appointment Request Category": AppointmentCategory[]
    [key: string]: any
}

export interface AppointmentBooking {
    AppointmentId?: string
    CategoryCode: string
    VisitType: string
    CustomerName: string
    MobileNumber: string
    Email?: string
    PreferredDate: string
    PreferredTime: string
    Remarks?: string
}

// Common Details Types
export interface CommonDetails {
    WaterleakageUp: boolean
    appointmentBookingUp: boolean
    WetlandBookingUp: boolean
    [key: string]: any
}

// Customer Class Types
export interface CustomerClass {
    ClassCode: string
    ClassNameEn: string
    ClassNameAr: string
    IsActive: boolean
}

// Language Types
export type Language = "EN" | "AR"

export interface LanguageConfig {
    code: Language
    name: string
    direction: "ltr" | "rtl"
}

// Form Types
export interface LoginFormData {
    username: string
    password: string
    rememberMe: boolean
}

// Service Card Types
export interface ServiceCard {
    id: string
    titleEn: string
    titleAr: string
    descriptionEn: string
    descriptionAr: string
    icon: string
    link: string
    isAvailable: boolean
}

// Chart Data Types
export interface ChartData {
    labels: string[]
    datasets: {
        label: string
        data: number[]
        backgroundColor?: string[]
        borderColor?: string[]
    }[]
}

// Account Types
export interface Account {
    AccountNo: string
    AccountNameEn: string
    AccountNameAr: string
    Address: string
    OutstandingAmount: number
    Status: string
    [key: string]: any
}

// Request Types
export interface Request {
    RequestId: string
    RequestType: string
    RequestDate: string
    Status: string
    Description: string
    [key: string]: any
}

// Task Types
export interface Task {
    TaskId: string
    TaskName: string
    TaskDate: string
    Status: string
    Priority: string
    [key: string]: any
}
