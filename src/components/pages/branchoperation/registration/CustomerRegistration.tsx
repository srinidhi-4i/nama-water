"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import PageHeader from "@/components/layout/PageHeader"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { branchOpsService } from "@/services/branchops.service"
import { menuService } from "@/services/menu.service"
import { RegistrationType } from "@/types/branchops.types"
import RegistrationTypeSelector from "./RegistrationTypeSelector"
import VerificationDetails from "./VerificationDetails"


type Step = "select-type" | "verification" | "success"

interface RegistrationData {
  // Common fields
  registrationType: RegistrationType
  
  // Individual fields
  nationalId?: string
  expiryDate?: string
  
  // Corporate fields
  organizationName?: string
  crNumber?: string
  crExpiryDate?: string
  emailId?: string
  gsmNumber?: string
  preferredLanguage?: string
  commercialActivity?: string
}

export default function CustomerRegistration() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useLanguage()

  const [currentStep, setCurrentStep] = useState<Step>("select-type")
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    registrationType: "Individual"
  })
  const [isLoading, setIsLoading] = useState(false)
  const [customerClasses, setCustomerClasses] = useState<any[]>([])
  const [masterLanguages, setMasterLanguages] = useState<any[]>([])
  const [commonData, setCommonData] = useState<any[]>([])

  // Pre-fill from search context if available
  useEffect(() => {
    const searchType = searchParams.get("type")
    const searchValue = searchParams.get("value")

    if (searchType && searchValue) {
      setRegistrationData(prev => ({
        ...prev,
        ...(searchType === "CIVIL_ID" && { nationalId: searchValue }),
        ...(searchType === "GSM_NUMBER" && { gsmNumber: searchValue }),
        ...(searchType === "CR_NUMBER" && { crNumber: searchValue })
      }))
    }
  }, [searchParams])

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [classes, languages, common] = await Promise.all([
          branchOpsService.getCustomerClass(),
          branchOpsService.getMasterLanguage(),
          menuService.getCommonData()
        ])

        setCustomerClasses(classes)
        setMasterLanguages(languages)
        setCommonData(common)
      } catch (error) {
        console.log("Optional dropdown data not available - using defaults")
        // Silently continue - components have fallback values
      }
    }

    fetchDropdownData()
  }, [])

  const handleTypeSelect = (type: RegistrationType) => {
    setRegistrationData(prev => ({ ...prev, registrationType: type }))
  }

  const handleTypeContinue = () => {
    setCurrentStep("verification")
  }

  const handleVerificationSubmit = async (data: Partial<RegistrationData>) => {
    setIsLoading(true)

    try {
      const fullData = { ...registrationData, ...data }
      
      let result
      if (fullData.registrationType === "Individual") {
        // Step 1: Validate National ID
        if (!fullData.nationalId || !fullData.expiryDate) {
          toast.error("National ID and Expiry Date are required")
          setIsLoading(false)
          return
        }

        const validateResult = await branchOpsService.validateNationalID(fullData.nationalId)
        
        if (!validateResult.success) {
          toast.error(validateResult.message || "National ID validation failed")
          setIsLoading(false)
          return
        }

        // Step 2: Get ROP GSM Number
        const ropResult = await branchOpsService.getROPGSMNumber(
          fullData.nationalId,
          fullData.expiryDate
        )

        if (!ropResult.success) {
          toast.error(
            ropResult.message || 
            "The GSM number provided is not found in ROP data. Kindly update your GSM number with ROP to proceed the registration process in Nama water services portal."
          )
          setIsLoading(false)
          return
        }

        // Step 3: Submit registration with ROP data
        result = await branchOpsService.submitIndividualRegistration({
          NationalId: fullData.nationalId,
          ExpiryDate: fullData.expiryDate,
          EmailId: fullData.emailId || "",
          MobileNumber: ropResult.data?.GSMNumber || fullData.gsmNumber || "",
          PreferredLanguage: fullData.preferredLanguage || "EN",
          FullNameEn: ropResult.data?.FullNameEn || "",
          FullNameAr: ropResult.data?.FullNameAr || ""
        })
      } else {
        // Corporate registration
        result = await branchOpsService.submitCorporateRegistration({
          OrganizationName: fullData.organizationName,
          CRNumber: fullData.crNumber,
          CRExpiryDate: fullData.crExpiryDate,
          EmailId: fullData.emailId,
          GSMNumber: fullData.gsmNumber,
          PreferredLanguage: fullData.preferredLanguage,
          CommercialActivity: fullData.commercialActivity
        })
      }

      if (result.success) {
        toast.success("Registration successful!")
        setCurrentStep("success")
        
        // Redirect after success
        setTimeout(() => {
          router.push("/branch-operations/validate")
        }, 2000)
      } else {
        toast.error(result.message || "Registration failed")
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevious = () => {
    if (currentStep === "verification") {
      setCurrentStep("select-type")
    }
  }

  return (
    <div className="flex-1 bg-gray-100 overflow-x-hidden">
      <PageHeader
        language={language}
        titleEn="Register Customer"
        titleAr="تسجيل العميل"
        breadcrumbEn="Register Customer"
        breadcrumbAr="تسجيل العميل"
      />

      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-900" />
            </div>
          )}

          {!isLoading && currentStep === "select-type" && (
            <RegistrationTypeSelector
              language={language}
              onSelect={handleTypeSelect}
              onContinue={handleTypeContinue}
              selectedType={registrationData.registrationType}
            />
          )}

          {!isLoading && currentStep === "verification" && (
            <VerificationDetails
              language={language}
              registrationType={registrationData.registrationType}
              initialData={registrationData}
              masterLanguages={masterLanguages}
              onSubmit={handleVerificationSubmit}
              onPrevious={handlePrevious}
            />
          )}

          {!isLoading && currentStep === "success" && (
            <div className="bg-white rounded-lg shadow-md border p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-4xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-teal-900 mb-2">
                {language === "EN" ? "Registration Successful!" : "تم التسجيل بنجاح!"}
              </h2>
              <p className="text-gray-600">
                {language === "EN" 
                  ? "Redirecting to validation page..."
                  : "إعادة التوجيه إلى صفحة التحقق..."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
