// Notification Template Types
export interface NotificationTemplate {
    NotificationId?: number
    EventCode: string
    EventTypeEn: string
    EventTypeAr: string
    NotificationCategory: string
    NotificationTitleEn: string
    NotificationTitleAr: string
    TemplateEn: string
    TemplateAr: string
    IsActive?: boolean
    CreatedBy?: string
    CreatedDateTime?: string
    ModifiedBy?: string
    ModifiedDateTime?: string
}

// Event Type
export interface EventType {
    EventTypeId: number
    EventTypeCode: string
    EventTypeEn: string
    EventTypeAr: string
    IsActive: boolean
}

// Notification Category
export interface NotificationCategory {
    CategoryID: number
    CategoryCode: string
    CategoryNameEn: string
    CategoryNameAr: string
    IsActive: boolean
}

// Custom Notification
export interface CustomNotification {
    NotificationId: number
    EventTypeCode: string
    EventTypeEn: string
    EventTypeAr: string
    NotificationCategory: string
    NotificationTitleEn: string
    NotificationTitleAr: string
    Status: string
    StatusCode: string
    UserType: 'REGISTERED' | 'ALL'
    ScheduledDateTime: string
    CreatedDateTime: string
    CreatedBy: string
    ModifiedDateTime?: string
    ModifiedBy?: string
    SentDateTime?: string
    TotalRecipients?: number
}

// Template Response from API
export interface TemplateResponse {
    EventType: EventType[]
    Category: NotificationCategory[]
    Notifications: NotificationTemplate[]
    UserType?: any[]
}

// Notification Filters
export interface NotificationFilters {
    fromDate?: string
    toDate?: string
    eventCode?: string
    searchQuery?: string
    page?: number
    pageSize?: number
}

// Notification List Response
export interface NotificationListResponse {
    Table: CustomNotification[]
    TotalCount: number
}

// Create Notification Request
export interface CreateNotificationRequest {
    NotificationId?: number
    EventTypeCode: string
    NotificationCategory: string
    UserType: 'REGISTERED' | 'ALL'
    ScheduledDateTime: string
    CreatedBy: string
}

// Update Notification Request
export interface UpdateNotificationRequest {
    NotificationId: number
    ScheduledDateTime: string
    ModifiedBy: string
}

// Save Template Request
export interface SaveTemplateRequest extends Partial<NotificationTemplate> {
    NotificationId: number
    EventCode: string
    NotificationCategory: string
    TemplateEn: string
    TemplateAr: string
    ModifiedBy: string
}
