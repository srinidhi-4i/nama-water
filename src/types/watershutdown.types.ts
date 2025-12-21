// Water Shutdown Notification Types

export type WaterShutdownStatus = "SCHEDULED" | "CUSTOMER_TRIG" | "COMPLETED";

// Master Data Types
export interface RegionItem {
    RegionID: string;
    RegionCode: string;
    RegionName: string; // Assuming Name is available or mapped
    RegionNameAr?: string;
}

export interface EventTypeItem {
    EventTypeID: number;
    EventTypeCode: string;
    EventTypeName: string;
    EventTypeNameAr?: string; // Assuming
}

// Keeping these for backward compatibility or strict typing if needed, 
// but in reality we might want to use strings from the API.
export type Region = string;
export type EventType = string;

export type TemplateType =
    | "Event Creation"
    | "Reminder"
    | "Apology"
    | "Cancellation"
    | "Event Completion";

export interface WaterShutdownNotification {
    eventId: string;
    eventType: EventType;
    status: WaterShutdownStatus;
    region: Region;
    startDateTime: string; // ISO 8601 format
    endDateTime: string; // ISO 8601 format
    reason?: string;
    reasonAr?: string;
    affectedCustomers?: number;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface WaterShutdownTemplate {
    id: string;
    eventType: EventType;
    templateType: TemplateType;
    EventTypeID?: number;
    TemplateTypeID?: number;
    subject?: string;
    subjectAr?: string;
    body?: string;
    bodyAr?: string;
    emailBody?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Filter and Request Types
export interface WaterShutdownFilters {
    region?: Region | "ALL";
    eventType?: EventType | "ALL";
    status?: WaterShutdownStatus;
    fromDate?: string;
    toDate?: string;
    searchQuery?: string;
    page?: number;
    pageSize?: number;
}

export interface WaterShutdownListResponse {
    data: WaterShutdownNotification[];
    total: number;
    page: number;
    pageSize: number;
}

export interface CreateNotificationRequest {
    eventType: EventType;
    region: Region;
    startDateTime: string;
    endDateTime: string;
    reason: string;
    reasonAr?: string;
    affectedCustomers?: number;
}

export interface UpdateNotificationRequest extends Partial<CreateNotificationRequest> {
    status?: WaterShutdownStatus;
}

export interface CreateTemplateRequest {
    eventType: EventType;
    templateType: TemplateType;
    subject: string;
    subjectAr?: string;
    body: string;
    bodyAr?: string;
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> { }
