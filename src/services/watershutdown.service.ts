
import {
    getWaterShutdownMasterDataAction,
    getWaterShutdownUserListAction,
    getNotificationsAction,
    getNotificationByIdAction,
    saveNotificationAction,
    deleteNotificationAction,
    getTemplatesAction,
    saveTemplateAction,
    exportToExcelAction,
    getIntermediateHistoryAction,
    resendIntermediateNotificationsAction,
    sendIntermediateSMSAction,
    sendCompletionNotificationAction
} from '@/app/actions/water-shutdown/water-shutdown';
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
            const result = await getWaterShutdownMasterDataAction();
            if (!result.success || !result.data) {
                return { regions: [], eventTypes: [], templateTypes: [] };
            }
            const data = result.data?.Data || result.data || {};

            console.log('GetWaterShutdown Master Data Response:', data);

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
            return { regions: [], eventTypes: [], templateTypes: [] };
        }
    },

    // Get User List (Requested by user)
    getWaterShutdownUserList: async (): Promise<any[]> => {
        try {
            const result = await getWaterShutdownUserListAction();
            if (!result.success || !result.data) {
                return [];
            }
            const data = result.data?.Data || result.data;
            if (Array.isArray(data)) return data;
            if (data?.Table && Array.isArray(data.Table)) return data.Table;
            return [];
        } catch (error) {
            return [];
        }
    },

    // Notification Operations
    getNotificationById: async (id: string): Promise<WaterShutdownNotification> => {
        try {
            console.log(`Fetching notification by ID: ${id}`);
            const result = await getNotificationByIdAction(id);
            if (!result.success || !result.data) {
                throw new Error(result.message || 'Failed to fetch notification details');
            }

            console.log('=== GET NOTIFICATION DETAIL RAW RESPONSE ===');
            const resData = result.data;
            console.log('Full response.data:', JSON.stringify(resData, null, 2));

            if (resData && (resData.StatusCode === 605 || resData.Table || resData.Data?.Table)) {
                const dataRoot = resData.Data || resData;
                console.log('dataRoot:', dataRoot);
                console.log('dataRoot.Table:', dataRoot.Table);
                console.log('dataRoot.Table1:', dataRoot.Table1);
                console.log('dataRoot.Table2:', dataRoot.Table2);

                const mainTable = dataRoot.Table ? dataRoot.Table[0] : null;

                if (!mainTable) {
                    throw { message: 'No notification data found' };
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
                    } catch (e) { }
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
                    } catch (e) { }

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
                    } catch (e) { }

                }

                console.log('=== FINAL RESULT ===');
                console.log('result:', JSON.stringify(result, null, 2));

                return result;
            }
            throw new Error('Failed to fetch notification details');
        } catch (error) {
            throw error;
        }
    },

    getNotifications: async (filters?: WaterShutdownFilters): Promise<WaterShutdownListResponse> => {
        try {
            const result = await getNotificationsAction(filters || {});

            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch notifications');
            }

            const resData = result.data;
            console.log('Water Shutdown List Response Raw:', resData);

            if (resData && (resData.StatusCode === 605 || resData.Table)) {
                const notifications = resData.Table || resData.Data?.Table || [];

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
            throw new Error(resData?.Status || 'Failed to fetch notifications');
        } catch (error: any) {
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
            // Reconstruct data object for server action instead of built-in FormData
            const payloadData: any = {};

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
                    return "";
                }
            };

            const token = typeof window !== 'undefined' ? localStorage.getItem('AU/@/#/TO/#/VA') || sessionStorage.getItem('AU/@/#/TO/#/VA') : 'N/A';
            console.log(`[Submit] Auth Token Status: ${token === 'branch-authenticated' ? 'PLACEHOLDER' : (token ? 'PRESENT' : 'MISSING')}`);

            // "UpdateType" - Only for Edit or Cancel
            if (isCancel) {
                payloadData["UpdateType"] = "CANCELLED"; // For cancellation
                payloadData["Comments"] = data.comments || ""; // Add comments for cancellation
            } else if (isEdit) {
                payloadData["UpdateType"] = ""; // Changed to empty string to match UAT Payload
            }

            // ID Mapping: 
            // - EventID: The record identifier (for Edit/Cancel)
            // - EventUniqueId/NotifyID/id: Fallback ID fields
            if (isEdit || isCancel) {
                payloadData["EventID"] = id;
                payloadData["EventUniqueId"] = id;
                payloadData["NotifyID"] = id;
                payloadData["id"] = id;
                // CRITICAL DISCOVERY: UAT sends the Event's Record ID in EventTypeID field for updates
                payloadData["EventTypeID"] = id;
            } else {
                payloadData["EventTypeID"] = data.eventTypeId.toString();
            }

            // "EventType" - Category
            // In Phase 7, we send the full category name (e.g., "Unplanned Shutdown Leakage")
            // as shortening it to just "Unplanned" might fail backend validation.
            const etCategory = data.eventTypeCategory || data.eventType || "";
            payloadData["EventType"] = etCategory;

            // "NotificationTitle"
            payloadData["NotificationTitle"] = data.notificationTitle;

            // "RegionCode"
            payloadData["RegionCode"] = data.regionCode || data.regionId || "MCT";

            // "PipeLineTypeID"
            let pipeId = "1";
            if (data.typeOfPipeline && data.typeOfPipeline.toLowerCase().includes("transmission")) {
                pipeId = "2";
            }
            payloadData["PipeLineTypeID"] = pipeId;

            // "LocationCode"
            payloadData["LocationCode"] = data.locationDetails || "";

            // Dates
            // CRITICAL: FromDate in UAT uses 'T' separator and no seconds/ms
            payloadData["FromDate"] = formatDateString(data.startDateTime, 'iso');
            payloadData["ToDate"] = formatDateString(data.endDateTime);

            // Schedule/Reminder
            const isUnplanned = etCategory === "Unplanned";
            if (isUnplanned) {
                payloadData["ScheduleNotificationDate"] = "";
                payloadData["RemainderNotificationDate"] = "";
            } else {
                const scheduleVal = data.apologyNotificationDate || "";
                const remainderVal = data.reminderNotificationDate || data.apologyNotificationDate || "";
                // UAT uses 15:00 PM for schedule
                payloadData["ScheduleNotificationDate"] = formatDateString(scheduleVal, 'uat-special');
                payloadData["RemainderNotificationDate"] = formatDateString(remainderVal);
            }

            // ValveLock
            let vLock = data.valveLock;
            if (vLock === "Yes") vLock = "0";
            else if (vLock === "No") vLock = "1";
            payloadData["ValveLock"] = vLock;

            // Status Code (1 for active, 2 for cancelled)
            payloadData["StatusCode"] = isCancel ? "2" : "1";

            // Contractors
            const contractors = Array.isArray(data.contractors)
                ? data.contractors.map((c: any) => ({ contractorName: c.contractorName || c.name }))
                : [{ contractorName: data.contractors }];
            payloadData["ContractorName"] = JSON.stringify(contractors);

            payloadData["ReasonForShutDown"] = data.reasonForShutdown;
            payloadData["NotificationDetails"] = data.notificationDetails;
            payloadData["PipelineSize"] = data.sizeOfPipeline;
            payloadData["TypeOfPipeline"] = data.typeOfPipeline || "";
            payloadData["FocalPointDetails"] = JSON.stringify(data.focalPoints || []);
            payloadData["EventFilepath"] = "";
            payloadData["EventNotificationDetails"] = JSON.stringify(data.eventNotificationDetails || []);

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
            } catch (e) { }


            payloadData["EventLocationDetails"] = JSON.stringify(locationPayload);

            // UserID
            payloadData["UserID"] = "undefined";
            payloadData["EventJsonData"] = data.eventJsonData;

            // Dummy PDF - Mandatory
            const dummyPdf = "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nCXCwQ0AIAgDwP8v7h84oK95wF4C50Wb2L2s6wu38Q4yCmVuZHN0cmVhbQplbmRvYmoKMyAwIG9iago0NAplbmRvYmoKNSAwIG9iago8PC9QYXJlbnQgNCAwIFIvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL1R5cGUvUGFnZS9Db250ZW50cyAyIDAgUj4+CmVuZG9YmoKNCAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1s1IDAgUl0+PgplbmRvYmoKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgNCAwIFI+PgplbmRvYmoKNiAwIG9iago8PC9Qcm9kdWNlcihpVGV4dCA1LjUuNiAqMjAwMC0yMDE1IGlUZXh0IEdyb3VwIE5WIFwoQUdHUEwpKS9Nb2REYXRlKEQ6MjAyMTAxMjgwOTM5MDBaKS9DcmVhdGlvbkRhdGUoRDoyMDIxMDEyODA5MzkwMFopPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZgwwMDAwMDAwMjE2IDAwMDAwIG4KMDAwMDAwMDAxNSAwMDAw0IG4KMDAwMDAwMDA5NSAwMDAw0IG4KMDAwMDAwMDE1NyAwMDAw0IG4KMDAwMDAwMDEwNCAwMDAw0IG4KMDAwMDAwMDI2NiAwMDAw0IG4B0cmFpbGVyCjw8L1NpemUgNy9JbmZvIDYgMCBSL1Jvb3QgMSAwIFIvSUQgWzwyNjQ5MzMyNTY2MzE2NjY1MzgzNTMwMzk2MTMyMzY2Mj4gPDI2NDkzMzI1NjYzMTY2NjUzODM1MzAzOTYxMzIzNjYyPl0+PgpzdGFydHhyZWYKNTAwCiUlRU9GCg==";
            payloadData["EventPdfTemplate"] = dummyPdf;

            // Ensure hours is a clean integer string (UAT doesn't use .00)
            const hoursVal = Math.round(parseFloat(data.numberOfHours || "0")).toString();
            payloadData["EventHours"] = hoursVal;

            console.log(`[Submit] Final Endpoint: ${endpoint}`);
            console.log('[Submit] Payload Data:');
            // Log payload keys
            Object.keys(payloadData).forEach(key => {
                let value = payloadData[key];
                let displayValue = value;
                if (typeof value === 'string' && value.length > 100) {
                    displayValue = value.substring(0, 100) + '... (truncated, len:' + value.length + ')';
                }
                console.log(`  ${key}:`, displayValue);
            });

            const result = await saveNotificationAction(payloadData, endpoint);

            if (!result.success) {
                console.log('[Submit] Server action failed:', result.message);
                throw { message: result.message || 'Failed to submit notification' };
            }

            const response = { data: result.data }; // Wrap to match previous structure
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

            throw { message: resData?.Status || nestedData?.Status || `Failed to submit notification (Code: ${getCode(resData)})` };
        } catch (error: any) {
            throw error;
        }
    },

    // Master Data for Willayats and DMAs
    // Old standalone endpoints removed in favor of Unified Master Data approach
    // getWillayats and getDMAs are no longer needed as they are client-filtered 
    // from the rich master data object.

    deleteNotification: async (id: string): Promise<void> => {
        try {
            const result = await deleteNotificationAction(id);
            if (!result.success) {
                throw new Error(result.message || 'Failed to delete notification');
            }
        } catch (error: any) {
            throw error;
        }
    },

    exportToExcel: async (filters?: WaterShutdownFilters): Promise<Blob> => {
        try {
            const result = await exportToExcelAction(filters || {});
            if (!result.success || !result.data) {
                throw new Error(result.message || "Failed to export to Excel");
            }

            // Convert base64 back to blob
            const byteCharacters = atob(result.data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            return new Blob([byteArray], { type: 'application/octet-stream' });
        } catch (error: any) {
            throw error;
        }
    },

    // Template Operations
    // Template Operations
    getTemplates: async (): Promise<WaterShutdownTemplate[]> => {
        try {
            const result = await getTemplatesAction();
            if (!result.success || !result.data) {
                return [];
            }
            const data = result.data?.Data || result.data || {};
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
            return [];
        }
    },

    getTemplateById: async (id: string): Promise<WaterShutdownTemplate> => {
        try {
            // We reuse the list action since it gets all or single depending on args
            // But since getTemplatesAction takes no ID argument in the current implementation,
            // we will fetch all and find, OR we'd need to update the action.
            // The existing getTemplatesAction hardcodes empty ID.
            // However, getTemplateById implementation used: formData.append('TemplateDetailsID', id);
            // This suggests we need a specific action or update getTemplatesAction.
            // For now, let's assume getTemplatesAction can be used if we fix it or create a new one.
            // Actually, best to fetch all and filter client side if the list is small, OR 
            // since I can't easily change the action signature confirmedly without checking,
            // I'll stick to the pattern: The action file has `saveTemplateAction`, `getTemplatesAction`.
            // Let's rely on fetching all for now or create another action helper if needed.
            // Wait, looking at water-shutdown.ts again, getTemplatesAction sends '';

            // To properly refactor, I should rely on the server action. 
            // If the list is huge, this is inefficient, but for templates it's likely fine.
            // BUT, to be safer, I will continue to use `getTemplatesAction` which returns the list.

            const result = await getTemplatesAction();
            if (!result.success || !result.data) {
                throw new Error("Failed to load templates");
            }

            const data = result.data?.Data || result.data || {};
            const table = data.Table || data.Data?.Table || (Array.isArray(data) ? data : []);

            const item = table.find((t: any) => (t.TemplateDetailsID?.toString() === id || t.id?.toString() === id));

            if (!item) throw { message: 'Template not found' };

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
            throw error;
        }
    },

    createTemplate: async (data: any): Promise<WaterShutdownTemplate> => {
        try {
            // Refactor to use server action
            const payload: any = {};
            payload.UpdateType = 'CREATE'; // Mapped from service logic
            // Service used 'CREATE', but backend might need "" or specific value. 
            // Assuming 'CREATE' works based on previous service code.
            // However, previous service code used `CreateEvent` or `InsertEventTemplateDetails`?
            // Line 792 used `/WaterShutdown/InsertEventTemplateDetails`.

            payload.TemplateDetailsID = '';
            payload.EventTypeID = data.eventType;
            payload.TemplateTypeID = data.templateType;
            payload.EmailTemplateEn = data.emailBody || '';
            payload.EmailTemplateAr = '';
            payload.SMSTemplateEn = data.body;
            payload.SMSTemplateAr = data.bodyAr || '';
            payload.UserID = '';

            const result = await saveTemplateAction(payload);

            if (result.success && result.data && (result.data.IsSuccess === 1 || result.data.Status === "Success")) {
                return result.data.Data || result.data;
            }

            throw { message: result.message || result.data?.Status || 'Failed to create template' };
        } catch (error: any) {
            throw error;
        }
    },

    updateTemplate: async (id: string, data: any): Promise<WaterShutdownTemplate> => {
        try {
            const payload: any = {};
            payload.UpdateType = 'UPDATE';
            payload.TemplateDetailsID = id;
            payload.EventTypeID = data.eventType;
            payload.TemplateTypeID = data.templateType;
            payload.EmailTemplateEn = data.emailBody || '';
            payload.EmailTemplateAr = '';
            payload.SMSTemplateEn = data.body;
            payload.SMSTemplateAr = data.bodyAr || '';
            payload.UserID = '';

            const result = await saveTemplateAction(payload);

            if (result.success && result.data && (result.data.IsSuccess === 1 || result.data.Status?.toLowerCase() === "success" || result.data.StatusCode === 605)) {
                return result.data.Data || result.data;
            }

            throw new Error(result.message || result.data?.Status || 'Failed to update template');
        } catch (error: any) {
            console.error('Error updating template:', error);
            throw error;
        }
    },

    deleteTemplate: async (id: string): Promise<void> => {
        try {
            const payload: any = {};
            payload.UpdateType = 'DELETE';
            payload.TemplateDetailsID = id;
            // Required placeholders
            payload.EventTypeID = '';
            payload.TemplateTypeID = '';
            payload.EmailTemplateEn = '';
            payload.EmailTemplateAr = '';
            payload.SMSTemplateEn = '';
            payload.SMSTemplateAr = '';
            payload.UserID = '';

            const result = await saveTemplateAction(payload);

            if (result.success && result.data && (result.data.IsSuccess === 1 || result.data.Status === "Success" || result.data.StatusCode === 605)) {
                return;
            }

            throw new Error(result.message || result.data?.Status || 'Failed to delete template');
        } catch (error: any) {
            console.error('Error deleting template:', error);
            throw error;
        }
    },


    // Intermediate SMS Operations
    getIntermediateHistory: async (eventId: string): Promise<any[]> => {
        try {
            const result = await getIntermediateHistoryAction(eventId);
            if (!result.success || !result.data) {
                return [];
            }
            return result.data?.Data || result.data || [];
        } catch (error: any) {
            console.error('Error fetching intermediate history:', error);
            return [];
        }
    },

    async resendIntermediateNotifications(eventId: string | null): Promise<any> {
        if (!eventId) return;
        try {
            const result = await resendIntermediateNotificationsAction(eventId);
            if (!result.success) {
                throw new Error(result.message || 'Failed to resend notifications');
            }
            return result.data;
        } catch (error: any) {
            console.error('Error resending intermediate notifications:', error);
            throw error;
        }
    },

    sendIntermediateSMS: async (eventId: string, data: {
        fromHour: string;
        toHour: string;
        templateEn: string;
        templateAr: string;
    }): Promise<void> => {
        try {
            const result = await sendIntermediateSMSAction(eventId, data);

            if (!result.success) {
                throw new Error(result.message || 'Failed to send SMS');
            }

            // Check response data for success indicators
            if (result.data && (result.data.IsSuccess === 1 || result.data.Status === 'Success')) {
                return;
            }
            throw new Error(result.data?.Status || 'Failed to send SMS');
        } catch (error: any) {
            console.error('Error sending intermediate SMS:', error);
            throw error;
        }
    },

    // Completion Notification
    sendCompletionNotification: async (eventId: string): Promise<void> => {
        try {
            const result = await sendCompletionNotificationAction(eventId);

            if (!result.success) {
                throw new Error(result.message || 'Failed to send completion notification');
            }

            // Check response data for success indicators
            if (result.data && (result.data.IsSuccess === 1 || result.data.Status === 'Success')) {
                return;
            }
            throw new Error(result.data?.Status || 'Failed to send completion notification');
        } catch (error: any) {
            console.error('Error sending completion notification:', error);
            throw error;
        }
    },
};
