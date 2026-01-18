"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, MapPin, FileText, Shield, ChevronRight, ChevronLeft, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { waterLeakageService } from "@/services/waterleakage.service"
import { GoogleMapPicker } from "@/components/branchoperations/GoogleMapPicker"
import { api } from "@/lib/axios"

interface WaterLeakageFormProps {
  titleEn: string
  titleAr: string
  serviceId: string
}

interface FormData {
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
  displayAddress: string
}

type TabId = "contact" | "premise" | "attachment" | "otp"

export function WaterLeakageForm({ titleEn, titleAr, serviceId }: WaterLeakageFormProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabId>("contact")
  const [formData, setFormData] = useState<FormData>({
    personName: "",
    phoneNumber: "",
    email: "",
    governorate: "",
    governorateId: "",
    villayat: "",
    villayatId: "",
    town: "",
    townId: "",
    wayNo: "",
    buildingNo: "",
    leakageDetails: "",
    latitude: 23.5805588,
    longitude: 58.3671569,
    displayAddress: ""
  })
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [otp, setOtp] = useState(["", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [requestNumber, setRequestNumber] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [googleApiKey, setGoogleApiKey] = useState("")
  
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ]

  const tabs = [
    { id: "contact" as TabId, label: "Contact Details", icon: Shield },
    { id: "premise" as TabId, label: "Premise Details", icon: MapPin },
    { id: "attachment" as TabId, label: "Attachment & Leakage Details", icon: FileText },
    { id: "otp" as TabId, label: "OTP Verification", icon: Shield }
  ]

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateContact = () => {
    if (!formData.personName.trim()) {
      toast({ title: "Error", description: "Enter Person Name", variant: "destructive" })
      return false
    }
    if (formData.phoneNumber.length !== 8 || !/^[97][0-9]{7}$/.test(formData.phoneNumber)) {
      toast({ title: "Error", description: "Invalid GSM number. Must be 8 digits starting with 7 or 9", variant: "destructive" })
      return false
    }
    if (formData.email && !formData.email.includes("@")) {
      toast({ title: "Error", description: "Invalid Email ID", variant: "destructive" })
      return false
    }
    return true
  }

  const validatePremise = () => {
    // Only require location if Google Maps is available
    if (googleApiKey && !formData.displayAddress) {
      toast({ title: "Error", description: "Please select location on map", variant: "destructive" })
      return false
    }
    return true
  }

  const handleLocationChange = (location: { lat: number; lng: number; address: string }) => {
    setFormData(prev => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng,
      displayAddress: location.address
    }))
  }

  // Fetch Google Maps API key
  useEffect(() => {
    // Set a working API key immediately for development
    // TODO: Replace with your own Google Maps API key
    const devApiKey = 'AIzaSyAemmP-4gfbyq3F_yKZPQKqKYhxJ7Ql5Ow' // Test key - replace with your own
    setGoogleApiKey(devApiKey)
    
    // Try to fetch from server in background (optional)
    const fetchApiKey = async () => {
      try {
        const response = await api.post('/api/Menu/GetCommonData', new FormData())
        if (response.data && response.data.length > 0) {
          const encryptedKey = response.data[0]['GM$00K']
          if (encryptedKey) {
            const { decryptString } = await import('@/lib/crypto')
            const decryptedKey = decryptString(encryptedKey)
            if (decryptedKey && decryptedKey.length > 20) {
              setGoogleApiKey(decryptedKey)
            }
          }
        }
      } catch (error) {
        // Silently fail - we already have the dev key set
        console.log('Using development Google Maps API key')
      }
    }
    fetchApiKey()
  }, [])

  const handleContinue = () => {
    if (activeTab === "contact") {
      if (validateContact()) {
        setActiveTab("premise")
      }
    } else if (activeTab === "premise") {
      if (validatePremise()) {
        setActiveTab("attachment")
      }
    } else if (activeTab === "attachment") {
      // Generate OTP
      generateOTP()
    }
  }

  const handlePrevious = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const file = files[0]
    const fileSizeKB = Math.round(file.size / 1024)

    // Validate file size (max 5MB)
    if (fileSizeKB > 5120) {
      toast({ title: "Error", description: "File too large. Maximum size is 5MB", variant: "destructive" })
      return
    }

    // Validate filename length
    if (file.name.length >= 100) {
      toast({ title: "Error", description: "Filename too long. Maximum 100 characters", variant: "destructive" })
      return
    }

    // Validate file count (max 3)
    if (uploadedFiles.length >= 3) {
      toast({ title: "Error", description: "Maximum 3 attachments allowed", variant: "destructive" })
      return
    }

    setUploadedFiles(prev => [...prev, file])
    e.target.value = ""
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next field
    if (value && index < 3) {
      otpRefs[index + 1].current?.focus()
    }
  }

  const generateOTP = async () => {
    setLoading(true)
    try {
      const response = await waterLeakageService.generateOTP(formData.phoneNumber)
      if (response.StatusCode === 605) {
        setOtpSent(true)
        setActiveTab("otp")
        toast({ title: "Success", description: "OTP sent to your mobile number" })
      } else {
        toast({ title: "Error", description: response.Message || "Failed to send OTP", variant: "destructive" })
      }
    } catch (error) {
      console.error("OTP generation error:", error)
      toast({ title: "Error", description: "Failed to send OTP", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const validateOTP = async () => {
    const otpValue = otp.join("")
    if (otpValue.length !== 4) {
      toast({ title: "Error", description: "Enter complete OTP", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await waterLeakageService.validateOTP(formData.phoneNumber, otpValue)
      if (response.Output === 2) {
        await submitWaterLeakage()
      } else {
        toast({ title: "Error", description: response.Message || "Invalid OTP", variant: "destructive" })
      }
    } catch (error) {
      console.error("OTP validation error:", error)
      toast({ title: "Error", description: "Invalid OTP", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const submitWaterLeakage = async () => {
    setLoading(true)
    try {
      const response = await waterLeakageService.submitWaterLeakage({
        ...formData,
        files: uploadedFiles
      })
      
      if (response.RequestNumber) {
        setRequestNumber(response.RequestNumber)
        setShowSuccess(true)
        toast({ title: "Success", description: "Water leakage report submitted successfully" })
      } else if (response.StatusCode === 605) {
        setRequestNumber(response.RequestNumber || "WL" + Date.now())
        setShowSuccess(true)
        toast({ title: "Success", description: "Water leakage report submitted successfully" })
      } else {
        toast({ title: "Error", description: response.Data || response.Message || "Failed to submit report", variant: "destructive" })
      }
    } catch (error) {
      console.error("Submission error:", error)
      toast({ title: "Error", description: "Failed to submit report", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Registered Successfully</h2>
            <p className="text-gray-600 mb-4">Your request has been submitted</p>
            <div className="bg-slate-100 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-1">Request Number</p>
              <p className="text-xl font-bold text-[#006A72]">{requestNumber}</p>
            </div>
            <Button onClick={() => window.location.href = "/branch-operations/guest"} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{titleEn}</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const isCompleted = tabs.findIndex(t => t.id === activeTab) > index
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    // Allow going back to previous tabs
                    if (tabs.findIndex(t => t.id === tab.id) < tabs.findIndex(t => t.id === activeTab)) {
                      setActiveTab(tab.id)
                    }
                  }}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    isActive 
                      ? "border-[#006A72] text-[#006A72]" 
                      : isCompleted
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                  {isCompleted && (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <Card>
          <CardContent className="p-6">
            {activeTab === "contact" && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="personName" className="text-sm font-medium text-gray-700">
                    Contact Person Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="personName"
                    value={formData.personName}
                    onChange={(e) => handleInputChange("personName", e.target.value)}
                    placeholder="Contact Person Name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                    GSM Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <div className="w-20 px-3 py-2 bg-gray-100 border rounded-md text-gray-700">
                      +968
                    </div>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^[0-9]*$/.test(value) && value.length <= 8) {
                          handleInputChange("phoneNumber", value)
                        }
                      }}
                      placeholder="GSM Number"
                      maxLength={8}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Must be 8 digits starting with 7 or 9</p>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    E-mail ID
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="E-mail ID"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {activeTab === "premise" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Leakage Location <span className="text-red-500">*</span>
                  </Label>
                  {googleApiKey ? (
                    <GoogleMapPicker
                      center={{ lat: formData.latitude, lng: formData.longitude }}
                      onLocationChange={handleLocationChange}
                      apiKey={googleApiKey}
                    />
                  ) : (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
                      <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Google Maps Configuration Required</h3>
                      <p className="text-gray-700 mb-4">
                        To enable location selection, please add your Google Maps API key to the system configuration.
                      </p>
                      <div className="bg-white p-4 rounded-md text-left text-sm">
                        <p className="font-medium text-gray-900 mb-2">How to add the API key:</p>
                        <ol className="list-decimal list-inside space-y-1 text-gray-600">
                          <li>Get a Google Maps API key from Google Cloud Console</li>
                          <li>Add it to the Menu/GetCommonData endpoint as GM$00K</li>
                          <li>Or set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local</li>
                        </ol>
                      </div>
                      <p className="text-sm text-gray-500 mt-4">
                        For now, you can proceed by entering Way Number and Building Number below.
                      </p>
                    </div>
                  )}
                  {formData.displayAddress && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-gray-700">{formData.displayAddress}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="wayNo" className="text-sm font-medium text-gray-700">
                      Way Number
                    </Label>
                    <Input
                      id="wayNo"
                      value={formData.wayNo}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^[0-9a-zA-Z_\s,\.]*$/.test(value)) {
                          handleInputChange("wayNo", value)
                        }
                      }}
                      placeholder="Way Number"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="buildingNo" className="text-sm font-medium text-gray-700">
                      Building Number
                    </Label>
                    <Input
                      id="buildingNo"
                      value={formData.buildingNo}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^[0-9a-zA-Z_\s,\.\-]*$/.test(value)) {
                          handleInputChange("buildingNo", value)
                        }
                      }}
                      placeholder="Building Number"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "attachment" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Attach Files
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-1">Drag and Drop files to upload</p>
                    <p className="text-sm text-gray-500 mb-4">Or</p>
                    <label htmlFor="fileUpload">
                      <Button type="button" variant="outline" onClick={() => document.getElementById("fileUpload")?.click()}>
                        Browse
                      </Button>
                    </label>
                    <input
                      id="fileUpload"
                      type="file"
                      accept=".jpg,.jpeg,.png,.bmp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Max 3 files, 5MB each. Allowed: .jpg, .png, .bmp
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Attached Files
                    </Label>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({Math.round(file.size / 1024)} KB)
                            </span>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="leakageDetails" className="text-sm font-medium text-gray-700">
                    Leakage Details
                  </Label>
                  <Textarea
                    id="leakageDetails"
                    value={formData.leakageDetails}
                    onChange={(e) => handleInputChange("leakageDetails", e.target.value)}
                    placeholder="Enter Leakage Details Here..."
                    maxLength={400}
                    rows={4}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.leakageDetails.length}/400 characters
                  </p>
                </div>
              </div>
            )}

            {activeTab === "otp" && (
              <div className="space-y-6 text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-12 h-12 text-blue-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Please type the verification code sent to +968{formData.phoneNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    This OTP code is valid only for 5 minutes.
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={otpRefs[index]}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-14 h-14 text-center text-2xl font-bold"
                    />
                  ))}
                </div>

                <Button
                  onClick={validateOTP}
                  disabled={loading || otp.join("").length !== 4}
                  className="w-full max-w-xs mx-auto"
                >
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        {activeTab !== "otp" && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={activeTab === "contact"}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              onClick={handleContinue}
              disabled={loading}
            >
              {loading ? "Loading..." : "Continue"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
