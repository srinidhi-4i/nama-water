import { apiClient } from '@/lib/api-client'
import { MenuItem, Announcement, CommonDetails } from '@/types'

// Guest Branch Service URLs - matching e-poral-paw GuestBranchServiceURLS
export const GUEST_BRANCH_SERVICE_URLS = [
    "ReportWaterLeakBranchOperation",
    "GenericComplaintsBranch",
    "ReportWaterLeakingBop",
    "ReportCompanyVehiclesBop",
    "VehicleComplaintsBranch",
    "ContractorWorkComplaintBranch",
    "ReportQualityBop",
    "ReportHighPressure",
    "WastewaterServiceBranch",
    "WaterOverflowBranch",
    "SewerOdorComplaintBranch"
]

// Default menu items (fallback when API fails)
const DEFAULT_MENU_ITEMS: MenuItem[] = [
    // Branch Operations
    { MenuId: 1, Parent_Id: null, Menu_Name_EN: "Validate/Search a customer", Menu_Name_AR: "التحقق/البحث عن عميل", Target_Url: "/branch-operations/validate", Icon_Class: "", order: 1, IsActive: true, ApplicationNameEn: "Branch Operations" },
    { MenuId: 2, Parent_Id: null, Menu_Name_EN: "Guest User Service", Menu_Name_AR: "خدمة المستخدم الضيف", Target_Url: "/branch-operations/guest", Icon_Class: "", order: 2, IsActive: true, ApplicationNameEn: "Branch Operations" },

    // Notification Center
    { MenuId: 3, Parent_Id: null, Menu_Name_EN: "Notification Templates", Menu_Name_AR: "قوالب الإشعارات", Target_Url: "/notification-center/templates", Icon_Class: "", order: 3, IsActive: true, ApplicationNameEn: "Notification Center" },
    { MenuId: 4, Parent_Id: null, Menu_Name_EN: "Custom Notification", Menu_Name_AR: "إشعار مخصص", Target_Url: "/notification-center/custom", Icon_Class: "", order: 4, IsActive: true, ApplicationNameEn: "Notification Center" },

    // Water Shutdown
    { MenuId: 5, Parent_Id: null, Menu_Name_EN: "Water Shutdown Notification List", Menu_Name_AR: "قائمة إشعارات إيقاف المياه", Target_Url: "/watershutdown/list", Icon_Class: "", order: 5, IsActive: true, ApplicationNameEn: "Water Shutdown" },
    { MenuId: 6, Parent_Id: null, Menu_Name_EN: "Water Shutdown Templates", Menu_Name_AR: "قوالب إيقاف المياه", Target_Url: "/watershutdown/templates", Icon_Class: "", order: 6, IsActive: true, ApplicationNameEn: "Water Shutdown" },

    // Wetland
    { MenuId: 7, Parent_Id: null, Menu_Name_EN: "Wetland Slot Creation", Menu_Name_AR: "إنشاء فتحة الأراضي الرطبة", Target_Url: "/wetland/slot-creation", Icon_Class: "", order: 7, IsActive: true, ApplicationNameEn: "Wetland" },
    { MenuId: 8, Parent_Id: null, Menu_Name_EN: "Holiday Calendar", Menu_Name_AR: "تقويم العطلات", Target_Url: "/wetland/holiday-calendar", Icon_Class: "", order: 8, IsActive: true, ApplicationNameEn: "Wetland" },

    // Appointment
    { MenuId: 9, Parent_Id: null, Menu_Name_EN: "Appointment Booking", Menu_Name_AR: "حجز موعد", Target_Url: "/appointment-booking/appointments", Icon_Class: "", order: 9, IsActive: true, ApplicationNameEn: "Appointment" },
]
export const menuService = {
    /**
     * Map old URLs to new route structure
     */
    mapUrlToNewRoute(oldUrl: string): string {
        const urlMap: Record<string, string> = {
            '/notificationtemplate': '/notification-center/templates',
            '/customnotification': '/notification-center/custom',
            '/watershutdown': '/watershutdown/list',
            '/wetland/slots': '/wetland/slot-creation',
            '/wetland/holidays': '/wetland/holiday-calendar',
            '/appointmentbooking': '/appointment-booking/appointments',
            '/branchoperations/validate': '/branch-operations/validate',
            '/branchoperations/guest': '/branch-operations/guest',
        }
        return urlMap[oldUrl] || oldUrl
    },

    transformMenuItems(items: any): MenuItem[] {
        let itemsArray: any[] = []

        if (Array.isArray(items)) {
            itemsArray = items
        } else if (items && typeof items === 'object') {
            // Support formats like { Data: [...] }, { Table: [...] }, { MenuData: [...] }
            itemsArray = items.Data || items.Table || items.MenuData || items.Table1 || []
            if (!Array.isArray(itemsArray)) itemsArray = []
        }

        if (itemsArray.length === 0) return []

        return itemsArray.map(item => {
            let appName = item.ApplicationNameEn || "General";
            const nameEn = item.Menu_Name_EN || item.MenuNameEn || "";

            if (nameEn.includes("Validate") || nameEn.includes("Guest")) {
                appName = "Branch Operations";
            }

            const targetUrl = item.Target_Url || item.MenuURL || ""
            const mappedUrl = this.mapUrlToNewRoute(targetUrl)

            return {
                ...item,
                Target_Url: mappedUrl,
                ApplicationNameEn: appName
            };
        })
    },

    /**
     * Get menu details for the logged-in user
     * Matches React app: dashActions.GetMenuDetails()
     */
    async getMenuDetails(): Promise<MenuItem[]> {
        try {
            const response = await apiClient.simplePost<any[]>('/Menu/GetMenuDetails')

            // If response is valid and has data, return it
            if (response && Array.isArray(response) && response.length > 0) {
                return this.transformMenuItems(response)
            }

            // Otherwise return default menu items
            console.log('Using default menu items as fallback (API returned empty or unparseable)')
            return DEFAULT_MENU_ITEMS
        } catch (error) {
            console.warn('Using default menu items due to API error:', error)
            return DEFAULT_MENU_ITEMS
        }
    },

    /**
     * Get default menu items synchronously (mapped for sidebar)
     */
    getMenuDetailsSync(): any[] {
        return DEFAULT_MENU_ITEMS.map(item => ({
            MenuID: item.MenuId,
            MenuNameEn: item.Menu_Name_EN,
            MenuNameAr: item.Menu_Name_AR,
            MenuURL: item.Target_Url,
            ApplicationNameEn: item.ApplicationNameEn || "General"
        }))
    },

    /**
     * Get menu data (specifically requested for Guest User Services)
     * Matches e-poral-paw: api/Menu/GetMenudata with FormData (lang, customerType, token)
     */
    async getMenuData(lang: string = "EN"): Promise<any[]> {
        try {
            const formData = new FormData()
            formData.append("lang", lang)
            formData.append("customerType", "IND")
            formData.append("token", "1221323324")

            const response = await apiClient.post<any>('/Menu/GetMenudata', formData)

            // Handle StatusCode 605 response structure (matching e-poral-paw)
            if (response?.StatusCode === 605 && Array.isArray(response.Data)) {
                return response.Data
            }

            // Fallback: try to extract data if response structure is different
            if (Array.isArray(response)) {
                return response
            }

            if (response?.Data && Array.isArray(response.Data)) {
                return response.Data
            }

            return []
        } catch (error) {
            console.warn('Error fetching menu data:', error)
            return []
        }
    },

    /**
     * Get announcement data
     * Matches React app: CommonService.getAPIResponse('Menu/GetAnnouncementData')
     */
    async getAnnouncements(): Promise<Announcement[]> {
        try {
            const response = await apiClient.simplePost<Announcement[]>('/Menu/GetAnnouncementData')
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
            const response = await apiClient.simplePost<CommonDetails>('/Common/GetCommonDetails')
            return response
        } catch (error) {
            console.error('Error fetching common details:', error)
            throw error
        }
    },

    /**
     * Get common data (specifically requested for Guest User Services)
     * Matches e-poral-paw: api/Menu/GetCommonData
     */
    async getCommonData(): Promise<any[]> {
        try {
            const response = await apiClient.simplePost<any[]>('/Menu/GetCommonData')
            return response || []
        } catch (error) {
            console.warn('Error fetching common data:', error)
            return []
        }
    }
}
