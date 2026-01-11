// Water Shutdown Notification Types

export type WaterShutdownStatus = "SCHEDULED" | "CUSTOMER_TRIG" | "COMPLETED";

// Master Data Types
export interface RegionItem {
    RegionID: string;
    RegionCode: string;
    RegionName: string; // Assuming Name is available or mapped
    RegionNameAr?: string;
    wilayats?: WillayatItem[]; // Hierarchical structure
}

export interface WillayatItem {
    WillayathID: string;
    WillayathCode: string;
    WillayathNameEn: string;
    WillayathNameAr?: string;
    RegionID: string;
    RegionCode: string;
    DMAs?: DMAItem[]; // Hierarchical structure
}

export interface DMAItem {
    DMAID: string;
    DMACode: string;
    DMANameEn: string;
    DMANameAr?: string;
    RegionID: string;
    WillayathID: string;
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

export interface TeamActionConfig {
    teamName: string;
    isActive: boolean;
    actions: string[];
    code?: string;
}

export interface FocalPoint {
    Name: string;
    Email: string;
    "Contact Number": string;
}

export interface Contractor {
    contractorName: string;
}

export interface WaterShutdownNotification {
    eventId: string;
    internalId?: number;
    eventType: EventType;
    status: WaterShutdownStatus;
    region: Region;
    startDateTime: string; // ISO 8601 format
    endDateTime: string; // ISO 8601 format
    reason?: string;
    reasonAr?: string;
    affectedCustomers: number;
    notificationTitle?: string;
    eventTypeName?: string;
    regionCode?: string;
    locationDetails?: string;
    scheduleNotificationDate?: string;
    remainderNotificationDate?: string;
    apologyNotificationDate?: string;
    reasonForShutdown?: string;
    notificationDetails?: string;
    eventJsonData?: string; // Raw JSON from API

    // Technical Details
    valveLock?: string;
    sizeOfPipeline?: string;
    typeOfPipeline?: string;
    numberOfHours?: string;

    // Parsed fields for easier access / Form state
    affectedWillayats?: string[];
    affectedDMAs?: string[];
    contractors?: Contractor[];
    actionsRequired?: string[]; // Legacy/Global actions
    teamActions?: TeamActionConfig[]; // New per-team config
    focalPoint?: FocalPoint[];
    mapLocations?: string[];
    initiatedBy?: string;
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
    TemplateTypeCode?: string;
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

export interface SaveNotificationRequest {
    eventId?: string; // Present for update, missing for create
    notificationTitle: string;
    eventTypeId: number;
    regionId: string;
    startDateTime: string;
    endDateTime: string;
    apologyNotificationDate?: string;
    reminderNotificationDate?: string;
    valveLock: string;
    typeOfPipeline: string;
    sizeOfPipeline: string;
    numberOfHours: string;
    notificationDetails: string;
    reasonForShutdown: string;

    // JSON Data structure
    eventJsonData: string;

    // Legacy support if needed
    reason?: string;
    status?: WaterShutdownStatus;
}

export interface CreateNotificationRequest extends SaveNotificationRequest { }
export interface UpdateNotificationRequest extends SaveNotificationRequest { }

export interface CreateTemplateRequest {
    eventType: EventType;
    templateType: TemplateType;
    subject: string;
    subjectAr?: string;
    body: string;
    bodyAr?: string;
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> { }
