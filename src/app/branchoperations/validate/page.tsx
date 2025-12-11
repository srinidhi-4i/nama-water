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

import { Header } from "@/components/layout/Header"
import { LogoSection } from "@/components/layout/LogoSection"
import { Sidebar } from "@/components/layout/Sidebar"
import { Footer } from "@/components/layout/Footer"

import { branchOpsService } from "@/services/branchops.service"
import { authService } from "@/services/auth.service"
import { menuService } from "@/services/menu.service"
import { ValidationType } from "@/types/branchops.types"
import { MenuItem } from "@/types/menu"

export default function ValidateCustomerPage() {
  const router = useRouter()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [userDetails, setUserDetails] = useState<any>(null)
  const [validationTypes, setValidationTypes] = useState<ValidationType[]>([])
  const [selectedType, setSelectedType] = useState<string>("")
  const [inputValue, setInputValue] = useState<string>("")
  const [accountNumber, setAccountNumber] = useState<string>("")
  const [requestNumber, setRequestNumber] = useState<string>("")
  const [civilId, setCivilId] = useState<string>("")
  const [expiryDate, setExpiryDate] = useState<Date>()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("validate")

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.push('/login')
      return
    }

    // Load user details
    try {
      const userData = authService.getCurrentUser()
      if (userData && userData.BranchUserDetails && userData.BranchUserDetails.length > 0) {
        setUserDetails(userData.BranchUserDetails[0])
      }
    } catch (error) {
      console.error('Error loading user details:', error)
    }

    // Load menu data
    loadMenuData()
    loadValidationTypes()
  }, [router])

  const loadMenuData = async () => {
    try {
      const data = await menuService.getMenuDetails()
      if (data && data.length > 0) {
        const transformedData = data.map((item: any) => ({
          MenuID: item.MenuId,
          MenuNameEn: item.Menu_Name_EN,
          MenuNameAr: item.Menu_Name_AR,
          MenuURL: item.Target_Url,
          ApplicationNameEn: item.ApplicationNameEn || "General"
        }))
        setMenuItems(transformedData)
      }
    } catch (error) {
      console.error('Error loading menu data:', error)
    }
  }

  const loadValidationTypes = async () => {
    const types = await branchOpsService.getValidationTypes()
    setValidationTypes(types)
  }

  const handleLanguageChange = (lang: "EN" | "AR") => {
    setLanguage(lang)
  }

  const handleValidationTypeChange = (value: string) => {
    setSelectedType(value)
    // Reset all input fields
    setInputValue("")
    setAccountNumber("")
    setRequestNumber("")
    setCivilId("")
    setExpiryDate(undefined)

    // Handle special cases
    if (value === "ACCOUNT_PAYMENT") {
      // Redirect to payment page
      router.push("/paybill")
    }
  }

  const handleSearch = async () => {
    setIsLoading(true)

    try {
      switch (selectedType) {
        case "ACCOUNT_SEARCH":
          await handleAccountSearch()
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
      toast.error(error.message || "An error occurred")
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

    // Store in localStorage for the profile page
    localStorage.setItem("branchAccountSearch", JSON.stringify({
      accountNumber: accountNumber.trim(),
      serviceType: serviceType,
      customerInfo: customerInfo
    }))

    toast.success("Account found! Redirecting...")
    setTimeout(() => {
      router.push("/branchoperations/profile")
    }, 1000)
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

    if (!/^[79][0-9]{7}$/.test(inputValue)) {
      toast.error("Invalid mobile number")
      return
    }

    router.push(`/branchoperations/otp-log?mobile=${inputValue}`)
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
                  if (value === "" || /^[79][0-9]{0,7}$/.test(value)) {
                    setInputValue(value)
                  }
                }}
                placeholder="Please enter GSM number"
                maxLength={8}
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
              className="bg-teal-900 hover:bg-teal-800"
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header language={language} onLanguageChange={handleLanguageChange} userDetails={userDetails} />

      {/* Main Layout: Sidebar + Content */}
      {/* Logo Section */}
      <LogoSection />

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar menuItems={menuItems} language={language} />

        {/* Main Content Area */}
        <main className="flex-1 bg-gray-50 p-6 min-h-[600px] relative">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-teal-900 hover:text-teal-800 hover:bg-teal-50"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {/* Page Title */}
          <h1 className="text-2xl font-semibold text-teal-900 mb-6">
            Validate/Search a customer
          </h1>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="validate">Validate</TabsTrigger>
              <TabsTrigger value="profile">Profile Data</TabsTrigger>
            </TabsList>

            <TabsContent value="validate" className="space-y-6">
              {/* Main Validation Card */}
              <div className="bg-white rounded-lg shadow-md border p-6 space-y-6">
                <div>
                  <Label htmlFor="validateType">Validate Type</Label>
                  <Select value={selectedType} onValueChange={handleValidationTypeChange}>
                    <SelectTrigger id="validateType" className="mt-2">
                      <SelectValue placeholder="Select Validate Type" />
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

                {selectedType && selectedType !== "ACCOUNT_PAYMENT" && (
                  <div className="pt-4 border-t">
                    {renderInputField()}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <p className="text-gray-500 text-center py-8">
                  Profile data will be displayed here after validation
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </main>

      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
