import {
    getSlotsAction,
    createSlotAction,
    updateSlotAction,
    deleteSlotAction,
    getHolidaysAction,
    createHolidayAction,
    deleteHolidayAction,
    getMasterDataAction,
    getHolidayDatesAction,
    insertWetlandHolidayAction
} from '@/app/actions/wetland/wetland';
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
import moment from 'moment';

export const wetlandService = {
    // Slot Operations
    getSlots: async (month: number, year: number): Promise<WetlandSlotsResponse> => {
        try {
            const result = await getSlotsAction(month, year);
            const response = result.data;

            console.log(`getSlots response for ${month}/${year}:`, response);

            // Check if response validates as success (StatusCode 605)
            // Also be lenient if data exists even with different status codes for debugging
            if (response && (response.StatusCode === 605 || result.success)) {
                // The API might return slots in different locations, check all possibilities
                const rawSlots = response.Data?.Table1 ||
                    response.Table1 ||
                    response.Data?.Table ||
                    response.Table ||
                    response.data?.Table1 || // Check lowercase data
                    [];

                console.log(`Found ${rawSlots.length} raw slots from API`);

                if (rawSlots.length > 0) {

                    // Filter slots for the requested month/year
                    const mappedSlots: WetlandSlot[] = rawSlots
                        .map((item: any) => {
                            // Robust date parsing
                            const rawDate = item.AppointmentDate || item.SlotDate || item.date;
                            let dateStr = '';

                            if (rawDate) {
                                // Try parsing with moment to handle various formats
                                const mDate = moment(rawDate);
                                if (mDate.isValid()) {
                                    dateStr = mDate.format('YYYY-MM-DD');
                                } else {
                                    // Fallback to simple split if moment fails or specific format
                                    dateStr = rawDate.split('T')[0];
                                }
                            }

                            // Try to find any ID field - check multiple casing variations
                            const slotId = item.SlotID || item.SlotId || item.slotID || item.slotId ||
                                item.BranchWiseSlotID || item.BranchWiseSlotId ||
                                item.id || item.ID;

                            // If no ID found, log it clearly for debugging
                            if (!slotId) {
                                console.warn('No ID found for slot item:', item);
                            }

                            return {
                                id: slotId?.toString() || Math.random().toString(),
                                date: dateStr,
                                startTime: item.StartTime || item.TimeSlotStart || item.startTime || '',
                                endTime: item.EndTime || item.endTime || '',
                                capacity: item.MaximumVisitors || item.TotalAppointmentsForSlot || item.capacity || 0,
                                bookedCount: item.BookedCount || item.AppoitmentsBooked || item.bookedCount || 0,
                                isActive: item.IsActive !== undefined ? item.IsActive : true,
                            };
                        })
                        .filter((slot: WetlandSlot) => {
                            // Filter to only include slots for the requested month/year
                            if (!slot.date) return false;

                            const slotDate = moment(slot.date);
                            const slotMonth = slotDate.month() + 1; // month() is 0-indexed
                            const slotYear = slotDate.year();

                            // Check match
                            const matches = slotMonth === month && slotYear === year;

                            // Debug log for first few non-matches to checking
                            // First check if date matches
                            if (!matches) return false;

                            // Then ensure not a ghost slot (valid times)
                            const sTime = slot.startTime ? String(slot.startTime).trim() : '';
                            const eTime = slot.endTime ? String(slot.endTime).trim() : '';

                            return sTime.length > 0 && eTime.length > 0;
                        });

                    console.log(`Mapped ${mappedSlots.length} slots for ${month}/${year}`);
                    return {
                        slots: mappedSlots,
                        month,
                        year,
                    };
                }
            }

            // If we got a valid response but no data found or status code mismatch
            console.warn('API returned valid structure but no slots found or status mismatch', response);

            // If status is 605 but no data structure found, or if status is 'fail'/other
            // We should just return empty instead of throwing to avoid console errors
            // The API might be returning 'fail' when no slots exist for the month
            return { slots: [], month, year };

        } catch (error: any) {
            console.error('getSlots Exception:', error);
            // Return empty slots on crash to avoid UI breakage
            return { slots: [], month, year };
        }
    },

    createSlot: async (data: CreateSlotRequest): Promise<WetlandSlot> => {
        try {
            const result = await createSlotAction(data);

            if (!result.success || !result.data) {
                throw { message: result.message || 'Failed to create slot' };
            }

            const response = result.data;
            console.log('CreateWetlandSlots Response:', response);

            // IsSuccess: 0 means SUCCESS in this API (0 = success, 1 = failure)
            if (response && response.StatusCode === 605 && response.Data?.IsSuccess === 0) {
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

            throw { message: response?.Data?.ResponseMessage || response?.ResponseMessage || 'Failed to create slot' };
        } catch (error: any) {
            // Re-throw standardized error without noisy console.error
            throw error;
        }
    },

    // Note: Update and Delete operations use the EditWetlandSlots endpoint
    // The data format is an array of dates with their slots

    updateSlot: async (id: string, slotData: any): Promise<WetlandSlot> => {
        try {
            const result = await updateSlotAction(id, slotData);

            if (!result.success || !result.data) {
                throw { message: result.message || 'Failed to update slots' };
            }

            const response = result.data;
            console.log('EditWetlandSlots Response:', response);

            // The response structure is { Status: "success", StatusCode: 605, Data: { IsSuccess: 0, ResponseMessage: "..." } }
            // IsSuccess: 0 means SUCCESS
            if (response && response.Data && response.Data.IsSuccess === 0) {
                // Toast handled in component
                return {} as WetlandSlot;
            }

            throw { message: response?.Data?.ResponseMessage || response?.ResponseMessage || 'Failed to update slots' };
        } catch (error: any) {
            // Re-throw standardized error without noisy console.error
            throw error;
        }
    },

    deleteSlot: async (id: string, slotData: any): Promise<void> => {
        try {
            const result = await deleteSlotAction(id, slotData);

            if (!result.success || !result.data) {
                throw { message: result.message || 'Failed to delete slots' };
            }

            const response = result.data;
            console.log('DeleteSlots Response:', response);

            // IsSuccess: 0 means SUCCESS
            if (response && response.IsSuccess === 0) {
                toast.success(response.ResponseMessage || 'Slot(s) deleted successfully!');
                return;
            }

            throw { message: response?.ResponseMessage || 'Failed to delete slots' };
        } catch (error: any) {
            // Re-throw standardized error without noisy console.error
            throw error;
        }
    },

    // Holiday Operations
    getHolidays: async (year: number): Promise<WetlandHolidaysResponse> => {
        try {
            const result = await getHolidaysAction(year);

            if (!result.success || !result.data) {
                return { holidays: [], year };
            }

            const response = result.data;

            if (response && response.StatusCode === 605) {
                // The GetHolidayDates endpoint returns a list of holidays
                // We need to map it to the expected structure if necessary, 
                // but for now the component seems to expect what GetHolidayDates returns
                return {
                    holidays: response.Data || [],
                    year,
                };
            }

            throw { message: response?.Status || 'Failed to fetch holidays' };
        } catch (error: any) {
            // Return empty array on error to prevent UI crash
            return { holidays: [], year };
        }
    },

    createHoliday: async (data: CreateHolidayRequest): Promise<WetlandHoliday> => {
        try {
            const result = await createHolidayAction(data);

            if (!result.success || !result.data) {
                throw { message: result.message || 'Failed to create holiday' };
            }

            const response = result.data;

            if (response && response.StatusCode === 605) {
                return response.Data;
            }

            throw { message: response?.Status || 'Failed to create holiday' };
        } catch (error: any) {
            throw error;
        }
    },

    deleteHoliday: async (id: string): Promise<void> => {
        try {
            const result = await deleteHolidayAction(id);

            if (!result.success) {
                throw { message: result.message || 'Failed to delete holiday' };
            }
        } catch (error: any) {
            throw error;
        }
    },

    // Holiday Calendar Operations
    getMasterData: async (keyType: string): Promise<any> => {
        try {
            const result = await getMasterDataAction(keyType);

            if (!result.success || !result.data) {
                throw { message: result.message || 'Failed to fetch master data' };
            }

            const response = result.data;

            if (response && response.StatusCode === 605) {
                return response.Data?.Table || response.Table || [];
            }

            throw { message: response?.Status || 'Failed to fetch master data' };
        } catch (error: any) {
            throw error;
        }
    },

    getHolidayDates: async (fromDate: string, toDate: string): Promise<WetlandHolidayListItem[]> => {
        try {
            const result = await getHolidayDatesAction(fromDate, toDate);

            if (!result.success || !result.data) {
                throw { message: result.message || 'Failed to fetch holiday dates' };
            }

            const response = result.data;

            if (response && response.StatusCode === 605) {
                return response.Data || response || [];
            }

            throw { message: response?.Status || 'Failed to fetch holiday dates' };
        } catch (error: any) {
            throw error;
        }
    },

    insertWetlandHoliday: async (data: InsertHolidayRequest): Promise<any> => {
        try {
            const result = await insertWetlandHolidayAction(data);

            if (!result.success || !result.data) {
                throw { message: result.message || 'Failed to process holiday' };
            }

            const responseData = result.data;

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
