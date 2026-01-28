import { api } from '@/lib/axios'
import {
    AppointmentMasterData,
    AppointmentBooking
} from '@/types'
import {
    AppointmentSlot,
    AppointmentSlotsResponse,
    AppointmentMonthCalendar,
    AppointmentDaySlots,
    AppointmentHolidayListItem,
    InsertAppointmentHolidayRequest,
} from '@/types/appointment.types'

export const appointmentService = {
    /**
     * Get appointment master data including categories
     * Matches React app: CommonService.getAPIResponse('AppointmentReqest/GetMasterData')
     */
    async getMasterData(keyType?: string): Promise<any> {
        try {
            const formData = new FormData()
            if (keyType) formData.append('keyType', keyType)
            formData.append('Lang', 'EN') // Common requirement for master data

            const endpoints = [
                '/AppointmentReqest/GetMasterData',
                '/AppointmentRequest/GetMasterData',
                '/Appointment/GetMasterData',
                '/AppointmentReqest/GetMaster',
                '/AppointmentRequest/GetMaster',
                '/WetLand/GetMasterData',
                '/BranchOfficer/GetMasterData',
                '/Common/GetMasterData',
                '/CommonService/GetMasterData'
            ]

            const response = await this._probeApi(endpoints, formData, 'master data')
            if (!response) {
                return {
                    Governorates: [],
                    Wilayats: [],
                    Table: [],
                    "Appointment Request Category": []
                }
            }

            const rawData = response?.data?.Data || response?.data || {};

            // If keyType is provided, return the specific table
            if (keyType && rawData.Table) {
                return rawData.Table;
            }

            // Normalizing data structure to handle both singular and plural keys from different API versions
            const rawGovernorates = rawData.Governorates || rawData.Governorate || rawData.Governarates || rawData.Governarate || [];
            const rawWilayats = rawData.Wilayats || rawData.Wilayat || rawData.Villayat || rawData.Villayats || rawData.Willayats || rawData.Willayath || [];
            const rawBranches = rawData.Table || rawData.Branch || rawData.Branches || [];

            // 1. Normalize Governorates first
            const normalizedGovs = (Array.isArray(rawGovernorates) ? rawGovernorates : []).map((g: any) => ({
                ...g,
                GovernorateID: g.GovernorateID || g.GovernarateID || g.GovernateID || g.GovID || g.ID,
                GovernarateCode: g.GovernarateCode || g.GovCode,
                GovernorateNameEN: g.GovernorateNameEN || g.GovernorateEn || g.GovernarateNameEN || g.NameEn || g.NameEN || g.Name || '',
                GovernorateNameAR: g.GovernorateNameAR || g.GovernorateAr || g.GovernarateNameAR || g.NameAr || g.NameAR || ''
            }));

            // 2. Normalize Wilayats and link to Govs via Code if ID is missing
            const normalizedWilayats = (Array.isArray(rawWilayats) ? rawWilayats : []).map((w: any) => {
                const WilayatID = w.WilayatID || w.WillayathID || w.ID;
                const WilayatNameEN = w.WilayatNameEN || w.VillayatEn || w.WilayatEn || w.WillayathNameEN || w.NameEn || w.NameEN || '';
                const WilayatNameAR = w.WilayatNameAR || w.VillayatAr || w.WilayatAr || w.WillayathNameAR || w.NameAr || w.NameAR || '';

                let GovernorateID = w.GovernorateID || w.GovernarateID || w.GovernateID || w.GovID;
                const GovCode = w.GovernarateCode || w.GovCode;

                // CRITICAL: Link via Code if ID is missing
                if (!GovernorateID && GovCode) {
                    const matchingGov = normalizedGovs.find(g => g.GovernarateCode === GovCode);
                    if (matchingGov) GovernorateID = matchingGov.GovernorateID;
                }

                return {
                    ...w,
                    WilayatID,
                    GovernorateID,
                    WilayatNameEN,
                    WilayatNameAR,
                    GovernarateCode: GovCode
                };
            });

            // 3. Normalize Branches
            const normalizedBranches = (Array.isArray(rawBranches) ? rawBranches : []).map((b: any) => ({
                ...b,
                BranchID: b.BranchID || b.ID,
                WilayatID: b.WilayatID || b.WillayathID || b.VillayatID,
                GovernorateID: b.GovernorateID || b.GovernarateID || b.GovernateID || b.GovID,
                BranchNameEN: b.BranchNameEN || b.BranchNameEn || b.NameEn || b.NameEN || '',
                BranchNameAR: b.BranchNameAR || b.BranchNameAr || b.NameAr || b.NameAR || ''
            }));

            const normalizedData = {
                ...rawData,
                Governorates: normalizedGovs,
                Wilayats: normalizedWilayats,
                Table: normalizedBranches
            };

            return normalizedData;
        } catch (error: any) {
            return {
                Governorates: [],
                Wilayats: [],
                Table: [],
                "Appointment Request Category": []
            }
        }
    },

    async getDates(): Promise<any[]> {
        try {
            const formData = new FormData()
            formData.append('type', 'GetAvailableDates')
            formData.append('Lang', 'EN')
            const endpoints = [
                '/AppointmentReqest/GetDates',
                '/AppointmentRequest/GetDates',
                '/AppointmentReqest/GetAvailableDates',
                '/AppointmentRequest/GetAvailableDates',
                '/Appointment/GetDates',
                '/AppointmentReqest/GetAvailableAppointmentDates',
                '/WetLand/GetAvailableDates',
                '/Wetland/GetAvailableDates',
                '/BranchOfficer/GetAvailableDates',
                '/Common/GetAvailableDates',
                '/CommonService/GetAvailableDates'
            ]

            const response = await this._probeApi(endpoints, formData, 'appointment dates')
            if (!response) return []

            const result = response?.data?.Data || response?.data || []
            return Array.isArray(result) ? result : (result?.Table || [])
        } catch (error) {
            return []
        }
    },

    async getSlots(date: string, branchID: string): Promise<any[]> {
        try {
            const formData = new FormData()
            formData.append('AppointmentDate', date)
            formData.append('BranchID', branchID)
            formData.append('Lang', 'EN')

            const endpoints = [
                '/AppointmentReqest/GetAvailableSlots',
                '/AppointmentRequest/GetAvailableSlots',
                '/AppointmentReqest/GetSlots',
                '/AppointmentRequest/GetSlots',
                '/Appointment/GetAvailableSlots',
                '/AppointmentReqest/CheckAvailableTimeSlots',
                '/WetLand/GetAvailableSlots',
                '/WetLand/CheckAvailableTimeSlotsByType',
                '/BranchOfficer/GetAvailableSlots',
                '/BranchOfficer/GetSlots'
            ]

            const response = await this._probeApi(endpoints, formData, 'public slots')
            if (!response) return []

            const result = response?.data?.Data || response?.data || []
            return Array.isArray(result) ? result : (result?.Table || [])
        } catch (error) {
            return []
        }
    },

    async getSlotsForRange(branchID: string, startDate: string, endDate: string): Promise<{ slots: AppointmentSlot[] }> {
        try {
            const formData = new FormData()
            formData.append('BranchID', branchID)
            formData.append('FromDate', startDate)
            formData.append('ToDate', endDate)

            // Endpoint from AppointmentCreateSlot.jsx
            const endpoints = [
                '/AppointmentReqest/GetTimeSlotsForSelectedDates',
                '/AppointmentRequest/GetTimeSlotsForSelectedDates',
                '/Appointment/GetTimeSlotsForSelectedDates',
                '/AppointmentReqest/GetTimeSlots',
                '/AppointmentRequest/GetTimeSlots',
                '/BranchOfficer/GetTimeSlotsForSelectedDates',
                // Fallback to Edit endpoint as it might return disabled slots too
                '/AppointmentReqest/GetTimeSlotsForEdit',
                '/AppointmentRequest/GetTimeSlotsForEdit'
            ]

            const response = await this._probeApi(endpoints, formData, 'slots for range')
            if (!response) return { slots: [] }

            const rawData = response?.data?.Data || response?.data || {}
            console.log('getSlotsForRange rawData:', rawData)
            const result = Array.isArray(rawData) ? rawData : (rawData.Table1 || rawData.Table || [])
            console.log('getSlotsForRange result array:', result)

            const slots: AppointmentSlot[] = Array.isArray(result) ? result.map((item: any) => ({
                id: item.SlotID || item.BranchWiseSlotID || item.slotID || Math.random().toString(),
                startTime: item.StartTime || item.TimeSlotStart || item.startTime || '',
                endTime: item.EndTime || item.TimeSlotEnd || item.endTime || '',
                capacity: parseInt(item.MaximumVisitors || item.TotalAppointmentsForSlot || item.capacity || '0'),
                bookedCount: parseInt(item.BookedCount || item.AppoitmentsBooked || item.bookedCount || '0'),
                isActive: (item.IsActive === true || item.IsActive === 'true' || item.IsActive === 1 || item.IsActive === '1') && item.IsDeleted != '1',
                // Handle different date formats or fields
                date: (item.SlotDate || item.AppointmentDate || item.date || item.StartDate || item.FromDate || '').split('T')[0],
                duration: item.SlotDuration || item.TimeSlotDuration
            })) : []

            return { slots }
        } catch (error) {
            return { slots: [] }
        }
    },

    async getSlotsForEditor(branchID: string, date: string): Promise<{ slots: any[], calendarStatus: any[] }> {
        try {
            const formData = new FormData()
            formData.append('branchID', branchID)
            formData.append('fromDate', date)
            formData.append('toDate', date)

            // Endpoint from AppointmentEditSlot.jsx
            const endpoints = [
                '/AppointmentReqest/GetTimeSlotsForEdit',
                '/AppointmentRequest/GetTimeSlotsForEdit'
            ]

            const response = await this._probeApi(endpoints, formData, 'slots for editor')
            if (!response) return { slots: [], calendarStatus: [] }

            const rawData = response?.data?.Data || response?.data || {}
            // Table1 usually contains the slot details, Table contains calendar status
            const slots = rawData.Table1 || []
            const calendarStatus = rawData.Table || []

            return { slots, calendarStatus }
        } catch (error) {
            return { slots: [], calendarStatus: [] }
        }
    },

    // Updated updateSlot to match AppointmentEditSlot.jsx
    async updateSlot(payload: {
        branchID: string,
        fromDate: string,
        toDate: string,
        startTime?: string, // Comma separated
        branchWiseTimeSlotID?: string, // Comma separated
        slotDuration?: string,
        noOfCounter?: string,
        isDisable: '0' | '1',
        isEnable?: '0' | '1' // Some logic uses this
    }): Promise<any> {
        try {
            const formData = new FormData()
            formData.append('Lang', 'EN')
            formData.append('BranchID', payload.branchID)
            formData.append('FromDate', payload.fromDate)
            formData.append('ToDate', payload.toDate)
            formData.append('IsDisable', payload.isDisable)

            if (payload.isEnable) {
                formData.append('IsEnable', payload.isEnable)
            }

            if (payload.startTime) formData.append('StartTime', payload.startTime)
            if (payload.branchWiseTimeSlotID) formData.append('BranchWiseTimeSlotID', payload.branchWiseTimeSlotID)
            if (payload.slotDuration) formData.append('SlotDuration', payload.slotDuration)
            if (payload.noOfCounter) formData.append('NoOfCounter', payload.noOfCounter)

            const endpoints = [
                '/AppointmentReqest/UpdateAppointmentSlot',
                '/AppointmentRequest/UpdateAppointmentSlot'
            ]

            const response = await this._probeApi(endpoints, formData, 'update slots')
            if (!response) throw { message: 'No working endpoint found for updateSlot' }

            return response?.data
        } catch (error) {
            throw error
        }
    },

    // Keeping getInternalSlots for backward compatibility if needed, but redirecting logic or implementing basics
    // Deprecating in favor of getSlotsForRange
    async getInternalSlots(month: number, year: number, branchID: string): Promise<{ slots: AppointmentSlot[] }> {
        // Calculate start and end of month
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
        const lastDay = new Date(year, month, 0).getDate()
        const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`
        return this.getSlotsForRange(branchID, startDate, endDate)
    },

    async blockSlot(date: string, branchID: string, slotID: string, lang: string): Promise<any> {
        try {
            const formData = new FormData()
            formData.append('AppointmentDate', date)
            formData.append('BranchID', branchID)
            formData.append('BranchWiseSlotID', slotID)
            formData.append('Lang', lang)
            const endpoints = [
                '/AppointmentReqest/BlockSlot',
                '/AppointmentRequest/BlockSlot',
                '/Appointment/BlockSlot',
                '/AppointmentReqest/ReserveSlot',
                '/AppointmentRequest/ReserveSlot',
                '/WetLand/BlockSlot',
                '/Wetland/BlockSlot',
                '/BranchOfficer/BlockSlot'
            ]

            const response = await this._probeApi(endpoints, formData, 'block slot')
            if (!response) throw { message: 'No working endpoint found for blockSlot' }
            return response?.data?.Data || response?.data
        } catch (error) {
            throw error
        }
    },

    async unblockSlot(blockID: string): Promise<any> {
        try {
            const formData = new FormData()
            formData.append('Id', blockID)

            const endpoints = [
                '/AppointmentReqest/UnBlockSlot',
                '/AppointmentRequest/UnBlockSlot',
                '/Appointment/UnBlockSlot',
                '/WetLand/UnBlockSlot',
                '/BranchOfficer/UnBlockSlot'
            ]

            const response = await this._probeApi(endpoints, formData, 'unblock slot')
            return response?.data
        } catch (error) { }
    },

    async checkAppointmentBooked(payload: any): Promise<any> {
        try {
            const formData = new FormData()
            Object.entries(payload).forEach(([key, value]) => {
                if (value !== undefined) formData.append(key, value as string)
            })
            const endpoints = [
                '/AppointmentReqest/CheckAppointmentBooked',
                '/AppointmentRequest/CheckAppointmentBooked',
                '/Appointment/CheckAppointmentBooked',
                '/Appointment/CheckBooking',
                '/WetLand/CheckAppointmentBooked',
                '/BranchOfficer/CheckAppointmentBooked'
            ]

            const response = await this._probeApi(endpoints, formData, 'check booking')
            if (!response) throw { message: 'No working endpoint found for checkAppointmentBooked' }
            return response?.data?.Data || response?.data
        } catch (error) {
            throw error
        }
    },

    async checkOTPValidationRequired(encryptedMobile: string): Promise<any> {
        try {
            const formData = new FormData()
            formData.append('MobileNumber', encryptedMobile)
            const endpoints = [
                '/AppointmentReqest/CheckOTPValidationRequired',
                '/AppointmentRequest/CheckOTPValidationRequired',
                '/Appointment/CheckOTPValidationRequired',
                '/WetLand/CheckOTPValidationRequired',
                '/BranchOfficer/CheckOTPValidationRequired'
            ]

            const response = await this._probeApi(endpoints, formData, 'otp requirement')
            if (!response) throw { message: 'No working endpoint found for checkOTPValidationRequired' }
            return response?.data?.Data || response?.data
        } catch (error) {
            throw error
        }
    },

    async generateOTP(encryptedMobile: string, lang: string): Promise<any> {
        try {
            const formData = new FormData()
            formData.append('MobileNumber', encryptedMobile)
            formData.append('Lang', lang)
            const endpoints = [
                '/AppointmentReqest/GenerateOTP',
                '/AppointmentRequest/GenerateOTP',
                '/Appointment/GenerateOTP',
                '/WetLand/GenerateOTP',
                '/BranchOfficer/GenerateOTP'
            ]

            const response = await this._probeApi(endpoints, formData, 'generate otp')
            if (!response) throw { message: 'No working endpoint found for generateOTP' }
            return response?.data
        } catch (error) {
            throw error
        }
    },

    async createAppointment(payload: any): Promise<any> {
        try {
            const formData = new FormData()
            Object.entries(payload).forEach(([key, value]) => {
                if (value !== undefined) formData.append(key, value as string)
            })
            const endpoints = [
                '/AppointmentReqest/CreateAppointment',
                '/AppointmentRequest/CreateAppointment',
                '/Appointment/CreateAppointment',
                '/AppointmentReqest/InsertAppointment',
                '/Appointment/InsertAppointment',
                '/WetLand/CreateAppointment',
                '/BranchOfficer/CreateAppointment'
            ]

            const response = await this._probeApi(endpoints, formData, 'create appointment')
            if (!response) throw { message: 'No working endpoint found for createAppointment' }
            return response?.data?.Data || response?.data
        } catch (error) {
            throw error
        }
    },

    // Global probe helper
    async _probeApi(endpoints: string[], formData: FormData, context: string): Promise<any> {
        for (const url of endpoints) {
            try {
                const res = await api.post<any>(url, formData)
                // StatusCode 605 is the "Success" code for these legacy APIs
                if (res.status === 200 || (res.data && res.data.StatusCode === 605)) {
                    return res
                }
            } catch (e: any) {
                // Silence errors
            }
        }
        return null
    },

    // Holiday Operations
    async getHolidayDates(fromDate: string, toDate: string): Promise<AppointmentHolidayListItem[]> {
        try {
            const formatDate = (dateStr: string) => {
                if (!dateStr) return '';
                // Fetch requires YYYY/MM/DD
                return dateStr.replace(/-/g, '/');
            };

            const formData = new FormData();
            formData.append('fromDate', formatDate(fromDate));
            formData.append('toDate', formatDate(toDate));
            formData.append('Lang', 'EN');

            const endpoints = [
                '/AppointmentReqest/GetHolidayDates',
                '/AppointmentRequest/GetHolidayDates',
                '/AppointmentReqest/GetHoliday',
                '/AppointmentRequest/GetHoliday',
                '/AppointmentReqest/GetHolidays',
                '/AppointmentRequest/GetHolidays',
                '/Appointment/GetHolidays',
                '/Appointment/GetHolidayDates',
                '/WetLand/GetHolidayDates',
                '/Wetland/GetHolidayDates',
                '/BranchOfficer/GetHolidayDates'
            ]

            const response = await this._probeApi(endpoints, formData, 'holiday dates')
            if (!response) throw { message: 'No working endpoint found for GetHolidayDates' }

            const responseData = response?.data;
            if (responseData?.StatusCode === 605) {
                const result = responseData?.Data?.Table || responseData?.Data || [];
                return Array.isArray(result) ? result : [];
            }

            throw { message: responseData?.Status || 'Failed to fetch holiday dates' };
        } catch (error: any) {
            return []
        }
    },

    async insertHoliday(data: InsertAppointmentHolidayRequest): Promise<{ success: boolean; data?: any; error?: string; statusCode?: number }> {
        try {
            const formData = new FormData();
            formData.append('Lang', data.Lang);
            formData.append('Action', data.Action);
            formData.append('HolidayType', data.HolidayType);
            // Revert strict formatting for Insert - Wetland uses raw strings (likely YYYY-MM-DD)
            formData.append('StartDate', data.StartDate);
            formData.append('EndDate', data.EndDate);

            if (data.InternalUserID) {
                formData.append('InternalUserID', data.InternalUserID);
            } else {
                formData.append('InternalUserID', 'null');
            }

            formData.append('HolidayDesriptionEN', data.HolidayDesriptionEN);
            formData.append('HolidayDesriptionAR', data.HolidayDesriptionAR);

            if (data.Weekends) {
                formData.append('Weekends', data.Weekends);
            } else {
                formData.append('Weekends', '');
            }

            if (data.Year !== undefined && data.Year !== null) {
                formData.append('Year', String(data.Year));
            }

            const endpoints = [
                '/AppointmentReqest/InsertAppointmentHoliday',
                '/AppointmentRequest/InsertAppointmentHoliday',
                '/AppointmentReqest/InsertHoliday',
                '/AppointmentRequest/InsertHoliday',
                '/AppointmentReqest/SaveHoliday',
                '/AppointmentRequest/SaveHoliday',
                '/Appointment/InsertHoliday',
                '/Appointment/CreateHoliday',
                '/WetLand/InsertWetlandHoliday',
                '/Wetland/InsertHoliday',
                '/BranchOfficer/InsertHoliday'
            ]

            const response = await this._probeApi(endpoints, formData, 'holiday insertion')
            if (!response) throw { message: 'No working endpoint found for holiday insertion' }

            const responseData = response?.data;

            // Legacy success: StatusCode 605. 
            // IsBlock check: WO must be 0, SH can be non-zero per user request.
            // Using loose equality == 0 for robustness against string/number types.
            const isSuccess = responseData?.StatusCode === 605 &&
                (data.HolidayType === 'SH' ? true : (responseData?.IsBlock == 0 || responseData?.Data?.IsBlock == 0));

            if (isSuccess) {
                return {
                    success: true,
                    data: responseData?.Data,
                    statusCode: responseData?.StatusCode,
                };
            }

            return {
                success: false,
                error: responseData?.Data?.ErrorMessage || responseData?.ErrorMessage || 'Failed to process holiday',
                statusCode: responseData?.StatusCode,
            };
        } catch (error: any) {
            throw error;
        }
    },

    async generateToken(branchID: string, categoryID: string): Promise<any> {
        try {
            const formData = new FormData();
            formData.append('BranchID', branchID);
            formData.append('CategoryID', categoryID);
            formData.append('InternalUserID', '1');
            formData.append('Lang', 'EN');

            const endpoints = [
                '/AppointmentReqest/GenerateToken',
                '/AppointmentRequest/GenerateToken',
                '/Appointment/GenerateToken'
            ]

            const response = await this._probeApi(endpoints, formData, 'generate token')
            return response?.data;
        } catch (error) {
            throw error;
        }
    },

    async getLoginEmpDetails(userName: string): Promise<any> {
        try {
            const formData = new FormData()
            formData.append('empNm', userName)
            const endpoints = [
                '/AppointmentReqest/GetLoginEmpDtl',
                '/AppointmentRequest/GetLoginEmpDtl',
                '/Appointment/GetLoginEmpDtl'
            ]
            const response = await this._probeApi(endpoints, formData, 'emp details')
            return response?.data?.Data || response?.data
        } catch (error) {
            return null
        }
    },

    async getPreBookWalkinDetails(branchID: string, date: string): Promise<any> {
        try {
            const formData = new FormData()
            formData.append('Pi_BranchId', branchID)
            formData.append('Pi_Date', date)
            const endpoints = [
                '/AppointmentReqest/GetPreBookWalkinDetails',
                '/AppointmentRequest/GetPreBookWalkinDetails',
                '/Appointment/GetPreBookWalkinDetails'
            ]
            const response = await this._probeApi(endpoints, formData, 'prebook walkin details')
            if (!response) return null
            return response?.data?.Data || response?.data
        } catch (error) {
            return null
        }
    },

    async getAgentList(branchID: string): Promise<any[]> {
        try {
            const formData = new FormData()
            formData.append('branchID', branchID)
            const endpoints = [
                '/AppointmentReqest/GetAgentList',
                '/AppointmentRequest/GetAgentList',
                '/Appointment/GetAgentList'
            ]
            const response = await this._probeApi(endpoints, formData, 'agent list')
            if (!response) return []
            const data = response?.data?.Data || response?.data || []
            return Array.isArray(data) ? data : (data.Table || [])
        } catch (error) {
            return []
        }
    },

    async getBookingData(params: { typeOfFilter: string; param1: string; param2?: string; param3?: string }): Promise<any[]> {
        try {
            const formData = new FormData()
            formData.append('TypeOfFilter', params.typeOfFilter)
            formData.append('Param1', params.param1)
            if (params.param2) formData.append('Param2', params.param2)
            if (params.param3) formData.append('Param3', params.param3)

            const endpoints = [
                '/AppointmentReqest/GetBookingData',
                '/AppointmentRequest/GetBookingData',
                '/Appointment/GetBookingData'
            ]
            const response = await this._probeApi(endpoints, formData, 'booking data')
            if (!response) return []
            const data = response?.data?.Data || response?.data || []
            return Array.isArray(data) ? data : (data.Table || [])
        } catch (error) {
            return []
        }
    },

    async modifyAppointmentReq(payload: {
        agentFromId: string;
        agentToId: string;
        appointUniqueNumber: string;
        cancelTypeID: string;
        updateType: string; // 'TAKEOWNERSHIP' | 'AGENTASSIGNMENT' | 'CANCEL'
        systemSourceTypeID: string;
        comments: string;
        internalUserId: string;
        appointmentRequestCategory?: string;
    }): Promise<any> {
        try {
            const formData = new FormData()
            Object.entries(payload).forEach(([key, value]) => {
                if (value !== undefined) {
                    // Normalize keys to match legacy API case sensitivity if needed
                    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
                    formData.append(capitalizedKey, value as string)
                }
            })

            const endpoints = [
                '/AppointmentReqest/ModifyAppointmentReq',
                '/AppointmentRequest/ModifyAppointmentReq',
                '/Appointment/ModifyAppointmentReq'
            ]
            const response = await this._probeApi(endpoints, formData, 'modify appointment')
            return response?.data
        } catch (error) {
            throw error
        }
    },

    async bulkCancelAppointments(payload: {
        appointUniqueNumber: string; // comma separated
        preferredLang: string;
        systemSourceTypeID: string;
        internalUserId: string;
        comments: string;
        updateType: string; // 'CANCEL' | 'BULKCANCEL'
    }): Promise<any> {
        try {
            const formData = new FormData()
            Object.entries(payload).forEach(([key, value]) => {
                const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
                formData.append(capitalizedKey, value as string)
            })

            const endpoints = [
                '/AppointmentReqest/AppointmentsBulkCancel',
                '/AppointmentRequest/AppointmentsBulkCancel',
                '/Appointment/AppointmentsBulkCancel'
            ]
            const response = await this._probeApi(endpoints, formData, 'bulk cancel')
            return response?.data
        } catch (error) {
            throw error
        }
    },

    async createSlotsByAdmin(payload: {
        governorateID: string;
        wilayatID: string;
        branchID: string;
        timeSlotDurationID: string;
        timeSlotStart: string;
        timeSlotEnd: string;
        startDate: string;
        endDate: string;
        internalUserID: string;
        noOfAppointmentPerSlot: string;
        lang?: string;
    }): Promise<any> {
        try {
            const formData = new FormData()
            Object.entries(payload).forEach(([key, value]) => {
                const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
                formData.append(capitalizedKey, value as string)
            })
            if (!payload.lang) formData.append('Lang', 'EN')

            const endpoints = [
                '/AppointmentReqest/CreateSlotsByAdmin',
                '/AppointmentReqest/InsertAppointmentSlot',
                '/AppointmentRequest/InsertAppointmentSlot',
                '/Appointment/InsertAppointmentSlot'
            ]
            const response = await this._probeApi(endpoints, formData, 'admin slot creation')
            return response?.data
        } catch (error) {
            throw error
        }
    },

    async checkAvailableTimeSlots(branchID: string, fromDate: string, toDate: string): Promise<any> {
        try {
            const formData = new FormData()
            formData.append('branchID', branchID)
            formData.append('fromDate', fromDate)
            formData.append('toDate', toDate)
            formData.append('Lang', 'EN')

            const endpoints = [
                '/AppointmentReqest/CheckAvailableTimeSlots',
                '/AppointmentRequest/CheckAvailableTimeSlots',
                '/Appointment/CheckAvailableTimeSlots'
            ]
            const response = await this._probeApi(endpoints, formData, 'check available slots')
            return response?.data?.Data || response?.data
        } catch (error) {
            return null
        }
    }
}
