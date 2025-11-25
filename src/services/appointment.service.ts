import { apiClient } from '@/lib/api-client'
import { AppointmentMasterData, AppointmentBooking } from '@/types'

export const appointmentService = {
    /**
     * Get appointment master data including categories
     * Matches React app: CommonService.getAPIResponse('AppointmentReqest/GetMasterData')
     */
    async getMasterData(): Promise<AppointmentMasterData> {
        try {
            const response = await apiClient.simplePost<AppointmentMasterData>('AppointmentReqest/GetMasterData')
            return response
        } catch (error) {
            console.error('Error fetching appointment master data:', error)
            throw error
        }
    },

    /**
     * Create a new appointment
     */
    async createAppointment(data: AppointmentBooking): Promise<any> {
        try {
            const response = await apiClient.post('AppointmentReqest/Create', data)
            return response
        } catch (error) {
            console.error('Error creating appointment:', error)
            throw error
        }
    },

    /**
     * Get appointment history
     */
    async getAppointmentHistory(identifier: string): Promise<any> {
        try {
            const response = await apiClient.post('AppointmentReqest/GetHistory', { identifier })
            return response
        } catch (error) {
            console.error('Error fetching appointment history:', error)
            throw error
        }
    },
}
