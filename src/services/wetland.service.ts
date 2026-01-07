import { api } from '@/lib/axios';
import { toast } from 'sonner';
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
    HolidayMasterData,
    WetlandConfiguration,
    WetlandHolidayListItem,
    InsertHolidayRequest,
} from '@/types/wetland.types';

export const wetlandService = {
    // Slot Operations
    getSlots: async (month: number, year: number): Promise<WetlandSlotsResponse> => {
        try {
            const formData = new FormData();
            // Use 'GetSlotsInformationCreateSlotScreen' to fetch existing slots
            formData.append('type', 'GetSlotsInformationCreateSlotScreen');
            formData.append('branchID', '1');

            // Use a wider date range like the reference app (1 year ago to 1 year later)
            // This ensures we get all slots, not just for the current month
            const now = new Date();
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

            const fromDate = oneYearAgo.toISOString().split('T')[0];
            const toDate = oneYearLater.toISOString().split('T')[0];

            formData.append('fromDate', fromDate);
            formData.append('toDate', toDate);

            console.log('Fetching slots with date range:', { fromDate, toDate });

            const response = await api.post<any>('/WetLand/CheckAvailableTimeSlotsByType', formData);

            console.log('CheckAvailableTimeSlotsByType Full Response:', response.data);
            console.log('response.data.Table1:', response.data?.Table1);
            console.log('response.data.Data:', response.data?.Data);
            console.log('response.data.Data.Table1:', response.data?.Data?.Table1);
            console.log('response.data.Table:', response.data?.Table);

            if (response.data && response.data.StatusCode === 605) {
                // The API might return slots in different locations, check all possibilities
                const rawSlots = response.data.Data?.Table1 ||
                    response.data.Table1 ||
                    response.data.Data?.Table ||
                    response.data.Table ||
                    [];

                console.log('Raw slots from API:', rawSlots);
                console.log('First slot sample:', rawSlots[0]);

                // Filter slots for the requested month/year
                const mappedSlots: WetlandSlot[] = rawSlots
                    .map((item: any) => {
                        const mappedSlot = {
                            id: item.SlotID?.toString() || item.BranchWiseSlotID?.toString() || item.id?.toString() || Math.random().toString(),
                            date: item.AppointmentDate?.split('T')[0] || item.SlotDate?.split('T')[0] || item.date || '',
                            startTime: item.StartTime || item.TimeSlotStart || item.startTime || '',
                            endTime: item.EndTime || item.endTime || '',
                            capacity: item.MaximumVisitors || item.TotalAppointmentsForSlot || item.capacity || 0,
                            bookedCount: item.BookedCount || item.AppoitmentsBooked || item.bookedCount || 0,
                            isActive: item.IsActive !== undefined ? item.IsActive : true,
                        };
                        return mappedSlot;
                    })
                    .filter((slot: WetlandSlot) => {
                        // Filter to only include slots for the requested month/year
                        if (!slot.date) {
                            console.log('Slot has no date:', slot);
                            return false;
                        }
                        const slotDate = new Date(slot.date);
                        const slotMonth = slotDate.getMonth() + 1;
                        const slotYear = slotDate.getFullYear();
                        const matches = slotMonth === month && slotYear === year;

                        if (!matches && rawSlots.indexOf(rawSlots.find((s: any) => s.SlotID === slot.id)) < 5) {
                            console.log('Slot filtered out:', {
                                slotDate: slot.date,
                                slotMonth,
                                slotYear,
                                requestedMonth: month,
                                requestedYear: year
                            });
                        }

                        // Also filter out any slots with empty start or end times (ghost slots)
                        return matches && slot.startTime && slot.endTime;
                    });

                console.log('Mapped and filtered slots for month', month, 'year', year, ':', mappedSlots);

                return {
                    slots: mappedSlots,
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
            // Note: The reference app sends an array of dates with slots
            // For single slot creation, we'll wrap it in the expected format
            const slotData = [{
                SlotDate: data.date,
                SlotCount: 1,
                Slots: [{
                    SlotID: '',
                    SlotDuration: '1',
                    MaximumVisitors: data.capacity.toString(),
                    StartTime: data.startTime,
                    EndTime: data.endTime,
                    IsDeleted: '',
                    Reason: ''
                }]
            }];

            const formData = new FormData();
            formData.append('GovernorateID', '1'); // Default values - should be from user context
            formData.append('WillayatID', '1');
            formData.append('BranchId', '1');
            formData.append('UserId', '1');
            formData.append('Lang', 'En');
            formData.append('JsonSlotData', JSON.stringify(slotData));

            const response = await api.post<any>('/WetLand/CreateWetlandSlots', formData);

            console.log('CreateWetlandSlots Response:', response.data);

            // IsSuccess: 0 means SUCCESS in this API (0 = success, 1 = failure)
            if (response.data && response.data.StatusCode === 605 && response.data.Data?.IsSuccess === 0) {
                return {
                    id: Math.random().toString(),
                    date: data.date,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    capacity: data.capacity,
                    bookedCount: 0,
                    isActive: true,
                };
            }

            throw new Error(response.data?.Data?.ResponseMessage || response.data?.ResponseMessage || 'Failed to create slot');
        } catch (error: any) {
            console.error('Error creating slot:', error);
            throw error;
        }
    },

    // Note: Update and Delete operations use the EditWetlandSlots endpoint
    // The data format is an array of dates with their slots

    updateSlot: async (id: string, slotData: any): Promise<WetlandSlot> => {
        try {
            const formData = new FormData();
            formData.append('GovernorateID', '1'); // Should be from user context
            formData.append('WillayatID', '1');
            formData.append('BranchId', '1');
            formData.append('UserId', '1');
            formData.append('Lang', 'En');
            formData.append('JsonSlotData', JSON.stringify(slotData));

            const response = await api.post<any>('/WetLand/EditWetlandSlots', formData);

            console.log('EditWetlandSlots Response:', response.data);

            // The response structure is { Status: "success", StatusCode: 605, Data: { IsSuccess: 0, ResponseMessage: "..." } }
            // IsSuccess: 0 means SUCCESS
            // IsSuccess: 0 means SUCCESS
            if (response.data && response.data.Data && response.data.Data.IsSuccess === 0) {
                // Toast handled in component
                return {} as WetlandSlot;
            }

            throw new Error(response.data?.Data?.ResponseMessage || response.data?.ResponseMessage || 'Failed to update slots');
        } catch (error: any) {
            console.error('Error updating slots:', error);
            throw error;
        }
    },

    deleteSlot: async (id: string, slotData: any): Promise<void> => {
        try {
            // For delete, we set IsDeleted: 1 in the slot data
            const formData = new FormData();
            formData.append('GovernorateID', '1');
            formData.append('WillayatID', '1');
            formData.append('BranchId', '1');
            formData.append('UserId', '1');
            formData.append('Lang', 'En');
            formData.append('JsonSlotData', JSON.stringify(slotData));

            const response = await api.post<any>('/WetLand/EditWetlandSlots', formData);

            console.log('DeleteSlots Response:', response.data);

            // IsSuccess: 0 means SUCCESS
            if (response.data && response.data.IsSuccess === 0) {
                toast.success(response.data.ResponseMessage || 'Slot(s) deleted successfully!');
                return;
            }

            throw new Error(response.data?.ResponseMessage || 'Failed to delete slots');
        } catch (error: any) {
            console.error('Error deleting slots:', error);
            throw error;
        }
    },

    // Holiday Operations
    getHolidays: async (year: number): Promise<WetlandHolidaysResponse> => {
        try {
            const fromDate = `${year}-01-01`;
            const toDate = `${year}-12-31`;

            // Reuse the working GetHolidayDates endpoint
            const formData = new FormData();
            formData.append('fromDate', fromDate);
            formData.append('toDate', toDate);

            const response = await api.post<any>('/Wetland/GetHolidayDates', formData);

            if (response.data && response.data.StatusCode === 605) {
                // The GetHolidayDates endpoint returns a list of holidays
                // We need to map it to the expected structure if necessary, 
                // but for now the component seems to expect what GetHolidayDates returns
                return {
                    holidays: response.data.Data || [],
                    year,
                };
            }

            throw new Error(response.data?.Status || 'Failed to fetch holidays');
        } catch (error: any) {
            console.error('Error fetching holidays:', error);
            // Return empty array on error to prevent UI crash
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

            const response = await api.post<any>('/Wetland/holidays', formData);

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
            const response = await api.delete<any>(`/Wetland/holidays/${id}`);

            if (response.data && response.data.StatusCode !== 605) {
                throw new Error(response.data?.Status || 'Failed to delete holiday');
            }
        } catch (error: any) {
            console.error('Error deleting holiday:', error);
            throw error;
        }
    },

    // Holiday Calendar Operations
    getMasterData: async (keyType: string): Promise<any> => {
        try {
            const formData = new FormData();
            formData.append('keyType', keyType);

            const response = await api.post<any>('/Wetland/GetMasterData', formData);

            if (response.data && response.data.StatusCode === 605) {
                return response.data.Data?.Table || response.data.Table || [];
            }

            throw new Error(response.data?.Status || 'Failed to fetch master data');
        } catch (error: any) {
            console.error('Error fetching master data:', error);
            throw error;
        }
    },

    getHolidayDates: async (fromDate: string, toDate: string): Promise<WetlandHolidayListItem[]> => {
        try {
            const formData = new FormData();
            formData.append('fromDate', fromDate);
            formData.append('toDate', toDate);

            const response = await api.post<any>('/Wetland/GetHolidayDates', formData);

            if (response.data && response.data.StatusCode === 605) {
                return response.data.Data || response.data || [];
            }

            throw new Error(response.data?.Status || 'Failed to fetch holiday dates');
        } catch (error: any) {
            console.error('Error fetching holiday dates:', error);
            throw error;
        }
    },

    insertWetlandHoliday: async (data: InsertHolidayRequest): Promise<any> => {
        try {
            const formData = new FormData();
            formData.append('Lang', data.Lang);
            formData.append('Action', data.Action);
            formData.append('HolidayType', data.HolidayType);
            formData.append('StartDate', data.StartDate);
            formData.append('EndDate', data.EndDate);
            formData.append('InternalUserID', data.InternalUserID as any);
            formData.append('HolidayDesriptionEN', data.HolidayDesriptionEN);
            formData.append('HolidayDesriptionAR', data.HolidayDesriptionAR);

            if (data.Weekends) {
                formData.append('Weekends', data.Weekends);
            }

            if (data.Year) {
                formData.append('Year', data.Year.toString());
            }

            const response = await api.post<any>('/Wetland/InsertWetlandHoliday', formData);
            const responseData = response.data;

            // Success is ONLY when StatusCode is 605 AND (IsBlock is 0 either at top level or inside Data)
            const isSuccess = responseData &&
                responseData.StatusCode === 605 &&
                (responseData.IsBlock === 0 || responseData.Data?.IsBlock === 0);

            if (isSuccess) {
                return {
                    success: true,
                    data: responseData.Data,
                    statusCode: responseData.StatusCode,
                };
            }

            return {
                success: false,
                error: responseData.Data?.ErrorMessage || responseData.ErrorMessage || 'Failed to process holiday',
                statusCode: responseData.StatusCode,
            };
        } catch (error: any) {
            console.error('Error processing holiday:', error);
            throw error;
        }
    },

    // Helper Functions
    buildMonthCalendar: (slots: WetlandSlot[], month: number, year: number): MonthCalendar => {
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const lastDayOfMonth = new Date(year, month, 0);

        // Find the start of the week for the first day (assuming Monday as 1, Sunday as 0)
        // Adjusting so Monday is the first day of the week (0=Mon, 1=Tue, ..., 6=Sun)
        let firstDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday...
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

        const days: DaySlots[] = [];

        // Add days from previous month to fill the first row
        const prevMonthLastDay = new Date(year, month - 1, 0);
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month - 2, prevMonthLastDay.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            days.push({
                date: dateStr,
                slots: slots.filter(slot => slot.date === dateStr),
            });
        }

        // Add days of current month
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            days.push({
                date: dateStr,
                slots: slots.filter(slot => slot.date === dateStr),
            });
        }

        // Add days from next month to fill the grid (total 42 days for 6 rows)
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            days.push({
                date: dateStr,
                slots: slots.filter(slot => slot.date === dateStr),
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
        const mockSlots: WetlandSlot[] = [];

        // Generate some realistic slots for the current month
        // Focus on a few days as seen in the screenshot (late Dec / Jan)
        const sampleDays = [1, 3, 5, 9, 10, 16, 17];

        sampleDays.forEach(day => {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            mockSlots.push({
                id: `slot-${dateStr}-1`,
                date: dateStr,
                startTime: '07:00 AM',
                endTime: '08:00 AM',
                capacity: 25,
                bookedCount: day === 9 ? 1 : 0,
                isActive: true,
            });

            mockSlots.push({
                id: `slot-${dateStr}-2`,
                date: dateStr,
                startTime: '09:00 AM',
                endTime: '10:00 AM',
                capacity: 25,
                bookedCount: 0,
                isActive: true,
            });
        });

        return {
            slots: mockSlots,
            month,
            year,
        };
    },
};
