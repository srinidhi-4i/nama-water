// Wetland Slot and Holiday Types

export type HolidayType = "National Holiday" | "Public Holiday" | "Maintenance Day" | "Special Event";

export interface WetlandSlot {
    id: string;
    date: string; // YYYY-MM-DD format
    startTime: string; // HH:mm format (e.g., "07:00")
    endTime: string; // HH:mm format (e.g., "08:00")
    capacity: number;
    bookedCount: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface WetlandHoliday {
    id: string;
    holidayType: HolidayType;
    year: number;
    date: string; // YYYY-MM-DD format
    name?: string;
    nameAr?: string;
    description?: string;
    createdAt?: string;
}

// Request Types
export interface GetSlotsRequest {
    month: number; // 1-12
    year: number;
}

export interface CreateSlotRequest {
    date: string;
    startTime: string;
    endTime: string;
    capacity: number;
}

export interface UpdateSlotRequest extends Partial<CreateSlotRequest> {
    isActive?: boolean;
}

export interface CreateHolidayRequest {
    holidayType: HolidayType;
    year: number;
    date: string;
    name?: string;
    nameAr?: string;
    description?: string;
}

// Response Types
export interface WetlandSlotsResponse {
    slots: WetlandSlot[];
    month: number;
    year: number;
}

export interface WetlandHolidaysResponse {
    holidays: WetlandHoliday[];
    year: number;
}

// Calendar View Helper Types
export interface DaySlots {
    date: string;
    slots: WetlandSlot[];
}

export interface MonthCalendar {
    month: number;
    year: number;
    days: DaySlots[];
}
