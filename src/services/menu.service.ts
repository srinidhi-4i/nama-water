import { apiClient } from '@/lib/api-client'
import { MenuItem, Announcement, CommonDetails } from '@/types'

// Default menu items (fallback when API fails)
const DEFAULT_MENU_ITEMS: MenuItem[] = [
    // Branch Operations
    { MenuId: 1, Parent_Id: null, Menu_Name_EN: "Validate/Search a customer", Menu_Name_AR: "التحقق/البحث عن عميل", Target_Url: "/branchoperations/validate", Icon_Class: "", order: 1, IsActive: true, ApplicationNameEn: "Branch Operations" },
    { MenuId: 2, Parent_Id: null, Menu_Name_EN: "Guest User Service", Menu_Name_AR: "خدمة المستخدم الضيف", Target_Url: "/branchoperations/guest", Icon_Class: "", order: 2, IsActive: true, ApplicationNameEn: "Branch Operations" },

    // Notification Center
    { MenuId: 3, Parent_Id: null, Menu_Name_EN: "Notification Templates", Menu_Name_AR: "قوالب الإشعارات", Target_Url: "/notificationtemplate", Icon_Class: "", order: 3, IsActive: true, ApplicationNameEn: "Notification Center" },
    { MenuId: 4, Parent_Id: null, Menu_Name_EN: "Custom Notification", Menu_Name_AR: "إشعار مخصص", Target_Url: "/customnotification", Icon_Class: "", order: 4, IsActive: true, ApplicationNameEn: "Notification Center" },

    // Water Shutdown
    { MenuId: 5, Parent_Id: null, Menu_Name_EN: "Water Shutdown Notification List", Menu_Name_AR: "قائمة إشعارات إيقاف المياه", Target_Url: "/watershutdown", Icon_Class: "", order: 5, IsActive: true, ApplicationNameEn: "Water Shutdown" },
    { MenuId: 6, Parent_Id: null, Menu_Name_EN: "Water Shutdown Templates", Menu_Name_AR: "قوالب إيقاف المياه", Target_Url: "/watershutdown/templates", Icon_Class: "", order: 6, IsActive: true, ApplicationNameEn: "Water Shutdown" },

    // Wetland
    { MenuId: 7, Parent_Id: null, Menu_Name_EN: "Wetland Slot Creation", Menu_Name_AR: "إنشاء فتحة الأراضي الرطبة", Target_Url: "/wetland/slots", Icon_Class: "", order: 7, IsActive: true, ApplicationNameEn: "Wetland" },
    { MenuId: 8, Parent_Id: null, Menu_Name_EN: "Holiday Calendar", Menu_Name_AR: "تقويم العطلات", Target_Url: "/wetland/holidays", Icon_Class: "", order: 8, IsActive: true, ApplicationNameEn: "Wetland" },

    // Appointment
    { MenuId: 9, Parent_Id: null, Menu_Name_EN: "Appointment Booking", Menu_Name_AR: "حجز موعد", Target_Url: "/appointmentbooking", Icon_Class: "", order: 9, IsActive: true, ApplicationNameEn: "Appointment" },
]

export const menuService = {
    /**
     * Get menu details for the logged-in user
     * Matches React app: dashActions.GetMenuDetails()
     */
    async getMenuDetails(): Promise<MenuItem[]> {
        try {
            const response = await apiClient.simplePost<MenuItem[]>('Menu/GetMenuDetails')

            // If response is valid and has data, return it
            if (response && Array.isArray(response) && response.length > 0) {
                // Ensure ApplicationNameEn is present (backend might miss it) and Force Correct Grouping
                return response.map(item => {
                    let appName = item.ApplicationNameEn || "General";
                    // Fail-safe: Override group names based on menu name signatures
                    // This fixes cases where API returns inconsistent ApplicationNameEn
                    if (item.Menu_Name_EN.includes("Validate") || item.Menu_Name_EN.includes("Guest")) {
                        appName = "Branch Operations";
                    } else if (item.Menu_Name_EN.includes("Notification")) {
                        appName = "Notification Center";
                    } else if (item.Menu_Name_EN.includes("Water Shutdown")) {
                        appName = "Water Shutdown";
                    } else if (item.Menu_Name_EN.includes("Wetland") || item.Menu_Name_EN.includes("Holiday")) {
                        appName = "Wetland";
                    } else if (item.Menu_Name_EN.includes("Appointment")) {
                        appName = "Appointment";
                    }
                    return {
                        ...item,
                        ApplicationNameEn: appName
                    };
                })
            }

            // Otherwise return default menu items
            console.log('Using default menu items as fallback (API returned empty)')
            return DEFAULT_MENU_ITEMS
        } catch (error) {
            // Log as warning to reduce console noise
            console.warn('Using default menu items due to API error:', error)
            return DEFAULT_MENU_ITEMS
        }
    },

    /**
     * Get announcement data
     * Matches React app: CommonService.getAPIResponse('Menu/GetAnnouncementData')
     */
    async getAnnouncements(): Promise<Announcement[]> {
        try {
            const response = await apiClient.simplePost<Announcement[]>('Menu/GetAnnouncementData')
            return response || []
        } catch (error) {
            console.warn('Error fetching announcements (using empty fallback):', error)
            return []
        }
    },

    /**
     * Get common configuration details
     * Includes flags like waterleakageUp, appointmentBookingUp, etc.
     */
    async getCommonDetails(): Promise<CommonDetails> {
        try {
            const response = await apiClient.simplePost<CommonDetails>('Common/GetCommonDetails')
            return response
        } catch (error) {
            console.error('Error fetching common details:', error)
            throw error
        }
    },
}
