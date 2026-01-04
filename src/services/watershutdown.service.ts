import { api } from '@/lib/axios';
import { apiClient } from '@/lib/api-client';
import {
    WaterShutdownNotification,
    WaterShutdownTemplate,
    WaterShutdownFilters,
    WaterShutdownListResponse,
    CreateNotificationRequest,
    UpdateNotificationRequest,
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

            // Strategy: Look for specific columns in the first item of each table to identify it
            for (const table of tables) {
                const firstItem = table[0];
                const keys = Object.keys(firstItem).map(k => k.toLowerCase());

                // Identify Event Types
                if (keys.some(k => k.includes('eventtypeid') || k.includes('event_type_id'))) {
                    // Check if it's NOT template types (sometimes they share keys)
                    if (!keys.some(k => k.includes('templatetypeid'))) {
                        eventTypes = table;
                        console.log('Found EventTypes table:', table.length);
                        continue;
                    }
                }

                // Identify Regions
                if (keys.some(k => k.includes('regionid') || k.includes('region_id'))) {
                    regions = table;
                    console.log('Found Regions table:', table.length);
                    continue;
                }

                // Identify Template Types
                if (keys.some(k => k.includes('templatetypeid') || k.includes('template_type_id'))) {
                    templateTypes = table;
                    console.log('Found TemplateTypes table:', table.length);
                    continue;
                }
            }

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

            const uniqueRegions = deduplicate(regions.map(r => ({
                RegionID: r.RegionID || r.RegionId || r.regionId,
                RegionName: r.RegionName || r.RegionNameEn || r.regionName,
                RegionCode: r.RegionCode || r.regionCode || r.RegionName
            })), 'RegionID');

            const uniqueEventTypes = deduplicate(eventTypes.map(e => ({
                EventTypeID: e.EventTypeID || e.EventTypeId || e.eventTypeId,
                EventTypeName: e.EventTypeName || e.EventTypeNameEn || e.eventTypeName,
                EventTypeCode: e.EventTypeCode || e.eventTypeCode || e.EventTypeName
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
    getNotificationById: async (id: string): Promise<any> => {
        try {
            const formData = new FormData();
            formData.append('EventID', id);

            const response = await api.post<any>('/WaterShutdown/GetWaterShutDownEventDetailsSingle', formData);
            if (response.data && (response.data.StatusCode === 605 || response.data.Table)) {
                return response.data; // Return the full response containing Table, Table1, etc.
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

            console.log('Water Shutdown Response:', response.data); // Debug log

            // The API response structure seems to return the list in response.data.Table directly
            // based on the logs seen (Status: success, StatusCode: 605, Data: Object, Table: Array...)
            if (response.data && (response.data.StatusCode === 605 || response.data.Table)) {

                const notifications = response.data.Table || response.data.Data?.Table || [];

                // Map API response to our type if necessary, or use as is if types match
                // Assuming keys might be PascalCase in API and we use camelCase or matching types
                // Let's map it safely
                const mappedNotifications: WaterShutdownNotification[] = notifications.map((item: any) => ({
                    eventId: item.EventUniqueId,
                    eventType: item.EventTypeName,
                    status: item.StatusCode,
                    region: item.RegionName,
                    startDateTime: item.StartDateAndTime,
                    endDateTime: item.EndDateAndTime,
                    reason: item.ReasonForShutdown || '', // Add other fields as needed
                    affectedCustomers: 0 // Placeholder if not available
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
            // Return mock data for development if API fails differently than expected
            // console.warn('Using mock data for water shutdown notifications');
            // return waterShutdownService.getMockNotifications(filters);
            throw error;
        }
    },

    createNotification: async (data: CreateNotificationRequest): Promise<WaterShutdownNotification> => {
        try {
            const formData = new FormData();
            formData.append('eventType', data.eventType);
            formData.append('region', data.region);
            formData.append('startDateTime', data.startDateTime);
            formData.append('endDateTime', data.endDateTime);
            formData.append('reason', data.reason);
            if (data.reasonAr) formData.append('reasonAr', data.reasonAr);
            if (data.affectedCustomers) formData.append('affectedCustomers', data.affectedCustomers.toString());

            const response = await api.post<any>('/WaterShutdown/SaveEventDetails', formData);

            if (response.data && response.data.StatusCode === 605) {
                return response.data.Data;
            }

            throw new Error(response.data?.Status || 'Failed to create notification');
        } catch (error: any) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },

    updateNotification: async (id: string, data: UpdateNotificationRequest): Promise<WaterShutdownNotification> => {
        try {
            const formData = new FormData();
            formData.append('eventId', id);
            if (data.eventType) formData.append('eventType', data.eventType);
            if (data.region) formData.append('region', data.region);
            if (data.startDateTime) formData.append('startDateTime', data.startDateTime);
            if (data.endDateTime) formData.append('endDateTime', data.endDateTime);
            if (data.reason) formData.append('reason', data.reason);
            if (data.reasonAr) formData.append('reasonAr', data.reasonAr);
            if (data.status) formData.append('status', data.status);
            if (data.affectedCustomers) formData.append('affectedCustomers', data.affectedCustomers.toString());

            const response = await api.post<any>('/WaterShutdown/SaveEventDetails', formData);

            if (response.data && response.data.StatusCode === 605) {
                return response.data.Data;
            }

            throw new Error(response.data?.Status || 'Failed to update notification');
        } catch (error: any) {
            console.error('Error updating notification:', error);
            throw error;
        }
    },

    deleteNotification: async (id: string): Promise<void> => {
        try {
            const response = await api.delete<any>(`/api/watershutdown/notifications/${id}`);

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

            const response = await api.get(`/api/watershutdown/notifications/export?${params.toString()}`, {
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

            if (response.data && (response.data.IsSuccess === 1 || response.data.Status === "Success")) {
                return response.data.Data || response.data;
            }

            throw new Error(response.data?.Status || 'Failed to update template');
        } catch (error: any) {
            console.error('Error updating template:', error);
            throw error;
        }
    },

    // Mock Data Functions (for development)
    // getMockNotifications: (filters?: WaterShutdownFilters): WaterShutdownListResponse => {
    //     const mockData: WaterShutdownNotification[] = [
    //         {
    //             eventId: 'Event/214',
    //             eventType: 'Major Planned Event',
    //             status: 'SCHEDULED',
    //             region: 'MUSCAT',
    //             startDateTime: '2025-12-02T09:00:00',
    //             endDateTime: '2025-12-02T21:00:00',
    //             reason: 'Maintenance of main water pipeline',
    //             affectedCustomers: 1250,
    //         },
    //         {
    //             eventId: 'Event/213',
    //             eventType: 'Minor Planned Event',
    //             status: 'CUSTOMER_TRIG',
    //             region: 'MUSCAT',
    //             startDateTime: '2025-11-27T05:01:00',
    //             endDateTime: '2025-11-27T23:59:00',
    //             reason: 'Customer triggered shutdown',
    //             affectedCustomers: 850,
    //         },
    //         {
    //             eventId: 'Event/212',
    //             eventType: 'Minor Planned Event',
    //             status: 'CUSTOMER_TRIG',
    //             region: 'MUSCAT',
    //             startDateTime: '2025-11-05T22:00:00',
    //             endDateTime: '2025-11-06T00:00:00',
    //             reason: 'Emergency repair work',
    //             affectedCustomers: 450,
    //         },
    //     ];

    //     return {
    //         data: mockData,
    //         total: mockData.length,
    //         page: 1,
    //         pageSize: 10,
    //     };
    // },

    // getMockTemplates: (): WaterShutdownTemplate[] => {
    //     return [
    //         {
    //             id: '1',
    //             eventType: 'Major Planned Event',
    //             templateType: 'Event Creation',
    //             subject: 'Water Shutdown Notification',
    //             body: 'Dear Customer, we would like to inform you about an upcoming water shutdown...',
    //         },
    //         {
    //             id: '2',
    //             eventType: 'Major Planned Event',
    //             templateType: 'Reminder',
    //             subject: 'Reminder: Water Shutdown Tomorrow',
    //             body: 'This is a reminder about the scheduled water shutdown...',
    //         },
    //         {
    //             id: '3',
    //             eventType: 'Major Planned Event',
    //             templateType: 'Apology',
    //             subject: 'Apology for Water Shutdown Inconvenience',
    //             body: 'We apologize for any inconvenience caused...',
    //         },
    //         {
    //             id: '4',
    //             eventType: 'Major Planned Event',
    //             templateType: 'Cancellation',
    //             subject: 'Water Shutdown Cancelled',
    //             body: 'We are pleased to inform you that the scheduled water shutdown has been cancelled...',
    //         },
    //         {
    //             id: '5',
    //             eventType: 'Major Planned Event',
    //             templateType: 'Event Completion',
    //             subject: 'Water Service Restored',
    //             body: 'We are happy to inform you that water service has been restored...',
    //         },
    //     ];
    // },
};
