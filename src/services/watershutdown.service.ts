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
                console.log("Diagnostic Table Dump:", keys, firstItem);

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
                DMAID: d.DMAID || d.DmaId || d.ID,
                DMACode: d.DMACode || d.DmaCode,
                DMANameEn: d.DMANameEn || d.DmaNameEn,
                DMANameAr: d.DMANameAr || d.DmaNameAr,
                RegionID: String(d.RegionID || d.RegionId || "").trim(),
                WillayathID: d.WillayathID || d.WillayathId
            }));

            // 2. Map Willayats and attach DMAs
            // Refine ID Extraction to avoid fallback to Codes
            const willayats = willayatsRaw.map(w => {
                const wId = w.WillayathID || w.WillayathId || w.ID;
                const regId = String(w.RegionID || w.RegionId || "").trim();
                return {
                    WillayathID: wId,
                    WillayathCode: w.WillayathCode || w.WillayathCode,
                    WillayathNameEn: w.WillayathNameEn || w.WillayathName,
                    WillayathNameAr: w.WillayathNameAr || w.WillayathNameAr,
                    RegionID: regId,
                    RegionCode: w.RegionCode ? String(w.RegionCode).trim() : "",
                    DMAs: dmas.filter(d => (d.WillayathID && d.WillayathID === wId))
                };
            });

            // 3. Map Regions and attach Willayats
            const uniqueRegions = deduplicate(regions.map(r => {
                const rID = String(r.RegionID || r.RegionId || "").trim();
                return {
                    RegionID: rID,
                    RegionCode: r.RegionCode ? String(r.RegionCode).trim() : "",
                    RegionName: r.RegionNameEn || r.RegionName_EN || r.RegionName || r.regionName || r.NameEn || r.RegionCode,
                    wilayats: willayats.filter(w => w.RegionID === rID)
                };
            }), 'RegionID');

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
            console.log('=== GET NOTIFICATION DETAIL RAW RESPONSE ===');
            console.log('Full response.data:', JSON.stringify(response.data, null, 2));

            if (response.data && (response.data.StatusCode === 605 || response.data.Table || response.data.Data?.Table)) {
                const dataRoot = response.data.Data || response.data;
                console.log('dataRoot:', dataRoot);
                console.log('dataRoot.Table:', dataRoot.Table);
                console.log('dataRoot.Table1:', dataRoot.Table1);
                console.log('dataRoot.Table2:', dataRoot.Table2);

                const mainTable = dataRoot.Table ? dataRoot.Table[0] : null;

                if (!mainTable) {
                    console.error('No notification data found in Table array. Full response:', response.data);
                    throw new Error('No notification data found');
                }

                console.log('mainTable (Table[0]):', mainTable);

                // Basic mapping
                const result: WaterShutdownNotification = {
                    eventId: mainTable.EventId?.toString() || mainTable.EventUniqueId, // Use EventId as primary
                    internalId: mainTable.EventId,
                    eventType: mainTable.EventName || mainTable.EventTypeName, // EventName is the actual type name
                    eventTypeId: mainTable.EventTypeID,
                    status: mainTable.StatusCode,
                    region: mainTable.RegionName,
                    regionCode: mainTable.RegionCode,
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
                    valveLock: mainTable.ValveLock === 0 ? 'Yes' : 'No', // 0 = Yes, 1 = No in API
                    sizeOfPipeline: mainTable.PipelineSize || '',
                    typeOfPipeline: mainTable.PipeLineTypeNameEn || '',
                    numberOfHours: ''
                };

                // Parse Actions (Table 1) if available
                // Template Code Mapping
                const templateCodeMap: Record<string, string> = {
                    'EVNT': 'Event Creation',
                    'INMC': 'Intermediate',
                    'CMPLT': 'Event Completion',
                    'APLG': 'Apology',
                    'RMDR': 'Reminder'
                };

                const actionTable = dataRoot.Table1 || [];
                console.log('actionTable (Table1):', actionTable);
                if (actionTable.length > 0) {
                    result.teamActions = [];
                    try {
                        result.teamActions = actionTable.map((item: any) => {
                            console.log('Processing action item:', item);
                            let actions: string[] = [];
                            try {
                                const parsed = item.TemplateTypes ? JSON.parse(item.TemplateTypes) : [];
                                console.log('Parsed TemplateTypes:', parsed);
                                // Map TemplateCode to action names
                                actions = parsed
                                    .map((p: any) => {
                                        const code = typeof p === 'string' ? p : (p.TemplateCode || p.ActionName || '');
                                        return templateCodeMap[code] || code;
                                    })
                                    .filter((a: string) => a !== '');
                            } catch (e) {
                                console.error('Error parsing TemplateTypes:', e);
                                actions = [];
                            }

                            return {
                                teamName: item.EventActionNameEn || item.TeamName || item.Team || "",
                                isActive: true,
                                actions: actions,
                                code: item.EventActionCode
                            };
                        });
                        console.log('Parsed teamActions:', result.teamActions);
                    } catch (e) { console.error('Error parsing Table1 actions', e); }
                }

                // Parse Locations (Table 2) if available
                // In reference app, Table 2 seems to be location data too? Or Table 6,7,8 used for reconstruction?
                // Actually reference uses Table 2 for checking selected checkboxes.

                // Parse EventJsonData if available (Primary source for details)
                if (mainTable.EventJsonData) {
                    try {
                        const eventJson = JSON.parse(mainTable.EventJsonData);
                        console.log('Parsed EventJsonData:', eventJson);

                        result.affectedWillayats = eventJson.AffectedWillayats || [];
                        result.affectedDMAs = eventJson.AffectedDMAs || [];
                        const rawContractors = mainTable.ContractorName || eventJson.ContractorName || [];
                        const parsedContractors = typeof rawContractors === 'string' ? JSON.parse(rawContractors) : rawContractors;
                        result.contractors = (parsedContractors || []).map((c: any) =>
                            typeof c === 'string' ? { contractorName: c } : c
                        );

                        // Merge or override actions from JSON if Table1 was empty
                        if (!result.teamActions || result.teamActions.length === 0) {
                            result.actionsRequired = eventJson.ActionsRequired || [];
                            result.teamActions = eventJson.TeamActions || [];
                        }

                        result.valveLock = eventJson.ValveLock || result.valveLock;

                        // Handle legacy vs new valve lock (ID vs Name)
                        if (mainTable.ValveLock !== undefined && mainTable.ValveLock !== null)
                            result.valveLock = mainTable.ValveLock === 0 ? 'Yes' : 'No';

                        result.sizeOfPipeline = eventJson.SizeOfPipeline || mainTable.PipelineSize || result.sizeOfPipeline;
                        result.typeOfPipeline = eventJson.TypeOfPipeline || result.typeOfPipeline;
                        result.numberOfHours = eventJson.NumberOfHours || mainTable.EventHours || result.numberOfHours;

                        // Focal Points
                        const fpRaw = mainTable.FocalPointDetails || eventJson.FocalPoint;
                        console.log('fpRaw:', fpRaw);
                        if (typeof fpRaw === 'string') {
                            try {
                                result.focalPoint = JSON.parse(fpRaw);
                                console.log('Parsed focalPoint from string:', result.focalPoint);
                            } catch { result.focalPoint = []; }
                        } else if (Array.isArray(fpRaw)) {
                            result.focalPoint = fpRaw;
                            console.log('focalPoint from array:', result.focalPoint);
                        }

                        result.mapLocations = eventJson.MapLocations || [];
                    } catch (e) {
                        console.error('Error parsing EventJsonData:', e);
                    }
                }

                // Contractor fallback
                console.log('[Edit] mainTable.ContractorName:', mainTable.ContractorName);
                console.log('[Edit] result.contractors before fallback:', result.contractors);

                if (mainTable.ContractorName && (!result.contractors || result.contractors.length === 0)) {
                    try {
                        const parsedC = typeof mainTable.ContractorName === 'string' ? JSON.parse(mainTable.ContractorName) : mainTable.ContractorName;
                        result.contractors = (parsedC || []).map((c: any) =>
                            typeof c === 'string' ? { contractorName: c } : c
                        );
                        console.log('contractors from mainTable.ContractorName (parsed):', result.contractors);
                    } catch (e) {
                        console.error('Error parsing mainTable.ContractorName:', e);
                    }
                }

                console.log('=== FINAL RESULT ===');
                console.log('result:', JSON.stringify(result, null, 2));

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

                const mappedNotifications: WaterShutdownNotification[] = notifications.map((item: any) => {
                    // Log keys to find Apology Date
                    console.log('[Edit] Raw Item Keys:', Object.keys(item));
                    console.log('[Edit] Raw Item Values:', item);

                    const apologyDate = item.ApologyNotificationDate || item.apologyNotificationDate || item.ApologyDate || item.apologyDate || undefined;

                    return {
                        eventId: item.EventUniqueId,
                        internalId: item.EventId,
                        eventType: item.EventTypeName,
                        eventTypeId: item.EventTypeID,
                        status: item.StatusCode,
                        region: item.RegionName,
                        regionCode: item.RegionCode,
                        startDateTime: item.StartDateAndTime,
                        endDateTime: item.EndDateAndTime,
                        reason: item.ReasonForShutDown || item.ReasonForShutdown || '',
                        notificationTitle: item.NotificationTitle,
                        locationDetails: item.LocationDetails,
                        scheduleNotificationDate: item.ScheduleNotificationDate,
                        remainderNotificationDate: item.RemainderNotificationDat || item.RemainderNotificationDate, // Note: RemainderNotificationDat (typo in legacy?)
                        apologyNotificationDate: apologyDate,
                        reasonForShutdown: item.ReasonForShutDown || item.ReasonForShutdown,
                        notificationDetails: item.NotificationDetails,
                        eventJsonData: item.EventJsonData,
                        initiatedBy: item.InitiatedBy,
                        affectedCustomers: 0
                    };
                });

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

    // Shared Submit Logic
    createNotification: async (data: any): Promise<any> => {
        return waterShutdownService._submitHelper("", data, '/WaterShutdown/CreateEvent', false);
    },

    updateNotification: async (id: string, data: UpdateNotificationRequest): Promise<any> => {
        return waterShutdownService._submitHelper(id, data, '/WaterShutdown/EditEvent', true);
    },

    cancelNotification: async (id: string, data: UpdateNotificationRequest): Promise<any> => {
        return waterShutdownService._submitHelper(id, data, '/WaterShutdown/EditEvent', true, true);
    },

    // Legacy generic save - redirect to create
    saveNotification: async (data: any): Promise<any> => {
        return waterShutdownService._submitHelper("", data, '/WaterShutdown/CreateEvent', false);
    },



    _submitHelper: async (id: string, data: CreateNotificationRequest, endpoint: string, isEdit: boolean = false, isCancel: boolean = false) => {
        try {
            const formData = new FormData();

            const formatDateString = (date: Date | string, type: '24h' | '12h' | 'iso' | 'uat-special' = '24h') => {
                if (!date) return "";
                try {
                    const d = typeof date === 'string' ? new Date(date) : date;
                    if (isNaN(d.getTime())) return typeof date === 'string' ? date : "";

                    const pad = (num: number) => num < 10 ? '0' + num : num;
                    if (type === '12h') {
                        const hours = d.getHours();
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
                        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(formattedHours)}:${pad(d.getMinutes())} ${ampm}`;
                    }
                    if (type === 'iso') {
                        // UAT FromDate format: 2026-03-19T15:57 (no seconds)
                        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                    }
                    if (type === 'uat-special') {
                        // UAT ScheduleNotificationDate format: 2026-01-23 15:00 PM (24h + AM/PM)
                        const hours = d.getHours();
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(hours)}:${pad(d.getMinutes())} ${ampm}`;
                    }
                    // Restore .000 as it was part of the working legacy create format
                    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.000`;
                } catch (e) {
                    console.error("Error formatting date:", e);
                    return "";
                }
            };

            const token = typeof window !== 'undefined' ? localStorage.getItem('AU/@/#/TO/#/VA') || sessionStorage.getItem('AU/@/#/TO/#/VA') : 'N/A';
            console.log(`[Submit] Auth Token Status: ${token === 'branch-authenticated' ? 'PLACEHOLDER' : (token ? 'PRESENT' : 'MISSING')}`);

            // "UpdateType" - Only for Edit or Cancel
            if (isCancel) {
                formData.append("UpdateType", "CANCELLED"); // For cancellation
                formData.append("Comments", data.comments || ""); // Add comments for cancellation
            } else if (isEdit) {
                formData.append("UpdateType", ""); // Changed to empty string to match UAT Payload
            }

            // ID Mapping: 
            // - EventID: The record identifier (for Edit/Cancel)
            // - EventUniqueId/NotifyID/id: Fallback ID fields
            if (isEdit || isCancel) {
                formData.append("EventID", id);
                formData.append("EventUniqueId", id);
                formData.append("NotifyID", id);
                formData.append("id", id);
                // CRITICAL DISCOVERY: UAT sends the Event's Record ID in EventTypeID field for updates
                formData.append("EventTypeID", id);
            } else {
                formData.append("EventTypeID", data.eventTypeId.toString());
            }

            // "EventType" - Category
            // In Phase 7, we send the full category name (e.g., "Unplanned Shutdown Leakage")
            // as shortening it to just "Unplanned" might fail backend validation.
            const etCategory = data.eventTypeCategory || data.eventType || "";
            formData.append("EventType", etCategory);

            // "NotificationTitle"
            formData.append("NotificationTitle", data.notificationTitle);

            // ... (omitted intermediate lines to keep context, but replace_file_content handles contiguous block. 
            // Wait, I need contiguous block. I will include everything between the two changes or make two calls?
            // UserID is further down at line 583. Multi_replace is better.


            // "RegionCode"
            formData.append("RegionCode", data.regionCode || data.regionId || "MCT");

            // "PipeLineTypeID"
            let pipeId = "1";
            if (data.typeOfPipeline && data.typeOfPipeline.toLowerCase().includes("transmission")) {
                pipeId = "2";
            }
            formData.append("PipeLineTypeID", pipeId);

            // "LocationCode"
            formData.append("LocationCode", data.locationDetails || "");

            // Dates
            // CRITICAL: FromDate in UAT uses 'T' separator and no seconds/ms
            formData.append("FromDate", formatDateString(data.startDateTime, 'iso'));
            formData.append("ToDate", formatDateString(data.endDateTime));

            // Schedule/Reminder
            const isUnplanned = etCategory === "Unplanned";
            if (isUnplanned) {
                formData.append("ScheduleNotificationDate", "");
                formData.append("RemainderNotificationDate", "");
            } else {
                const scheduleVal = data.apologyNotificationDate || "";
                const remainderVal = data.reminderNotificationDate || data.apologyNotificationDate || "";
                // UAT uses 15:00 PM for schedule
                formData.append("ScheduleNotificationDate", formatDateString(scheduleVal, 'uat-special'));
                formData.append("RemainderNotificationDate", formatDateString(remainderVal));
            }

            // ValveLock
            let vLock = data.valveLock;
            if (vLock === "Yes") vLock = "0";
            else if (vLock === "No") vLock = "1";
            formData.append("ValveLock", vLock);

            // Status Code (1 for active, 2 for cancelled)
            formData.append("StatusCode", isCancel ? "2" : "1");

            // Contractors
            const contractors = Array.isArray(data.contractors)
                ? data.contractors.map((c: any) => ({ contractorName: c.contractorName || c.name }))
                : [{ contractorName: data.contractors }];
            formData.append("ContractorName", JSON.stringify(contractors));

            formData.append("ReasonForShutDown", data.reasonForShutdown);
            formData.append("NotificationDetails", data.notificationDetails);
            formData.append("PipelineSize", data.sizeOfPipeline);
            formData.append("TypeOfPipeline", data.typeOfPipeline || "");
            formData.append("FocalPointDetails", JSON.stringify(data.focalPoints || []));
            formData.append("EventFilepath", "");
            formData.append("EventNotificationDetails", JSON.stringify(data.eventNotificationDetails || []));

            // EventLocationDetails
            let locationPayload = { RegionData: [{ RegionCode: data.regionCode || "MCT", Regions: [] }] } as any;
            try {
                if (data.locationObjects && data.locationObjects.willayats) {
                    const regionID = data.locationObjects.region?.RegionID || "";
                    const regionCode = data.locationObjects.region?.RegionCode || data.regionCode || "MCT";
                    const regions = data.locationObjects.willayats.map((w: any) => ({
                        WillayathID: w.WillayathID,
                        WillayathCode: w.WillayathCode,
                        WillayathNameAr: w.WillayathNameAr,
                        WillayathNameEn: w.WillayathNameEn,
                        DMA: data.locationObjects?.dmas
                            .filter((d: any) => d.WillayathID === w.WillayathID || d.WillayathCode === w.WillayathCode)
                            .map((d: any) => ({
                                DMAID: d.DMAID,
                                DMACode: d.DMACode,
                                DMANameAr: d.DMANameAr,
                                DMANameEn: d.DMANameEn,
                                IsActive: true,
                            })) || []
                    }));
                    locationPayload = { RegionData: [{ RegionID: regionID, RegionCode: regionCode, Regions: regions }] };
                }
            } catch (e) {
                console.error("Error constructing location details", e);
            }

            formData.append("EventLocationDetails", JSON.stringify(locationPayload));

            // UserID
            formData.append("UserID", "undefined");

            formData.append("EventJsonData", data.eventJsonData);

            // Dummy PDF - Mandatory
            const dummyPdf = "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nCXCwQ0AIAgDwP8v7h84oK95wF4C50Wb2L2s6wu38Q4yCmVuZHN0cmVhbQplbmRvYmoKMyAwIG9iago0NAplbmRvYmoKNSAwIG9iago8PC9QYXJlbnQgNCAwIFIvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL1R5cGUvUGFnZS9Db250ZW50cyAyIDAgUj4+CmVuZG9YmoKNCAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1s1IDAgUl0+PgplbmRvYmoKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgNCAwIFI+PgplbmRvYmoKNiAwIG9iago8PC9Qcm9kdWNlcihpVGV4dCA1LjUuNiAqMjAwMC0yMDE1IGlUZXh0IEdyb3VwIE5WIFwoQUdHUEwpKS9Nb2REYXRlKEQ6MjAyMTAxMjgwOTM5MDBaKS9DcmVhdGlvbkRhdGUoRDoyMDIxMDEyODA5MzkwMFopPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZgwwMDAwMDAwMjE2IDAwMDAwIG4KMDAwMDAwMDAxNSAwMDAw0IG4KMDAwMDAwMDA5NSAwMDAw0IG4KMDAwMDAwMDE1NyAwMDAw0IG4KMDAwMDAwMDEwNCAwMDAw0IG4KMDAwMDAwMDI2NiAwMDAw0IG4B0cmFpbGVyCjw8L1NpemUgNy9JbmZvIDYgMCBSL1Jvb3QgMSAwIFIvSUQgWzwyNjQ5MzMyNTY2MzE2NjY1MzgzNTMwMzk2MTMyMzY2Mj4gPDI2NDkzMzI1NjYzMTY2NjUzODM1MzAzOTYxMzIzNjYyPl0+PgpzdGFydHhyZWYKNTAwCiUlRU9GCg==";
            formData.append("EventPdfTemplate", dummyPdf);

            // Ensure hours is a clean integer string (UAT doesn't use .00)
            const hoursVal = Math.round(parseFloat(data.numberOfHours || "0")).toString();
            formData.append("EventHours", hoursVal);

            console.log(`[Submit] Final Endpoint: ${endpoint}`);
            console.log('[Submit] FormData Contents:');
            formData.forEach((value, key) => {
                let displayValue = value;
                if (typeof value === 'string' && value.length > 100) {
                    displayValue = value.substring(0, 100) + '... (truncated, len:' + value.length + ')';
                }
                console.log(`  ${key}:`, displayValue);
            });

            const response = await api.post<any>(endpoint, formData);

            console.log('[Submit] API Response Raw:', response.data);

            const resData = response.data;
            const nestedData = resData?.Data || {};

            const getCode = (obj: any) => obj?.StatusCode?.toString();
            const getStatus = (obj: any) => obj?.Status?.toLowerCase() || "";

            const hasFailureStatus = getStatus(resData).includes("fail") || getStatus(nestedData).includes("fail");

            const isSuccess = resData && !hasFailureStatus && (
                getCode(resData) === "1" ||
                getCode(resData) === "200" ||
                getCode(resData) === "605" ||
                getCode(nestedData) === "1" ||
                getCode(nestedData) === "200" ||
                getCode(nestedData) === "605" ||
                getStatus(resData).includes("success") ||
                getStatus(resData).includes("done") ||
                getStatus(resData).includes("added") ||
                getStatus(resData).includes("updated") ||
                getStatus(resData).includes("cancelled") ||
                getStatus(nestedData).includes("success") ||
                getStatus(nestedData).includes("done") ||
                getStatus(nestedData).includes("added") ||
                getStatus(nestedData).includes("updated") ||
                getStatus(nestedData).includes("cancelled") ||
                nestedData.EventId || nestedData.EventID || resData.EventId || resData.EventID ||
                (resData.Table && resData.Table.length > 0)
            );

            if (isSuccess) {
                console.log('[Submit] Success detected (Code:', getCode(resData) || getCode(nestedData), ')');
                return resData;
            }

            console.log('[Submit] Unsuccessful Response Logic Triggered:', resData);
            // Final fallback: ONLY if we have an absolute success indicator like EventId AND it's not a failure status
            if (!hasFailureStatus && (nestedData.EventId || nestedData.EventID || resData.EventId || resData.EventID || getCode(resData) === "605")) {
                return resData;
            }

            throw new Error(resData?.Status || nestedData?.Status || `Failed to submit notification (Code: ${getCode(resData)})`);
        } catch (error: any) {
            console.error('Error submitting notification:', error);
            if (error.response) {
                console.error('API Error Response Data:', error.response.data);
                console.error('API Error Status:', error.response.status);
            }
            throw error;
        }
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
