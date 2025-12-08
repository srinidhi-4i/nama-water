// Water Shutdown Notification Types

export type WaterShutdownStatus = "SCHEDULED" | "CUSTOMER_TRIG" | "COMPLETED";

export type EventType = "Major Planned Event" | "Minor Planned Event";

export type TemplateType =
    | "Event Creation"
    | "Reminder"
    | "Apology"
    | "Cancellation"
    | "Event Completion";

export type Region = "MUSCAT" | "DHOFAR" | "BATINAH" | "SHARQIYAH" | "DAKHLIYAH";

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
    subject?: string;
    subjectAr?: string;
    body?: string;
    bodyAr?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Filter and Request Types
export interface WaterShutdownFilters {
    region?: Region;
    eventType?: EventType;
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
