import { api } from '@/lib/axios';
import { apiClient } from '@/lib/api-client';
import {
    WaterShutdownNotification,
    WaterShutdownTemplate,
    WaterShutdownFilters,
    WaterShutdownListResponse,
    CreateNotificationRequest,
    UpdateNotificationRequest,
    SaveNotificationRequest,
    CreateTemplateRequest,
    UpdateTemplateRequest,
    RegionItem,
    EventTypeItem,
} from '@/types/watershutdown.types';

export interface WaterShutdownMasterData {
    regions: RegionItem[];
    eventTypes: EventTypeItem[];
    templateTypes: any[];
}

export const waterShutdownService = {
    // Master Data
    getWaterShutdownMasterData: async (): Promise<WaterShutdownMasterData> => {
        try {
            const formData = new FormData();
            formData.append('masterType', '');

            const response = await api.post<any>('/WaterShutdown/GetWaterShutdown', formData);
            const data = response.data?.Data || response.data || {};

            console.log('GetWaterShutdown Master Data Response:', response.data);

            let regions: any[] = [];
            let eventTypes: any[] = [];
            let templateTypes: any[] = [];

            // Helper to get all arrays from the response object
            const tables = Object.values(data).filter(val => Array.isArray(val) && val.length > 0) as any[][];

            // Diagnostic: Log all found tables and their first item's keys
            console.log('--- GetWaterShutdown Diagnostic Start ---');
            Object.entries(data).forEach(([key, val]) => {
                if (Array.isArray(val)) {
                    console.log(`Table "${key}" (length: ${val.length}) keys:`, val[0] ? Object.keys(val[0]) : 'empty');
                }
            });
            console.log('--- GetWaterShutdown Diagnostic End ---');

            // Deduplicate logic helper
            const deduplicate = (arr: any[], key: string) => {
                const seen = new Set();
                return arr.filter(item => {
                    const val = item[key];
                    if (seen.has(val)) return false;
                    seen.add(val);
                    return true;
                });
            };

            // Strategy: Look for specific columns in the first item of each table to identify it
            for (const table of tables) {
                const firstItem = table[0];
                const keys = Object.keys(firstItem).map(k => k.toLowerCase());

                // Identify Event Types (Table 0 usually)
                if (keys.some(k => k.includes('eventtypeid')) && !keys.some(k => k.includes('templatetypeid'))) {
                    eventTypes = table;
                }

                // Identify Regions (Table 6 usually)
                if (keys.some(k => k.includes('regionid')) && !keys.some(k => k.includes('willayathid'))) {
                    // Regions table has RegionID but NOT WillayathID
                    regions = table;
                }

                // Identify Template Types (Table 9 usually)
                if (keys.some(k => k.includes('templatetypeid'))) {
                    templateTypes = table;
                }
            }

            // Identify Willayats (Table 7) & DMAs (Table 8) based on known columns in reference app
            // Table 7: WillayathID, RegionID
            // Table 8: DMAID, WillayathID
            let willayatsRaw: any[] = [];
            let dmasRaw: any[] = [];

            for (const table of tables) {
                const firstItem = table[0];
                if (firstItem.WillayathID && firstItem.RegionID && !firstItem.DMAID) {
                    willayatsRaw = table;
                }
                if (firstItem.DMAID && firstItem.WillayathID) {
                    dmasRaw = table;
                }
            }

            // Build Hierarchy: Region -> Willayats -> DMAs
            // 1. Map DMAs
            const dmas = dmasRaw.map(d => ({
                DMAID: d.DMAID,
                DMACode: d.DMACode,
                DMANameEn: d.DMANameEn,
                DMANameAr: d.DMANameAr,
                RegionID: d.RegionID ? d.RegionID.trim() : "",
                WillayathID: d.WillayathID
            }));

            // 2. Map Willayats and attach DMAs
            const willayats = willayatsRaw.map(w => ({
                WillayathID: w.WillayathID,
                WillayathCode: w.WillayathCode,
                WillayathNameEn: w.WillayathNameEn,
                WillayathNameAr: w.WillayathNameAr,
                RegionID: w.RegionID ? w.RegionID.trim() : "",
                RegionCode: w.RegionCode ? w.RegionCode.trim() : "",
                DMAs: dmas.filter(d => d.WillayathID === w.WillayathID)
            }));

            // 3. Map Regions and attach Willayats
            const uniqueRegions = deduplicate(regions.map(r => ({
                RegionID: r.RegionID ? r.RegionID.trim() : "",
                RegionCode: r.RegionCode ? r.RegionCode.trim() : "",
                RegionName: r.RegionNameEn || r.RegionName_EN || r.RegionName || r.regionName || r.NameEn || r.RegionCode,
                wilayats: willayats.filter(w => w.RegionID === (r.RegionID ? r.RegionID.trim() : ""))
            })), 'RegionID');

            const uniqueEventTypes = deduplicate(eventTypes.map(e => ({
                EventTypeID: e.EventTypeID || e.EventTypeId || e.eventTypeId || e.ID || e.Id,
                EventTypeName: e.EventTypeName || e.EventTypeNameEn || e.eventTypeName || e.Name || e.NameEn || e.EventTypeCode,
                EventTypeCode: e.EventTypeCode || e.eventTypeCode || e.EventTypeName || e.Code
            })), 'EventTypeID');

            return {
                regions: uniqueRegions,
                eventTypes: uniqueEventTypes,
                templateTypes
            };
        } catch (error) {
            console.error('Error fetching master data:', error);
            return { regions: [], eventTypes: [], templateTypes: [] };
        }
    },

    // Get User List (Requested by user)
    getWaterShutdownUserList: async (): Promise<any[]> => {
        try {
            const formData = new FormData();
            const response = await api.post<any>('/WaterShutdown/GetWaterShutDownUserList', formData);
            // Assume similar structure or direct array
            const data = response.data?.Data || response.data;
            if (Array.isArray(data)) return data;
            if (data?.Table && Array.isArray(data.Table)) return data.Table;
            return [];
        } catch (error) {
            console.error('Error fetching user list:', error);
            return [];
        }
    },

    // Notification Operations
    getNotificationById: async (id: string): Promise<WaterShutdownNotification> => {
        try {
            console.log(`Fetching notification by ID: ${id}`);
            const formData = new FormData();
            formData.append('EventID', id);
            // Fallback for some APIs that might expect EventUniqueId
            formData.append('EventUniqueId', id);
            // Fallback for some APIs that might expect internal ID as id
            formData.append('id', id);

            const response = await api.post<any>('/WaterShutdown/GetWaterShutDownEventDetailsSingle', formData);
            console.log('Get Notification Detail Raw Response:', response.data);

            if (response.data && (response.data.StatusCode === 605 || response.data.Table || response.data.Data?.Table)) {
                const dataRoot = response.data.Data || response.data;
                const mainTable = dataRoot.Table ? dataRoot.Table[0] : null;

                if (!mainTable) {
                    console.error('No notification data found in Table array. Full response:', response.data);
                    throw new Error('No notification data found');
                }

                // Basic mapping
                const result: WaterShutdownNotification = {
                    eventId: mainTable.EventUniqueId,
                    internalId: mainTable.EventId,
                    eventType: mainTable.EventTypeName,
                    status: mainTable.StatusCode,
                    region: mainTable.RegionName,
                    regionCode: mainTable.RegionCode, // Crucial for edit mode pre-fill
                    startDateTime: mainTable.StartDateAndTime,
                    endDateTime: mainTable.EndDateAndTime,
                    reason: mainTable.ReasonForShutDown || mainTable.ReasonForShutdown || '',
                    affectedCustomers: 0,
                    notificationTitle: mainTable.NotificationTitle,
                    locationDetails: mainTable.LocationDetails,
                    scheduleNotificationDate: mainTable.ScheduleNotificationDate,
                    remainderNotificationDate: mainTable.RemainderNotificationDat,
                    apologyNotificationDate: mainTable.ApologyNotificationDate,
                    reasonForShutdown: mainTable.ReasonForShutDown,
                    notificationDetails: mainTable.NotificationDetails,
                    eventJsonData: mainTable.EventJsonData,
                    initiatedBy: mainTable.InitiatedBy,

                    // Technical Details
                    valveLock: 'No',
                    sizeOfPipeline: '',
                    typeOfPipeline: '',
                    numberOfHours: ''
                };

                // Parse Actions (Table 1) if available
                const actionTable = dataRoot.Table1 || [];
                if (actionTable.length > 0) {
                    result.teamActions = [];
                    // We need to map this carefully in the UI, or store raw here
                    // For now, let's extract them if they follow the expected format
                    try {
                        // Logic from reference: response.Table1.map...
                        // We will pass this to UI to handle matching with TEAMS constant
                        result.teamActions = actionTable.map((item: any) => {
                            let actions = [];
                            try {
                                const parsed = item.TemplateTypes ? JSON.parse(item.TemplateTypes) : [];
                                // Handle case where parsed is array of objects or strings
                                actions = parsed.map((p: any) => typeof p === 'string' ? p : (p.TemplateCode || p.ActionName || ''));
                            } catch (e) {
                                // Fallback if not JSON
                                actions = [];
                            }

                            return {
                                teamName: item.TeamName || item.Team || "", // Try to get name from API
                                isActive: true,
                                actions: actions.filter((a: string) => a !== ''),
                                code: item.EventActionCode // Helper for UI mapping
                            };
                        });
                    } catch (e) { console.error('Error parsing Table1 actions', e); }
                }

                // Parse Locations (Table 2) if available
                // In reference app, Table 2 seems to be location data too? Or Table 6,7,8 used for reconstruction?
                // Actually reference uses Table 2 for checking selected checkboxes.

                // Parse EventJsonData if available (Primary source for details)
                if (mainTable.EventJsonData) {
                    try {
                        const eventJson = JSON.parse(mainTable.EventJsonData);
                        result.affectedWillayats = eventJson.AffectedWillayats || [];
                        result.affectedDMAs = eventJson.AffectedDMAs || [];
                        result.contractors = eventJson.ContractorName || [];

                        // Merge or override actions from JSON if Table1 was empty
                        if (!result.teamActions || result.teamActions.length === 0) {
                            result.actionsRequired = eventJson.ActionsRequired || [];
                            result.teamActions = eventJson.TeamActions || [];
                        }

                        result.valveLock = eventJson.ValveLock || result.valveLock;

                        // Handle legacy vs new valve lock (ID vs Name)
                        if (mainTable.ValveLock) result.valveLock = mainTable.ValveLock;

                        result.sizeOfPipeline = eventJson.SizeOfPipeline || mainTable.PipelineSize || result.sizeOfPipeline;
                        result.typeOfPipeline = eventJson.TypeOfPipeline || result.typeOfPipeline;
                        result.numberOfHours = eventJson.NumberOfHours || mainTable.EventHours || result.numberOfHours;

                        // Focal Points
                        const fpRaw = mainTable.FocalPointDetails || eventJson.FocalPoint;
                        if (typeof fpRaw === 'string') {
                            try { result.focalPoint = JSON.parse(fpRaw); } catch { result.focalPoint = []; }
                        } else if (Array.isArray(fpRaw)) {
                            result.focalPoint = fpRaw;
                        }

                        result.mapLocations = eventJson.MapLocations || [];
                    } catch (e) {
                        console.error('Error parsing EventJsonData:', e);
                    }
                }

                // Contractor fallback
                if (mainTable.ContractorName && (!result.contractors || result.contractors.length === 0)) {
                    try {
                        result.contractors = JSON.parse(mainTable.ContractorName);
                    } catch { /* ignore */ }
                }

                return result;
            }
            throw new Error('Failed to fetch notification details');
        } catch (error) {
            console.error('Error fetching notification by ID:', error);
            throw error;
        }
    },

    getNotifications: async (filters?: WaterShutdownFilters): Promise<WaterShutdownListResponse> => {
        try {
            const formData = new FormData();
            formData.append('region', filters?.region === "ALL" ? "" : filters?.region || "");
            formData.append('eventType', filters?.eventType === "ALL" ? "" : filters?.eventType || "");
            formData.append('fromDate', filters?.fromDate || "");
            formData.append('toDate', filters?.toDate || "");

            const response = await api.post<any>('/WaterShutdown/GetEventDetails', formData);

            console.log('Water Shutdown List Response Raw:', response.data);
            if (response.data && (response.data.StatusCode === 605 || response.data.Table)) {
                const notifications = response.data.Table || response.data.Data?.Table || [];

                const mappedNotifications: WaterShutdownNotification[] = notifications.map((item: any) => ({
                    eventId: item.EventUniqueId,
                    internalId: item.EventId,
                    eventType: item.EventTypeName,
                    status: item.StatusCode,
                    region: item.RegionName,
                    startDateTime: item.StartDateAndTime,
                    endDateTime: item.EndDateAndTime,
                    reason: item.ReasonForShutDown || item.ReasonForShutdown || '',
                    notificationTitle: item.NotificationTitle,
                    locationDetails: item.LocationDetails,
                    scheduleNotificationDate: item.ScheduleNotificationDate,
                    remainderNotificationDate: item.RemainderNotificationDat,
                    reasonForShutdown: item.ReasonForShutDown || item.ReasonForShutdown,
                    notificationDetails: item.NotificationDetails,
                    eventJsonData: item.EventJsonData,
                    initiatedBy: item.InitiatedBy,
                    affectedCustomers: 0
                }));

                return {
                    data: mappedNotifications,
                    total: mappedNotifications.length,
                    page: filters?.page || 1,
                    pageSize: filters?.pageSize || 10,
                };
            }
            throw new Error(response.data?.Status || 'Failed to fetch notifications');
        } catch (error: any) {
            console.error('Error fetching water shutdown notifications:', error);
            throw error;
        }
    },

    saveNotification: async (data: SaveNotificationRequest): Promise<any> => {
        try {
            const formData = new FormData();
            if (data.eventId) formData.append('EventUniqueId', data.eventId);
            formData.append('NotificationTitle', data.notificationTitle);
            formData.append('EventTypeId', data.eventTypeId.toString());
            formData.append('RegionId', data.regionId);
            formData.append('StartDateAndTime', data.startDateTime);
            formData.append('EndDateAndTime', data.endDateTime);
            formData.append('ScheduleNotificationDate', data.reminderNotificationDate || '');
            formData.append('ApologyNotificationDate', data.apologyNotificationDate || '');
            formData.append('NotificationDetails', data.notificationDetails);
            formData.append('ReasonForShutDown', data.reasonForShutdown);
            formData.append('EventJsonData', data.eventJsonData);

            // Required by some backends even if using EventJsonData
            formData.append('ValveLock', data.valveLock);
            formData.append('TypeOfPipeline', data.typeOfPipeline);
            formData.append('SizeOfPipeline', data.sizeOfPipeline);
            formData.append('NumberOfHours', data.numberOfHours);

            const response = await api.post<any>('/WaterShutdown/SaveWaterShutDownEventDetails', formData);

            if (response.data && (response.data.StatusCode === 605 || response.data.IsSuccess === 1)) {
                return response.data.Data || response.data;
            }

            throw new Error(response.data?.Status || 'Failed to save notification');
        } catch (error: any) {
            console.error('Error saving notification:', error);
            throw error;
        }
    },

    createNotification: async (data: any): Promise<any> => {
        return waterShutdownService.saveNotification(data);
    },

    updateNotification: async (id: string, data: any): Promise<any> => {
        return waterShutdownService.saveNotification({ ...data, eventId: id });
    },

    // Master Data for Willayats and DMAs
    // Old standalone endpoints removed in favor of Unified Master Data approach
    // getWillayats and getDMAs are no longer needed as they are client-filtered 
    // from the rich master data object.

    deleteNotification: async (id: string): Promise<void> => {
        try {
            const response = await api.delete<any>(`/WaterShutdown/notifications/${id}`);

            if (response.data && response.data.StatusCode !== 605) {
                throw new Error(response.data?.Status || 'Failed to delete notification');
            }
        } catch (error: any) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    },

    exportToExcel: async (filters?: WaterShutdownFilters): Promise<Blob> => {
        try {
            const params = new URLSearchParams();

            if (filters?.region) params.append('region', filters.region);
            if (filters?.eventType) params.append('eventType', filters.eventType);
            if (filters?.status) params.append('status', filters.status);
            if (filters?.fromDate) params.append('fromDate', filters.fromDate);
            if (filters?.toDate) params.append('toDate', filters.toDate);
            if (filters?.searchQuery) params.append('search', filters.searchQuery);

            const response = await api.get(`/WaterShutdown/notifications/export?${params.toString()}`, {
                responseType: 'blob',
            });

            return response.data;
        } catch (error: any) {
            console.error('Error exporting to Excel:', error);
            throw error;
        }
    },

    // Template Operations
    getTemplates: async (): Promise<WaterShutdownTemplate[]> => {
        try {
            const formData = new FormData();
            formData.append('TemplateDetailsID', '');

            const response = await api.post<any>('/WaterShutdown/GetEventTemplateDetails', formData);

            const data = response.data?.Data || response.data || {};
            const table = data.Table || data.Data?.Table || (Array.isArray(data) ? data : []);

            return table.map((item: any) => ({
                id: item.TemplateDetailsID || item.id,
                eventType: item.EventTypeNameEn || item.eventType,
                templateType: item.TemplateTypeNameEn || item.templateType,
                subject: item.EmailTemplateEn ? "Email Template" : item.Subject,
                body: item.SMSTemplateEn || item.body,
                bodyAr: item.SMSTemplateAr || item.bodyAr,
                // Add raw data for components that need specific API fields
                ...item
            }));
        } catch (error: any) {
            console.error('Error fetching templates:', error);
            return [];
        }
    },

    getTemplateById: async (id: string): Promise<WaterShutdownTemplate> => {
        try {
            const formData = new FormData();
            formData.append('TemplateDetailsID', id);

            const response = await api.post<any>('/WaterShutdown/GetEventTemplateDetails', formData);
            const data = response.data?.Data || response.data || {};
            const item = (data.Table && data.Table[0]) || data;

            // Decode Email template if it exists
            let decodedEmail = "";
            if (item.EmailTemplateEn) {
                try {
                    decodedEmail = decodeURIComponent(escape(atob(item.EmailTemplateEn)));
                } catch (e) {
                    decodedEmail = item.EmailTemplateEn;
                }
            }

            return {
                id: item.TemplateDetailsID || item.id,
                eventType: item.EventTypeNameEn || item.eventType,
                templateType: item.TemplateTypeNameEn || item.templateType,
                subject: item.Subject || "WATER OPERATION SHUTDOWN NOTIFICATION",
                body: item.SMSTemplateEn || item.body,
                bodyAr: item.SMSTemplateAr || item.bodyAr,
                emailBody: decodedEmail,
                ...item
            };
        } catch (error: any) {
            console.error('Error fetching template details:', error);
            throw error;
        }
    },

    createTemplate: async (data: any): Promise<WaterShutdownTemplate> => {
        try {
            const formData = new FormData();
            formData.append('UpdateType', 'CREATE');
            formData.append('TemplateDetailsID', '');
            formData.append('EventTypeID', data.eventType);
            formData.append('TemplateTypeID', data.templateType);
            formData.append('EmailTemplateEn', data.emailBody || '');
            formData.append('EmailTemplateAr', '');
            formData.append('SMSTemplateEn', data.body);
            formData.append('SMSTemplateAr', data.bodyAr || '');
            formData.append('UserID', '');

            const response = await api.post<any>('/WaterShutdown/InsertEventTemplateDetails', formData);

            if (response.data && (response.data.IsSuccess === 1 || response.data.Status === "Success")) {
                return response.data.Data || response.data;
            }

            throw new Error(response.data?.Status || 'Failed to create template');
        } catch (error: any) {
            console.error('Error creating template:', error);
            throw error;
        }
    },

    updateTemplate: async (id: string, data: any): Promise<WaterShutdownTemplate> => {
        try {
            const formData = new FormData();
            formData.append('UpdateType', 'UPDATE');
            formData.append('TemplateDetailsID', id);
            formData.append('EventTypeID', data.eventType);
            formData.append('TemplateTypeID', data.templateType);
            formData.append('EmailTemplateEn', data.emailBody || '');
            formData.append('EmailTemplateAr', '');
            formData.append('SMSTemplateEn', data.body);
            formData.append('SMSTemplateAr', data.bodyAr || '');
            formData.append('UserID', '');

            const response = await api.post<any>('/WaterShutdown/InsertEventTemplateDetails', formData);

            if (response.data && (response.data.IsSuccess === 1 || response.data.Status?.toLowerCase() === "success" || response.data.StatusCode === 605)) {
                return response.data.Data || response.data;
            }

            throw new Error(response.data?.Status || 'Failed to update template');
        } catch (error: any) {
            console.error('Error updating template:', error);
            throw error;
        }
    },

    deleteTemplate: async (id: string): Promise<void> => {
        try {
            const formData = new FormData();
            formData.append('UpdateType', 'DELETE');
            formData.append('TemplateDetailsID', id);
            // Required placeholders
            formData.append('EventTypeID', '');
            formData.append('TemplateTypeID', '');
            formData.append('EmailTemplateEn', '');
            formData.append('EmailTemplateAr', '');
            formData.append('SMSTemplateEn', '');
            formData.append('SMSTemplateAr', '');
            formData.append('UserID', '');

            const response = await api.post<any>('/WaterShutdown/InsertEventTemplateDetails', formData);

            if (response.data && (response.data.IsSuccess === 1 || response.data.Status === "Success" || response.data.StatusCode === 605)) {
                return;
            }

            throw new Error(response.data?.Status || 'Failed to delete template');
        } catch (error: any) {
            console.error('Error deleting template:', error);
            throw error;
        }
    },


    // Intermediate SMS Operations
    getIntermediateHistory: async (eventId: string): Promise<any[]> => {
        try {
            const formData = new FormData();
            formData.append('EventId', eventId);

            const response = await api.post<any>('/WaterShutdown/GetIntermediateHistory', formData);
            return response.data?.Data || response.data || [];
        } catch (error: any) {
            console.error('Error fetching intermediate history:', error);
            return [];
        }
    },

    async resendIntermediateNotifications(eventId: string | null): Promise<any> {
        if (!eventId) return;
        const response = await api.post<any>(`/WaterShutdown/ResendIntermediateNotifications?EventUniqueId=${eventId}`);
        return response.data;
    },

    sendIntermediateSMS: async (eventId: string, data: {
        fromHour: string;
        toHour: string;
        templateEn: string;
        templateAr: string;
    }): Promise<void> => {
        try {
            const formData = new FormData();
            formData.append('UpdateType', 'INTERMEDIATE TRIGGERED');
            formData.append('EventId', eventId);
            formData.append('UserId', ''); // UserID handled by interceptor or optional
            formData.append('FromHour', data.fromHour);
            formData.append('ToHour', data.toHour);
            formData.append('TemplateEn', data.templateEn);
            formData.append('TemplateAr', data.templateAr);
            formData.append('Lang', 'EN');

            const response = await api.post<any>('/WaterShutdown/IntermediateSmsEvent', formData);

            if (response.data && (response.data.IsSuccess === 1 || response.data.Status === 'Success')) {
                return;
            }
            throw new Error(response.data?.Status || 'Failed to send SMS');
        } catch (error: any) {
            console.error('Error sending intermediate SMS:', error);
            throw error;
        }
    },

    // Completion Notification
    sendCompletionNotification: async (eventId: string): Promise<void> => {
        try {
            const formData = new FormData();
            formData.append('UpdateType', 'COMPLETION TRIGGERED');
            formData.append('EventId', eventId);
            formData.append('UserId', ''); // UserID handled by interceptor
            formData.append('Comments', 'Completion Success');
            formData.append('Lang', 'EN');

            const response = await api.post<any>('/WaterShutdown/CompletionNotificationEvent', formData);

            if (response.data && (response.data.IsSuccess === 1 || response.data.Status === 'Success')) {
                return;
            }
            throw new Error(response.data?.Status || 'Failed to send completion notification');
        } catch (error: any) {
            console.error('Error sending completion notification:', error);
            throw error;
        }
    },
};
