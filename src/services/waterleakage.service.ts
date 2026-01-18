// Water Leakage Report APIs
import { api } from '@/lib/axios'
import { encryptString } from '@/lib/crypto'

export const waterLeakageService = {
    // Generate OTP for guest user
    generateOTP: async (phoneNumber: string): Promise<any> => {
        const formData = new FormData()
        formData.append('EmailORMobile', encodeURIComponent(encryptString(`968${phoneNumber}`)))
        formData.append('PrefLang', 'en')
        formData.append('type', 'WaterL')

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

    // Get Governorates
    getGovernorates: async (): Promise<any> => {
        const formData = new FormData()
        const response = await api.post('/api/WaterLeakageInternal/GetGovernorate', formData)
        return response.data
    },

    // Get Villayats for a governorate
    getVillayats: async (governorateCode: string): Promise<any> => {
        const formData = new FormData()
        formData.append('Code', governorateCode)
        const response = await api.post('/api/WaterLeakageInternal/GetVillayat', formData)
        return response.data
    },

    // Get Towns for a villayat
    getTowns: async (villayatCode: string): Promise<any> => {
        const formData = new FormData()
        formData.append('Code', villayatCode)
        const response = await api.post('/api/WaterLeakageInternal/GetTown', formData)
        return response.data
    },

    // Submit Water Leakage Report
    submitWaterLeakage: async (data: {
        personName: string
        phoneNumber: string
        email: string
        governorate: string
        governorateId: string
        villayat: string
        villayatId: string
        town: string
        townId: string
        wayNo: string
        buildingNo: string
        leakageDetails: string
        latitude: number
        longitude: number
        files: File[]
    }): Promise<any> => {
        const formData = new FormData()

        // Add encrypted contact details
        formData.append('PersonName', encodeURIComponent(encryptString(data.personName)))
        formData.append('MobileNumber', encodeURIComponent(encryptString(`968${data.phoneNumber}`)))
        formData.append('Email', encodeURIComponent(encryptString(data.email || '')))

        // Add location details
        formData.append('Governorate', data.governorate)
        formData.append('Villayat', data.villayat)
        formData.append('GovernorateID', data.governorateId)
        formData.append('VillayathID', data.villayatId)
        formData.append('TownID', data.townId || '')
        formData.append('Town', data.town)

        // Add premise details
        formData.append('WayNo', data.wayNo)
        formData.append('BuildingNo', data.buildingNo)
        formData.append('LeakageDetails', data.leakageDetails)

        // Add coordinates
        formData.append('Latitude', data.latitude.toString())
        formData.append('Longitude', data.longitude.toString())

        // Add configuration
        formData.append('PrefLang', 'EN')
        formData.append('ProjectSystemCode', '2')

        // Add files
        data.files.forEach((file, index) => {
            formData.append('UploadImages', file)
            formData.append(`ImageName_${index}`, file.name)
        })

        const response = await api.post('/api/WaterLeakageInternal/SubmitWaterLeakageDetails', formData)
        return response.data
    }
}
