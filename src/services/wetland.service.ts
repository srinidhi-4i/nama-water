import { api } from '@/lib/axios';
import {
    WetlandSlot,
    WetlandHoliday,
    GetSlotsRequest,
    CreateSlotRequest,
    UpdateSlotRequest,
    CreateHolidayRequest,
    WetlandSlotsResponse,
    WetlandHolidaysResponse,
    MonthCalendar,
    DaySlots,
} from '@/types/wetland.types';

export const wetlandService = {
    // Slot Operations
    getSlots: async (month: number, year: number): Promise<WetlandSlotsResponse> => {
        try {
            const response = await api.get<any>(`/api/wetland/slots?month=${month}&year=${year}`);

            if (response.data && response.data.StatusCode === 605) {
                return {
                    slots: response.data.Data?.slots || [],
                    month,
                    year,
                };
            }

            throw new Error(response.data?.Status || 'Failed to fetch slots');
        } catch (error: any) {
            console.error('Error fetching wetland slots:', error);

            // Return mock data for development
            console.warn('Using mock data for wetland slots');
            return wetlandService.getMockSlots(month, year);
        }
    },

    createSlot: async (data: CreateSlotRequest): Promise<WetlandSlot> => {
        try {
            const formData = new FormData();
            formData.append('date', data.date);
            formData.append('startTime', data.startTime);
            formData.append('endTime', data.endTime);
            formData.append('capacity', data.capacity.toString());

            const response = await api.post<any>('/api/wetland/slots', formData);

            if (response.data && response.data.StatusCode === 605) {
                return response.data.Data;
            }

            throw new Error(response.data?.Status || 'Failed to create slot');
        } catch (error: any) {
            console.error('Error creating slot:', error);
            throw error;
        }
    },

    updateSlot: async (id: string, data: UpdateSlotRequest): Promise<WetlandSlot> => {
        try {
            const formData = new FormData();
            formData.append('id', id);
            if (data.date) formData.append('date', data.date);
            if (data.startTime) formData.append('startTime', data.startTime);
            if (data.endTime) formData.append('endTime', data.endTime);
            if (data.capacity !== undefined) formData.append('capacity', data.capacity.toString());
            if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());

            const response = await api.put<any>(`/api/wetland/slots/${id}`, formData);

            if (response.data && response.data.StatusCode === 605) {
                return response.data.Data;
            }

            throw new Error(response.data?.Status || 'Failed to update slot');
        } catch (error: any) {
            console.error('Error updating slot:', error);
            throw error;
        }
    },

    deleteSlot: async (id: string): Promise<void> => {
        try {
            const response = await api.delete<any>(`/api/wetland/slots/${id}`);

            if (response.data && response.data.StatusCode !== 605) {
                throw new Error(response.data?.Status || 'Failed to delete slot');
            }
        } catch (error: any) {
            console.error('Error deleting slot:', error);
            throw error;
        }
    },

    // Holiday Operations
    getHolidays: async (year: number): Promise<WetlandHolidaysResponse> => {
        try {
            const response = await api.get<any>(`/api/wetland/holidays?year=${year}`);

            if (response.data && response.data.StatusCode === 605) {
                return {
                    holidays: response.data.Data?.holidays || [],
                    year,
                };
            }

            throw new Error(response.data?.Status || 'Failed to fetch holidays');
        } catch (error: any) {
            console.error('Error fetching holidays:', error);

            // Return mock data for development
            console.warn('Using mock data for holidays');
            return { holidays: [], year };
        }
    },

    createHoliday: async (data: CreateHolidayRequest): Promise<WetlandHoliday> => {
        try {
            const formData = new FormData();
            formData.append('holidayType', data.holidayType);
            formData.append('year', data.year.toString());
            formData.append('date', data.date);
            if (data.name) formData.append('name', data.name);
            if (data.nameAr) formData.append('nameAr', data.nameAr);
            if (data.description) formData.append('description', data.description);

            const response = await api.post<any>('/api/wetland/holidays', formData);

            if (response.data && response.data.StatusCode === 605) {
                return response.data.Data;
            }

            throw new Error(response.data?.Status || 'Failed to create holiday');
        } catch (error: any) {
            console.error('Error creating holiday:', error);
            throw error;
        }
    },

    deleteHoliday: async (id: string): Promise<void> => {
        try {
            const response = await api.delete<any>(`/api/wetland/holidays/${id}`);

            if (response.data && response.data.StatusCode !== 605) {
                throw new Error(response.data?.Status || 'Failed to delete holiday');
            }
        } catch (error: any) {
            console.error('Error deleting holiday:', error);
            throw error;
        }
    },

    // Helper Functions
    buildMonthCalendar: (slots: WetlandSlot[], month: number, year: number): MonthCalendar => {
        const daysInMonth = new Date(year, month, 0).getDate();
        const days: DaySlots[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const daySlots = slots.filter(slot => slot.date === date);

            days.push({
                date,
                slots: daySlots,
            });
        }

        return {
            month,
            year,
            days,
        };
    },

    // Mock Data Functions
    getMockSlots: (month: number, year: number): WetlandSlotsResponse => {
        const mockSlots: WetlandSlot[] = [
            {
                id: '1',
                date: `${year}-${String(month).padStart(2, '0')}-19`,
                startTime: '07:00',
                endTime: '08:00',
                capacity: 25,
                bookedCount: 0,
                isActive: true,
            },
            {
                id: '2',
                date: `${year}-${String(month).padStart(2, '0')}-19`,
                startTime: '09:00',
                endTime: '10:00',
                capacity: 25,
                bookedCount: 0,
                isActive: true,
            },
            {
                id: '3',
                date: `${year}-${String(month).padStart(2, '0')}-20`,
                startTime: '07:00',
                endTime: '08:00',
                capacity: 25,
                bookedCount: 0,
                isActive: true,
            },
            {
                id: '4',
                date: `${year}-${String(month).padStart(2, '0')}-20`,
                startTime: '09:00',
                endTime: '10:00',
                capacity: 25,
                bookedCount: 0,
                isActive: true,
            },
        ];

        return {
            slots: mockSlots,
            month,
            year,
        };
    },
};
