import { apiClient } from '@/lib/api-client'
import { MenuItem, Announcement, CommonDetails } from '@/types'

export const menuService = {
    /**
     * Get menu details for the logged-in user
     * Matches React app: dashActions.GetMenuDetails()
     */
    async getMenuDetails(): Promise<MenuItem[]> {
        try {
            const response = await apiClient.simplePost<MenuItem[]>('Menu/GetMenuDetails')
            return response || []
        } catch (error) {
            console.error('Error fetching menu details:', error)
            // Return empty array instead of throwing to prevent page crash
            return []
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
            console.error('Error fetching announcements:', error)
            throw error
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
