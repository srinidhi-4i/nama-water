import { api } from '@/lib/axios';
import {
    WaterShutdownNotification,
    WaterShutdownTemplate,
    WaterShutdownFilters,
    WaterShutdownListResponse,
    CreateNotificationRequest,
    UpdateNotificationRequest,
    CreateTemplateRequest,
    UpdateTemplateRequest,
} from '@/types/watershutdown.types';

export const waterShutdownService = {
    // Notification Operations
    getNotifications: async (filters?: WaterShutdownFilters): Promise<WaterShutdownListResponse> => {
        try {
            const params = new URLSearchParams();

            if (filters?.region) params.append('region', filters.region);
            if (filters?.eventType) params.append('eventType', filters.eventType);
            if (filters?.status) params.append('status', filters.status);
            if (filters?.fromDate) params.append('fromDate', filters.fromDate);
            if (filters?.toDate) params.append('toDate', filters.toDate);
            if (filters?.searchQuery) params.append('search', filters.searchQuery);
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

            const response = await api.get<any>(`/api/watershutdown/notifications?${params.toString()}`);

            if (response.data && response.data.StatusCode === 605) {
                return {
                    data: response.data.Data?.notifications || [],
                    total: response.data.Data?.total || 0,
                    page: filters?.page || 1,
                    pageSize: filters?.pageSize || 10,
                };
            }

            throw new Error(response.data?.Status || 'Failed to fetch notifications');
        } catch (error: any) {
            console.error('Error fetching water shutdown notifications:', error);

            // Return mock data for development
            console.warn('Using mock data for water shutdown notifications');
            return waterShutdownService.getMockNotifications(filters);
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

            const response = await api.post<any>('/api/watershutdown/notifications', formData);

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

            const response = await api.put<any>(`/api/watershutdown/notifications/${id}`, formData);

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
            const response = await api.get<any>('/api/watershutdown/templates');

            if (response.data && response.data.StatusCode === 605) {
                return response.data.Data || [];
            }

            throw new Error(response.data?.Status || 'Failed to fetch templates');
        } catch (error: any) {
            console.error('Error fetching templates:', error);

            // Return mock data for development
            console.warn('Using mock data for templates');
            return waterShutdownService.getMockTemplates();
        }
    },

    createTemplate: async (data: CreateTemplateRequest): Promise<WaterShutdownTemplate> => {
        try {
            const formData = new FormData();
            formData.append('eventType', data.eventType);
            formData.append('templateType', data.templateType);
            formData.append('subject', data.subject);
            if (data.subjectAr) formData.append('subjectAr', data.subjectAr);
            formData.append('body', data.body);
            if (data.bodyAr) formData.append('bodyAr', data.bodyAr);

            const response = await api.post<any>('/api/watershutdown/templates', formData);

            if (response.data && response.data.StatusCode === 605) {
                return response.data.Data;
            }

            throw new Error(response.data?.Status || 'Failed to create template');
        } catch (error: any) {
            console.error('Error creating template:', error);
            throw error;
        }
    },

    updateTemplate: async (id: string, data: UpdateTemplateRequest): Promise<WaterShutdownTemplate> => {
        try {
            const formData = new FormData();
            formData.append('id', id);
            if (data.eventType) formData.append('eventType', data.eventType);
            if (data.templateType) formData.append('templateType', data.templateType);
            if (data.subject) formData.append('subject', data.subject);
            if (data.subjectAr) formData.append('subjectAr', data.subjectAr);
            if (data.body) formData.append('body', data.body);
            if (data.bodyAr) formData.append('bodyAr', data.bodyAr);

            const response = await api.put<any>(`/api/watershutdown/templates/${id}`, formData);

            if (response.data && response.data.StatusCode === 605) {
                return response.data.Data;
            }

            throw new Error(response.data?.Status || 'Failed to update template');
        } catch (error: any) {
            console.error('Error updating template:', error);
            throw error;
        }
    },

    // Mock Data Functions (for development)
    getMockNotifications: (filters?: WaterShutdownFilters): WaterShutdownListResponse => {
        const mockData: WaterShutdownNotification[] = [
            {
                eventId: 'Event/214',
                eventType: 'Major Planned Event',
                status: 'SCHEDULED',
                region: 'MUSCAT',
                startDateTime: '2025-12-02T09:00:00',
                endDateTime: '2025-12-02T21:00:00',
                reason: 'Maintenance of main water pipeline',
                affectedCustomers: 1250,
            },
            {
                eventId: 'Event/213',
                eventType: 'Minor Planned Event',
                status: 'CUSTOMER_TRIG',
                region: 'MUSCAT',
                startDateTime: '2025-11-27T05:01:00',
                endDateTime: '2025-11-27T23:59:00',
                reason: 'Customer triggered shutdown',
                affectedCustomers: 850,
            },
            {
                eventId: 'Event/212',
                eventType: 'Minor Planned Event',
                status: 'CUSTOMER_TRIG',
                region: 'MUSCAT',
                startDateTime: '2025-11-05T22:00:00',
                endDateTime: '2025-11-06T00:00:00',
                reason: 'Emergency repair work',
                affectedCustomers: 450,
            },
        ];

        return {
            data: mockData,
            total: mockData.length,
            page: 1,
            pageSize: 10,
        };
    },

    getMockTemplates: (): WaterShutdownTemplate[] => {
        return [
            {
                id: '1',
                eventType: 'Major Planned Event',
                templateType: 'Event Creation',
                subject: 'Water Shutdown Notification',
                body: 'Dear Customer, we would like to inform you about an upcoming water shutdown...',
            },
            {
                id: '2',
                eventType: 'Major Planned Event',
                templateType: 'Reminder',
                subject: 'Reminder: Water Shutdown Tomorrow',
                body: 'This is a reminder about the scheduled water shutdown...',
            },
            {
                id: '3',
                eventType: 'Major Planned Event',
                templateType: 'Apology',
                subject: 'Apology for Water Shutdown Inconvenience',
                body: 'We apologize for any inconvenience caused...',
            },
            {
                id: '4',
                eventType: 'Major Planned Event',
                templateType: 'Cancellation',
                subject: 'Water Shutdown Cancelled',
                body: 'We are pleased to inform you that the scheduled water shutdown has been cancelled...',
            },
            {
                id: '5',
                eventType: 'Major Planned Event',
                templateType: 'Event Completion',
                subject: 'Water Service Restored',
                body: 'We are happy to inform you that water service has been restored...',
            },
        ];
    },
};
