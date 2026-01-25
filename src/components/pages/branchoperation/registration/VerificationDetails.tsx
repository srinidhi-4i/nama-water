import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { RegistrationType } from "@/types/branchops.types"

interface VerificationDetailsProps {
  language: string
  registrationType: RegistrationType
  initialData: any
  masterLanguages: any[]
  onSubmit: (data: any) => void
  onPrevious: () => void
}

export default function VerificationDetails({
  language,
  registrationType,
  initialData,
  masterLanguages,
  onSubmit,
  onPrevious
}: VerificationDetailsProps) {
  // Individual fields
  const [nationalId, setNationalId] = useState(initialData.nationalId || "")
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(
    initialData.expiryDate ? new Date(initialData.expiryDate) : undefined
  )

  // Corporate fields
  const [organizationName, setOrganizationName] = useState(initialData.organizationName || "")
  const [crNumber, setCrNumber] = useState(initialData.crNumber || "")
  const [crExpiryDate, setCrExpiryDate] = useState<Date | undefined>(
    initialData.crExpiryDate ? new Date(initialData.crExpiryDate) : undefined
  )
  const [emailId, setEmailId] = useState(initialData.emailId || "")
  const [gsmNumber, setGsmNumber] = useState(initialData.gsmNumber || "")
  const [preferredLanguage, setPreferredLanguage] = useState(initialData.preferredLanguage || "EN")
  const [commercialActivity, setCommercialActivity] = useState(initialData.commercialActivity || "")

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (registrationType === "Individual") {
      if (!nationalId.trim()) {
        newErrors.nationalId = "National ID is required"
      }
      if (!expiryDate) {
        newErrors.expiryDate = "Expiry date is required"
      }
    } else {
      if (!organizationName.trim()) {
        newErrors.organizationName = "Organization name is required"
      }
      if (!crNumber.trim()) {
        newErrors.crNumber = "CR Number is required"
      }
      if (!crExpiryDate) {
        newErrors.crExpiryDate = "CR Expiry date is required"
      }
      if (!emailId.trim()) {
        newErrors.emailId = "Email is required"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId)) {
        newErrors.emailId = "Invalid email format"
      }
      if (!gsmNumber.trim()) {
        newErrors.gsmNumber = "GSM Number is required"
      } else if (!/^[79][0-9]{7}$/.test(gsmNumber)) {
        newErrors.gsmNumber = "GSM must start with 7 or 9 and be 8 digits"
      }
      if (!preferredLanguage) {
        newErrors.preferredLanguage = "Preferred language is required"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    const data = registrationType === "Individual"
      ? {
          nationalId,
          expiryDate: expiryDate ? format(expiryDate, "yyyy-MM-dd") : ""
        }
      : {
          organizationName,
          crNumber,
          crExpiryDate: crExpiryDate ? format(crExpiryDate, "yyyy-MM-dd") : "",
          emailId,
          gsmNumber: gsmNumber.startsWith("968") ? gsmNumber : `968${gsmNumber}`,
          preferredLanguage,
          commercialActivity
        }

    onSubmit(data)
  }

  return (
    <div className="bg-white rounded-lg shadow-md border overflow-hidden min-h-[600px]">
      <div className="flex flex-col lg:flex-row">
        {/* Left Section */}
        <div className="lg:w-2/5 bg-gray-50 p-6 sm:p-8 lg:p-12 flex flex-col items-center justify-center border-b lg:border-r lg:border-b-0">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-teal-50 border-4 border-teal-100 flex items-center justify-center mb-6">
            <svg
              className="h-12 w-12 sm:h-14 sm:w-14 text-teal-800"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-teal-900 mb-2 text-center">
            {language === "EN" ? "LET'S GET" : "لنبدأ"}
          </h2>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-teal-900 mb-4 text-center">
            {language === "EN" ? "STARTED" : "التسجيل"}
          </h2>
          <p className="text-sm text-gray-600 text-center max-w-xs">
            {language === "EN"
              ? "Fill out the registration and start your journey with us"
              : "املأ نموذج التسجيل وابدأ رحلتك معنا"}
          </p>
        </div>

        {/* Right Section - Form */}
        <div className="lg:w-3/5 p-6 sm:p-8 lg:p-12">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-8 pb-3 border-b">
            {language === "EN" ? "Verification Details" : "تفاصيل التحقق"}
          </h3>

          <div className="space-y-6">
            {registrationType === "Individual" ? (
              <>
                {/* National ID */}
                <div>
                  <Label htmlFor="nationalId" className="text-gray-700 text-sm font-medium">
                    {language === "EN" ? "National ID" : "الرقم الوطني"}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="nationalId"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder={language === "EN" ? "Enter National ID" : "أدخل الرقم الوطني"}
                    className={`mt-2 h-11 ${errors.nationalId ? "border-red-500" : ""}`}
                  />
                  {errors.nationalId && (
                    <p className="text-red-500 text-xs mt-1">{errors.nationalId}</p>
                  )}
                </div>

                {/* Expiry Date */}
                <div>
                  <Label className="text-gray-700 text-sm font-medium">
                    {language === "EN" ? "Expiry Date" : "تاريخ الانتهاء"}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-2 h-11",
                          !expiryDate && "text-muted-foreground",
                          errors.expiryDate && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expiryDate ? format(expiryDate, "dd/MM/yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={expiryDate}
                        onSelect={setExpiryDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.expiryDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Organization Name */}
                <div>
                  <Label htmlFor="organizationName" className="text-gray-700 text-sm font-medium">
                    {language === "EN" ? "Organization Name" : "اسم المنظمة"}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="organizationName"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder={language === "EN" ? "Enter organization name" : "أدخل اسم المنظمة"}
                    className={`mt-2 h-11 ${errors.organizationName ? "border-red-500" : ""}`}
                  />
                  {errors.organizationName && (
                    <p className="text-red-500 text-xs mt-1">{errors.organizationName}</p>
                  )}
                </div>

                {/* CR Number and Expiry Date Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="crNumber" className="text-gray-700 text-sm font-medium">
                      {language === "EN" ? "CR Number" : "رقم السجل التجاري"}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="crNumber"
                      value={crNumber}
                      onChange={(e) => setCrNumber(e.target.value)}
                      placeholder={language === "EN" ? "Enter CR Number" : "أدخل رقم السجل"}
                      className={`mt-2 h-11 ${errors.crNumber ? "border-red-500" : ""}`}
                    />
                    {errors.crNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.crNumber}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-gray-700 text-sm font-medium">
                      {language === "EN" ? "CR Expiry Date" : "تاريخ انتهاء السجل"}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-2 h-11",
                            !crExpiryDate && "text-muted-foreground",
                            errors.crExpiryDate && "border-red-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {crExpiryDate ? format(crExpiryDate, "dd/MM/yyyy") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={crExpiryDate}
                          onSelect={setCrExpiryDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.crExpiryDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.crExpiryDate}</p>
                    )}
                  </div>
                </div>

                {/* Email and GSM Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emailId" className="text-gray-700 text-sm font-medium">
                      {language === "EN" ? "Email ID" : "البريد الإلكتروني"}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="emailId"
                      type="email"
                      value={emailId}
                      onChange={(e) => setEmailId(e.target.value)}
                      placeholder={language === "EN" ? "Enter email Id" : "أدخل البريد"}
                      className={`mt-2 h-11 ${errors.emailId ? "border-red-500" : ""}`}
                    />
                    {errors.emailId && (
                      <p className="text-red-500 text-xs mt-1">{errors.emailId}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gsmNumber" className="text-gray-700 text-sm font-medium">
                      {language === "EN" ? "GSM Number" : "رقم الجوال"}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex items-center bg-gray-100 border rounded-md px-3 h-10 text-sm text-gray-600">
                        +968
                      </div>
                      <Input
                        id="gsmNumber"
                        value={gsmNumber}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === "" || /^[79][0-9]{0,7}$/.test(value)) {
                            setGsmNumber(value)
                          }
                        }}
                        placeholder={language === "EN" ? "GSM Number starts with 7 or 9" : "يبدأ بـ 7 أو 9"}
                        maxLength={8}
                        className={`h-11 ${errors.gsmNumber ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.gsmNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.gsmNumber}</p>
                    )}
                  </div>
                </div>

                {/* Preferred Language */}
                <div>
                  <Label className="text-gray-700 text-sm font-medium">
                    {language === "EN" ? "Preferred Language" : "اللغة المفضلة"}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                    <SelectTrigger className={`mt-2 h-11 ${errors.preferredLanguage ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterLanguages.length > 0 ? (
                        masterLanguages.map((lang) => (
                          <SelectItem key={lang.Key || lang.Value} value={lang.Key || lang.Value}>
                            {lang.Description || lang.Value}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem key="EN" value="EN">English</SelectItem>
                          <SelectItem key="AR" value="AR">Arabic</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.preferredLanguage && (
                    <p className="text-red-500 text-xs mt-1">{errors.preferredLanguage}</p>
                  )}
                </div>

                {/* Commercial Activity */}
                <div>
                  <Label htmlFor="commercialActivity" className="text-gray-700 text-sm font-medium">
                    {language === "EN" ? "Commercial Activity" : "النشاط التجاري"}
                  </Label>
                  <Input
                    id="commercialActivity"
                    value={commercialActivity}
                    onChange={(e) => setCommercialActivity(e.target.value)}
                    placeholder={language === "EN" ? "Commercial Activity" : "النشاط التجاري"}
                    className="mt-2 h-11"
                  />
                </div>
              </>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button
              variant="outline"
              onClick={onPrevious}
              className="border-teal-900 text-teal-900 hover:bg-teal-50 h-12 px-8 order-2 sm:order-1"
            >
              <span className="mr-2">‹</span>
              {language === "EN" ? "Previous" : "السابق"}
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-teal-900 hover:bg-teal-800 h-12 px-8 order-1 sm:order-2"
            >
              {language === "EN" ? "Continue" : "متابعة"}
              <span className="ml-2">›</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
