"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Calendar, ChevronLeft } from "lucide-react"
import { format } from "date-fns"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import { branchOpsService } from "@/services/branchops.service"
import { useLanguage } from "@/components/providers/LanguageProvider"
import Link from "next/link"
import PageHeader from "@/components/layout/PageHeader"
import { ValidationType, AccountPaymentDetails, DEFAULT_VALIDATION_TYPES } from "@/types/branchops.types"
import { AccountPaymentResult } from "@/components/branchoperations/AccountPaymentResult"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search, AlertCircle, LogOut } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ValidateCustomerPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [validationTypes, setValidationTypes] = useState<ValidationType[]>([])
  const [selectedType, setSelectedType] = useState<string>("")
  const [inputValue, setInputValue] = useState<string>("")
  const [accountNumber, setAccountNumber] = useState<string>("")
  const [requestNumber, setRequestNumber] = useState<string>("")
  const [civilId, setCivilId] = useState<string>("")
  const [expiryDate, setExpiryDate] = useState<Date>()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("validate")
  const [profileData, setProfileData] = useState<any>(null)
  const [commonData, setCommonData] = useState<any>(null)
  const [paymentResult, setPaymentResult] = useState<AccountPaymentDetails | null>(null)
  const [showSessionExpired, setShowSessionExpired] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadValidationTypes()
  }, [])

  const loadValidationTypes = async () => {
    try {
      const types = await branchOpsService.getValidationTypes()
      setValidationTypes(types)
    } catch (err: any) {
        console.error("Failed to load validation types", err)
        if (err?.response?.status === 401 || err?.response?.status === 403) {
            setShowSessionExpired(true)
        } else {
            setValidationTypes(DEFAULT_VALIDATION_TYPES)
        }
    }
  }

  const handleValidationTypeChange = (value: string) => {
    setSelectedType(value)
    // Reset all input fields
    setInputValue("")
    setAccountNumber("")
    setRequestNumber("")
    setCivilId("")
    setProfileData(null)
    setActiveTab("validate")
    setExpiryDate(undefined)
    setError(null)

    // Removed the redirect to /PayBillBranch that was causing 404
  }

  const handleSearch = async () => {
    setIsLoading(true)

    try {
      switch (selectedType) {
        case "ACCOUNT_SEARCH":
          await handleAccountSearch()
          break
        case "ACCOUNT_PAYMENT":
          await handleAccountPayment()
          break
        case "CIVIL_ID":
        case "GSM_NUMBER":
        case "CR_NUMBER":
          await handleUserValidation()
          break
        case "REQUEST_NUMBER_SEARCH":
          await handleRequestNumberSearch()
          break
        case "RETRIEVE_OTP_LOG":
          await handleOTPLogRetrieval()
          break
        case "VALIDATE_CUSTOMER_DETAILS_ROP":
          await handleROPValidation()
          break
        default:
          toast.error("Please select a validation type")
      }
    } catch (error: any) {
      console.error("Search error:", error)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
          setShowSessionExpired(true)
      } else {
          toast.error(error.message || "An error occurred")
          setError(error.message || "An error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccountSearch = async () => {
    if (!accountNumber.trim()) {
      toast.error("Please enter account number")
      return
    }

    if (!/^[A-Za-z0-9 ]+$/.test(accountNumber)) {
      toast.error("Invalid account number format")
      return
    }

    const serviceType = await branchOpsService.getServiceType(accountNumber.trim())
    
    if (!serviceType) {
      toast.error("Invalid account number")
      return
    }

    const customerInfo = await branchOpsService.getCustomerInfo(
      accountNumber.trim(),
      false
    )

    // Prepare result data for dashboard
    const result = {
        ...customerInfo,
        AccountNumber: accountNumber.trim(),
        ServiceType: serviceType?.ServiceType,
        CCBAccountNumber: serviceType?.CCBAccountNumber
    }

    // Reference app redirects even if getCustomerInfo fails (e.g. 606 error)
    // We strictly match this behavior to ensure flow parity
    // Store result in session storage for the dashboard to pick up
    sessionStorage.setItem("branchAccountData", JSON.stringify(result))
    // Redirect to Account Dashboard
    router.push("/branch-operations/account-dashboard")
  }

  const handleAccountPayment = async () => {
      const val = inputValue.trim() || accountNumber.trim()
      if (!val) {
          toast.error("Please enter account number")
          return
      }

      const result = await branchOpsService.getAccountPaymentDetails(val)
      if (result) {
          setPaymentResult(result)
      } else {
          toast.error("Account not found or invalid account number")
      }
  }

  const handleUserValidation = async () => {
    if (!inputValue.trim()) {
      toast.error("Please enter a value")
      return
    }

    // Validate GSM number format
    if (selectedType === "GSM_NUMBER") {
      if (!/^[79][0-9]{7}$/.test(inputValue)) {
        toast.error("Invalid mobile number. Must start with 7 or 9 and be 8 digits")
        return
      }
    }

    const result = await branchOpsService.validateUser(selectedType, inputValue)

    if (!result.success) {
      toast.error(result.message || "User not found")
      return
    }

    toast.success("User validated successfully!")
    setProfileData({
      type: "USER",
      data: result.data
    })
    setActiveTab("profile")
  }

  const handleRequestNumberSearch = async () => {
    if (!requestNumber.trim()) {
      toast.error("Please enter request number")
      return
    }

    const result = await branchOpsService.getAQUrl(requestNumber)

    if (!result) {
      toast.error("Invalid request number")
      return
    }

    window.open(`${result.url}&auth=${result.token}`, '_blank')
  }

  const handleOTPLogRetrieval = async () => {
    if (!inputValue.trim()) {
      toast.error("Please enter mobile number")
      return
    }

    if (!/^(968)?[79][0-9]{7}$/.test(inputValue)) {
      toast.error("Invalid mobile number")
      return
    }

    router.push(`/branch-operations/otp-log?mobile=${inputValue}`)
  }

  const handleROPValidation = async () => {
    if (!civilId.trim()) {
      toast.error("Please enter Civil ID")
      return
    }

    if (!expiryDate) {
      toast.error("Please select expiry date")
      return
    }

    const formattedDate = format(expiryDate, "yyyy-MM-dd")
    const result = await branchOpsService.getROPUserDetails(civilId, formattedDate)

    if (!result.success) {
      toast.error(result.message || "ROP user details not found")
      return
    }

    toast.success("Details retrieved successfully")
    setProfileData({
      type: "ROP",
      data: result.data
    })
    setActiveTab("profile")
  }

  const renderInputField = () => {
    switch (selectedType) {
      case "ACCOUNT_SEARCH":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountNumber">Account Number Search</Label>
              <Input
                id="accountNumber"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Please enter account number"
                className="mt-2"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
              className="bg-teal-900 hover:bg-teal-800"
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        )

      case "CIVIL_ID":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="civilId">Civil ID</Label>
              <Input
                id="civilId"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Please enter Civil Id"
                className="mt-2"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
              className="bg-teal-900 hover:bg-teal-800"
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        )

      case "GSM_NUMBER":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="gsmNumber">GSM Number</Label>
              <Input
                id="gsmNumber"
                type="text"
                value={inputValue}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "" || /^[79][0-9]{0,7}$/.test(value)) {
                    setInputValue(value)
                  }
                }}
                placeholder="Please enter GSM number"
                maxLength={8}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">Must start with 7 or 9 (8 digits)</p>
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
              className="bg-teal-900 hover:bg-teal-800"
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        )

      case "CR_NUMBER":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="crNumber">CR Number</Label>
              <Input
                id="crNumber"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Please enter CR number"
                className="mt-2"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
              className="bg-teal-900 hover:bg-teal-800"
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        )

      case "REQUEST_NUMBER_SEARCH":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="requestNumber">Request Number Search</Label>
              <Input
                id="requestNumber"
                type="text"
                value={requestNumber}
                onChange={(e) => setRequestNumber(e.target.value)}
                placeholder="Enter your request number"
                className="mt-2"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
              className="bg-teal-900 hover:bg-teal-800"
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        )

      case "RETRIEVE_OTP_LOG":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="otpMobile">GSM Number</Label>
              <Input
                id="otpMobile"
                type="text"
                value={inputValue}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "" || /^[0-9]*$/.test(value)) {
                    setInputValue(value)
                  }
                }}
                placeholder="Please enter GSM number"
                maxLength={11}
                className="mt-2"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
              className="bg-teal-900 hover:bg-teal-800"
            >
              {isLoading ? "Retrieving..." : "Search"}
            </Button>
          </div>
        )

      case "VALIDATE_CUSTOMER_DETAILS_ROP":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  id="ropCivilId"
                  type="text"
                  value={civilId}
                  onChange={(e) => setCivilId(e.target.value)}
                  placeholder="Enter Civil ID/National ID"
                />
              </div>
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expiryDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {expiryDate ? format(expiryDate, "dd/MM/yyyy") : "Expiry Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={expiryDate}
                      onSelect={setExpiryDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
              className="bg-[#1F4E58] hover:bg-[#16373e]"
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        )

      case "ACCOUNT_PAYMENT":
        return (
            <div className="space-y-4">
                <div>
                <Label htmlFor="accPayment">{language === "EN" ? "Account ID / Consumer Number" : "رقم الحساب / المشترك"}</Label>
                <Input
                    id="accPayment"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={language === "EN" ? "Please Enter Your Account ID / Consumer Number" : "الرجاء إدخال رقم الحساب"}
                    className="mt-2 h-11"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                </div>
                <Button 
                    onClick={handleSearch} 
                    disabled={isLoading}
                    className="bg-[#006A72] hover:bg-[#005a61] h-11 px-8"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "EN" ? "Submit" : "إرسال")}
                </Button>
            </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-[calc(100vh-200px)] relative">
     <PageHeader
        language={language}
        titleEn="Validate/Search a customer"
        titleAr="التحقق من صحة / البحث عن عميل"
        breadcrumbEn="Validate/Search a customer"
        breadcrumbAr="التحقق من صحة / البحث عن عميل"
      />
     
      {paymentResult ? (
          <div className="px-6 py-6 animate-in fade-in zoom-in-95 duration-300">
             <AccountPaymentResult 
                data={paymentResult} 
                onBack={() => setPaymentResult(null)} 
             />
          </div>
      ) : (
      <>
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-6">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="validate">{language === "EN" ? "Validate" : "التحقق"}</TabsTrigger>
          <TabsTrigger value="profile" disabled={!profileData}>{language === "EN" ? "Profile Data" : "بيانات الملف الشخصي"}</TabsTrigger>
        </TabsList>

        <TabsContent value="validate" className="space-y-6">
          {/* Main Validation Card */}
          <div className="bg-white rounded-lg shadow-md border p-6 space-y-6">
            <div>
              <Label htmlFor="validateType">{language === "EN" ? "Validate Type" : "نوع التحقق"}</Label>
              <Select value={selectedType} onValueChange={handleValidationTypeChange}>
                <SelectTrigger id="validateType" className="mt-2">
                  <SelectValue placeholder={language === "EN" ? "Select Validate Type" : "اختر نوع التحقق"} />
                </SelectTrigger>
                <SelectContent>
                  {validationTypes.map((type) => (
                    <SelectItem 
                      key={type.ValidateTypeCode} 
                      value={type.ValidateTypeCode}
                    >
                      {type.ValidateTypeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedType && (
              <div className="pt-4 border-t">
                {renderInputField()}
              </div>
            )}
          </div>
        </TabsContent>

         <TabsContent value="profile" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {!profileData ? (
               <p className="text-gray-500 text-center py-8">
               {language === "EN" ? "Profile data will be displayed here after validation" : "سيتم عرض بيانات الملف الشخصي هنا بعد التحقق"}
             </p>
            ) : (
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-teal-900 mb-2">
                    {language === "EN" ? "Customer Details" : "تفاصيل العميل"}
                  </h3>
                </div>

                {profileData.type === "ROP" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                      <Label className="text-gray-500">Full Name (Arabic)</Label>
                      <p className="font-medium text-lg text-right">{profileData.data.FullNameAr || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Full Name (English)</Label>
                      <p className="font-medium text-lg">{profileData.data.FullNameEn || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Civil ID</Label>
                      <p className="font-medium">{profileData.data.NationalIDOrCivilID || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Expiry Date</Label>
                      <p className="font-medium">{profileData.data.ExpiryDate || "-"}</p>
                    </div>
                     <div>
                      <Label className="text-gray-500">GSM Number</Label>
                      <p className="font-medium">{profileData.data.GsmNumber || "-"}</p>
                    </div>
                  </div>
                )}

                {profileData.type === "ACCOUNT" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-500">Account Number</Label>
                      <p className="font-medium text-lg">{profileData.data.accountNumber}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Service Type</Label>
                      <p className="font-medium">{profileData.data.serviceType?.ServiceType || "-"}</p>
                    </div>
                     <div>
                      <Label className="text-gray-500">Customer Name (En)</Label>
                      <p className="font-medium">{profileData.data.customerInfo?.CustomerNameEn || profileData.data.customerInfo?.FullNameEn || "-"}</p>
                    </div>
                     <div>
                      <Label className="text-gray-500">Customer Name (Ar)</Label>
                      <p className="font-medium text-right">{profileData.data.customerInfo?.CustomerNameAr || profileData.data.customerInfo?.FullNameAr || "-"}</p>
                    </div>
                  </div>
                )}

                {profileData.type === "USER" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                      <Label className="text-gray-500">User ID</Label>
                      <p className="font-medium">{profileData.data.UserID || "-"}</p>
                    </div>
                     <div>
                      <Label className="text-gray-500">Civil ID</Label>
                      <p className="font-medium">{profileData.data.CivilID || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Full Name (En)</Label>
                      <p className="font-medium">{profileData.data.FullNameEn || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Full Name (Ar)</Label>
                      <p className="font-medium text-right">{profileData.data.FullNameAr || "-"}</p>
                    </div>
                     <div>
                      <Label className="text-gray-500">Mobile Number</Label>
                      <p className="font-medium">{profileData.data.MobileNumber || "-"}</p>
                    </div>
                     <div>
                      <Label className="text-gray-500">Email ID</Label>
                      <p className="font-medium">{profileData.data.EmailID || "-"}</p>
                    </div>
                  </div>
                )}
                 
                 <div className="pt-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setProfileData(null)
                        setActiveTab("validate")
                      }}
                    >
                      {language === "EN" ? "Clear & New Search" : "مسح وبحث جديد"}
                    </Button>
                 </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      </>
      )}

      {/* Session Expired Alert Dialog */}
      <AlertDialog open={showSessionExpired} onOpenChange={setShowSessionExpired}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                      <LogOut className="h-5 w-5" />
                      {language === "EN" ? "Session Expired" : "انتهت الجلسة"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                      {language === "EN" 
                          ? "Your session has expired. Please login again to continue."
                          : "انتهت جلسة العمل الخاصة بك. يرجى تسجيل الدخول مرة أخرى للمتابعة."}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogAction 
                      onClick={() => router.push('/login')}
                      className="bg-[#006A72] hover:bg-[#005a61]"
                  >
                      {language === "EN" ? "Login Now" : "تسجيل الدخول"}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
