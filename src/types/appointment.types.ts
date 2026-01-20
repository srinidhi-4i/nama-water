// Appointment Slot and Holiday Types
import { WeekDay } from './wetland.types';

export interface AppointmentSlot {
    id: string;
    date: string; // YYYY-MM-DD format
    startTime: string; // HH:mm format (e.g., "07:00")
    endTime: string; // HH:mm format (e.g., "08:00")
    capacity: number;
    bookedCount: number;
    isActive: boolean;
    duration?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AppointmentHoliday {
    id: string;
    holidayType: string;
    year: number;
    date: string; // YYYY-MM-DD format
    name?: string;
    nameAr?: string;
    description?: string;
    createdAt?: string;
}

// Request Types
export interface GetAppointmentSlotsRequest {
    month: number; // 1-12
    year: number;
    branchID: string;
}

export interface CreateAppointmentSlotRequest {
    date: string;
    startTime: string;
    endTime: string;
    capacity: number;
}

// Response Types
export interface AppointmentSlotsResponse {
    slots: AppointmentSlot[];
    month: number;
    year: number;
}

// Calendar View Helper Types
export interface AppointmentDaySlots {
    date: string;
    slots: AppointmentSlot[];
}

export interface AppointmentMonthCalendar {
    month: number;
    year: number;
    days: AppointmentDaySlots[];
}

// Master data response
export interface AppointmentHolidayMasterData {
    HolidayReasonType: string;
    HolidayReasonTypeNameEN: string;
    HolidayReasonTypeNameAR: string;
}

// Holiday list item from API
export interface AppointmentHolidayListItem {
    HolidayDate: string; // ISO date string
    HolidayReason: 'WO' | 'SH'; // Reverted back to HolidayReason
    HolidayDescriptionEn: string;
    HolidayDescriptionAr: string;
}

// Insert/Update/Delete request
export interface InsertAppointmentHolidayRequest {
    Lang: string;
    Action: 'I' | 'U' | 'D'; // Insert, Update, Delete
    HolidayType: 'WO' | 'SH';
    StartDate: string;
    EndDate: string;
    InternalUserID: string | null;
    HolidayDesriptionEN: string;
    HolidayDesriptionAR: string;
    Weekends?: string; // Comma-separated day names (for WO)
    Year?: number; // For WO
}

export interface GenerateTokenRequest {
    BranchID: string;
    CategoryID: string;
    InternalUserID: string | null;
    Lang: string;
}
