// Company Vehicles Service - API methods for vehicle complaint submission
import { api } from '@/lib/axios'
import { encryptString } from '@/lib/crypto'
import { ApiResponse, ViolationType } from '@/types/guestservices.types'

export const companyVehicleService = {
    // Get violation types
    getViolationTypes: async (): Promise<ViolationType[]> => {
        try {
            const formData = new FormData()
            const response = await api.post<ApiResponse<ViolationType[]>>('/api/CompanyVehiclesWeb/GetViolationTypes', formData)
            return response.data.Data || []
        } catch (error) {
            console.error('Failed to fetch violation types:', error)
            return []
        }
    },

    // Generate OTP for guest user
    generateOTP: async (phoneNumber: string): Promise<any> => {
        const formData = new FormData()
        formData.append('EmailORMobile', encodeURIComponent(encryptString(`968${phoneNumber}`)))
        formData.append('PrefLang', 'en')
        formData.append('type', 'Vehicle')

        const response = await api.post('/api/CustomerRegistrationWeb/GenerateOTP', formData)
        return response.data
    },

    // Validate OTP
    validateOTP: async (phoneNumber: string, otp: string): Promise<any> => {
        const formData = new FormData()
        formData.append('EmailORMobile', encodeURIComponent(encryptString(`968${phoneNumber}`)))
        formData.append('OTP', otp)
        formData.append('language', 'en')

        const response = await api.post('/api/CustomerRegistrationWeb/OTPValidation', formData)
        return response.data
    },

    // Submit company vehicle complaint
    submitCompanyVehicle: async (data: {
        personName: string
        phoneNumber: string
        email: string
        violationType: string
        carModel: string
        carPlateNumber: string
        carCode: string
        incidentDateTime: string
        caseDetails: string
        latitude: number
        longitude: number
        wayNo?: string
        buildingNo?: string
        files: File[]
    }): Promise<any> => {
        const formData = new FormData()

        // Add encrypted contact details
        formData.append('PersonName', encodeURIComponent(encryptString(data.personName)))
        formData.append('MobileNumber', encodeURIComponent(encryptString(`968${data.phoneNumber}`)))
        formData.append('Email', encodeURIComponent(encryptString(data.email || '')))

        // Add vehicle details
        formData.append('ViolationType', data.violationType)
        formData.append('CarModel', data.carModel)
        formData.append('CarPlateNumber', data.carPlateNumber)
        formData.append('CarCode', data.carCode)
        formData.append('IncidentDateTime', data.incidentDateTime)
        formData.append('CaseDetails', data.caseDetails)

        // Add location details
        formData.append('Latitude', data.latitude.toString())
        formData.append('Longitude', data.longitude.toString())
        formData.append('WayNo', data.wayNo || '')
        formData.append('BuildingNo', data.buildingNo || '')

        // Add configuration
        formData.append('PrefLang', 'EN')
        formData.append('ProjectSystemCode', '2')

        // Add files
        data.files.forEach((file, index) => {
            formData.append('UploadImages', file)
            formData.append(`ImageName_${index}`, file.name)
        })

        const response = await api.post('/api/CompanyVehiclesInternal/SubmitCompanyVehicleDetails', formData)
        return response.data
    }
}
