"use client"

import React, { useState, useEffect, useRef } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { appointmentService } from "@/services/appointment.service"
import { 
  Calendar as CalendarIcon, 
  User, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  Smartphone,
  Mail,
  ShieldCheck,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { format, isSameDay, parseISO } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { encryptString } from "@/lib/crypto"
import { cn } from "@/lib/utils"

export default function AppointmentList() {
  const { language } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Wizard Steps: 1: Location & Service, 2: Date & Slot, 3: Details & Confirmation, 4: Success
  const [currentStep, setCurrentStep] = useState(1)

  // Data
  const [governorates, setGovernorates] = useState<any[]>([])
  const [wilayats, setWilayats] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [availableDates, setAvailableDates] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<any[]>([])

  // Selections
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>("")
  const [selectedWilayat, setSelectedWilayat] = useState<string>("")
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  
  // Slot Blocking
  const [blockedSlotId, setBlockedSlotId] = useState<string | null>(null)

  // Customer Form
  const [customerName, setCustomerName] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [email, setEmail] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [isOtpRequired, setIsOtpRequired] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)

  // Refs for cleanup
  const blockIdRef = useRef<string | null>(null)

  // Load Master Data on Mount
  useEffect(() => {
    loadMasterData()
    // Cleanup block on unmount
    return () => {
        if (blockIdRef.current) {
            appointmentService.unblockSlot(blockIdRef.current)
        }
    }
  }, [])

  // Sync ref with state
  useEffect(() => {
    blockIdRef.current = blockedSlotId
  }, [blockedSlotId])

  // Initial Load
  const loadMasterData = async () => {
    try {
      setIsLoading(true)
      const data = await appointmentService.getMasterData()
      setGovernorates(data.Governorates || [])
      setWilayats(data.Wilayats || [])
      setBranches(data.Table || [])
      setCategories(data["Appointment Request Category"] || [])
    } catch {
      toast.error("Failed to load reference data")
    } finally {
      setIsLoading(false)
    }
  }

  // Effect: Fetch dates when branch is selected (Step 1 -> 2 transition prep)
  useEffect(() => {
    if (selectedBranch && currentStep === 2) {
        fetchDates()
    }
  }, [selectedBranch, currentStep])

  // Effect: Fetch slots when date is selected
  useEffect(() => {
    if (selectedDate && selectedBranch) {
        fetchSlots()
    }
  }, [selectedDate, selectedBranch])

  const fetchDates = async () => {
      try {
          const dates = await appointmentService.getDates()
          setAvailableDates(dates)
      } catch (e) {
          console.error(e)
      }
  }

  const fetchSlots = async () => {
    if (!selectedDate || !selectedBranch) return
    try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const slots = await appointmentService.getSlots(dateStr, selectedBranch)
        // Client side filtering for active slots if API returns all
        setAvailableSlots(slots.filter((s: any) => s.IsActive))
    } catch {
        setAvailableSlots([])
    }
  }

  // --- Actions ---

  const handleStep1Submit = () => {
      if (!selectedBranch || !selectedCategory) {
          toast.error(language === "EN" ? "Please select branch and category" : "يرجى اختيار الفرع والفئة")
          return
      }
      setCurrentStep(2)
  }

  const handleSlotSelection = async (slot: any) => {
      // If we already have a blocked slot that isn't this one, unblock it first?
      // For now, simpler: unblock previous if exists.
      if (blockedSlotId) {
          await appointmentService.unblockSlot(blockedSlotId)
          setBlockedSlotId(null)
      }

      setIsLoading(true)
      try {
          const dateStr = format(selectedDate!, 'yyyy-MM-dd')
          const response = await appointmentService.blockSlot(
              dateStr, 
              selectedBranch, 
              slot.BranchWiseSlotID, 
              language
          )

          if (response.IsBlocked === 0) {
              setBlockedSlotId(response.Id)
              setSelectedSlot(slot)
              setCurrentStep(3)
          } else {
              toast.error(response.BlockedReason || "Slot not available")
          }
      } catch {
          toast.error("Failed to reserve slot")
      } finally {
          setIsLoading(false)
      }
  }

  const handleDetailsSubmit = async () => {
    // 1. Validation
    if (!customerName || !mobileNumber) {
        toast.error("Name and Mobile are required")
        return
    }
    const phoneRegex = /^[9,7][0-9]*$/
    if (!phoneRegex.test(mobileNumber) || mobileNumber.length < 8) {
        toast.error("Invalid mobile number (must start with 9 or 7)")
        return
    }

    setIsSubmitting(true)
    try {
        // 2. Check Appointment Booked
        const checkPayload = {
            AppointmentDate: format(selectedDate!, 'yyyy-MM-dd'),
            BranchID: selectedBranch,
            BranchwiseTimeslotID: selectedSlot.BranchWiseSlotID,
            MobileNumber: encodeURIComponent(encryptString(mobileNumber)),
            PreferredLang: language,
            // AccountNumber: accountNumber ? encodeURIComponent(encryptString(accountNumber)) : undefined
        }
        
        const checkRes = await appointmentService.checkAppointmentBooked(checkPayload)
        
        if (checkRes.IsBlocked !== 0) {
            toast.error(checkRes.BlockedReason || "Appointment cannot be booked")
            setIsSubmitting(false)
            return
        }

        // 3. Check OTP Requirement
        const otpCheckRes = await appointmentService.checkOTPValidationRequired(
            encodeURIComponent(encryptString('968' + mobileNumber))
        )

        if (otpCheckRes.isOTPValidationReq === 1) {
            setIsOtpRequired(true)
            setShowOtpInput(true)
            // Generate OTP
            await appointmentService.generateOTP(
                encodeURIComponent(encryptString('968' + mobileNumber)),
                language
            )
            toast.info(language === "EN" ? "OTP sent to your mobile" : "تم إرسال رمز التحقق إلى هاتفك")
            setIsSubmitting(false)
        } else {
            // No OTP, proceed to create
            await executeBooking()
        }

    } catch (e) {
        console.error(e)
        toast.error("Validation failed")
        setIsSubmitting(false)
    }
  }

  const executeBooking = async () => {
      try {
          const payload = {
            FullName: encodeURIComponent(encryptString(customerName)),
            MobileNumber: encodeURIComponent(encryptString('968' + mobileNumber)),
            EmailID: email ? encodeURIComponent(encryptString(email)) : undefined,
            AccountNumber: accountNumber, // Optional
            GovernorateID: selectedGovernorate,
            WilayatID: selectedWilayat,
            BranchID: selectedBranch,
            BranchWiseTimeSlotID: selectedSlot.BranchWiseSlotID,
            TypeofVisitID: "1", // Hardcoded per doc reference or should be from master? Assuming 1 for now or categories
            NotificationTypeID: "1", // SMS
            AppointmentTypeID: "1",
            SystemSourceTypeID: "1",
            TokenNumber: "",
            AppointmentDate: format(selectedDate!, 'yyyy-MM-dd'),
            StartTime: selectedSlot.TimeSlotStart,
            EndTime: selectedSlot.EndTime,
            PreferredLang: language,
            AppointmentRequestCategory: selectedCategory, // Or 1/2 logic
            OTP: isOtpRequired ? encodeURIComponent(encryptString(otp)) : undefined
          }

          const res = await appointmentService.createAppointment(payload)
          
          if (res.AppointmentNum || res.StatusCode === 605) {
              setBlockedSlotId(null) // Block is consumed/converted
              setCurrentStep(4)
          } else if (res.StatusCode === 1013) {
              toast.error(res.Data || "Invalid OTP")
          } else {
              toast.error(res.Message || "Booking failed")
          }
      } catch (e) {
          toast.error("Booking error")
      } finally {
          setIsSubmitting(false)
      }
  }

  const handleCancel = async () => {
      if (blockedSlotId) {
          await appointmentService.unblockSlot(blockedSlotId)
          setBlockedSlotId(null)
      }
      setCurrentStep(1)
      setSelectedDate(undefined)
      setSelectedSlot(null)
  }

  // --- Render Helpers ---

  const StepIndicator = ({ step, label, current }: any) => (
      <div className={cn("flex items-center gap-2", currentStep >= step ? "text-teal-700" : "text-slate-400")}>
          <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
              currentStep >= step ? "bg-teal-600 text-white border-teal-600" : "bg-transparent border-slate-300"
          )}>
              {currentStep > step ? <CheckCircle2 className="h-5 w-5" /> : step}
          </div>
          <span className="text-xs font-black uppercase tracking-widest hidden sm:block">{label}</span>
      </div>
  )

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden ">
      <PageHeader
        language={language}
        titleEn="Book Appointment"
        titleAr="حجز موعد"
        breadcrumbEn="Appointments"
        breadcrumbAr="المواعيد"
      />

      <div className="max-w-[1400px] mx-auto p-6">
        {/* Wizard Header */}
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
            <StepIndicator step={1} label={language === "EN" ? "Location" : "الموقع"} current={currentStep} />
            <div className="w-12 h-px bg-slate-200" />
            <StepIndicator step={2} label={language === "EN" ? "Date & Time" : "الموعد"} current={currentStep} />
            <div className="w-12 h-px bg-slate-200" />
            <StepIndicator step={3} label={language === "EN" ? "Details" : "التفاصيل"} current={currentStep} />
            <div className="w-12 h-px bg-slate-200" />
            <StepIndicator step={4} label={language === "EN" ? "Done" : "تم"} current={currentStep} />
        </div>

        {/* Step 1: Location & Service */}
        {currentStep === 1 && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-none shadow-xl shadow-teal-900/5 bg-white overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                        <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                            <MapPin className="h-6 w-6 text-teal-600" />
                            {language === "EN" ? "Select Location" : "اختيار الموقع"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-2">
                             <label className="text-xs font-black uppercase tracking-widest text-slate-400">{language === "EN" ? "Governorate" : "المحافظة"}</label>
                             <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                                <SelectTrigger className="h-14 bg-slate-50 border-none rounded-xl">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {governorates.map(g => <SelectItem key={g.GovernorateID} value={g.GovernorateID.toString()}>{language === "EN" ? g.GovernorateNameEN : g.GovernorateNameAR}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                             <label className="text-xs font-black uppercase tracking-widest text-slate-400">{language === "EN" ? "Wilayat" : "الولاية"}</label>
                             <Select value={selectedWilayat} onValueChange={setSelectedWilayat}>
                                <SelectTrigger className="h-14 bg-slate-50 border-none rounded-xl">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {wilayats.map(w => <SelectItem key={w.WilayatID} value={w.WilayatID.toString()}>{language === "EN" ? w.WilayatNameEN : w.WilayatNameAR}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                             <label className="text-xs font-black uppercase tracking-widest text-slate-400">{language === "EN" ? "Branch" : "الفرع"}</label>
                             <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                <SelectTrigger className="h-14 bg-slate-50 border-none rounded-xl">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(b => <SelectItem key={b.BranchID} value={b.BranchID.toString()}>{language === "EN" ? b.BranchNameEN : b.BranchNameAR}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                             <label className="text-xs font-black uppercase tracking-widest text-slate-400">{language === "EN" ? "Service Category" : "فئة الخدمة"}</label>
                             <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="h-14 bg-slate-50 border-none rounded-xl">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c.ID} value={c.ID.toString()}>{language === "EN" ? c.NameEn : c.NameAr}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button 
                            onClick={handleStep1Submit}
                            className="w-full h-14 mt-4 bg-teal-600 hover:bg-teal-700 text-white font-black text-lg rounded-xl shadow-lg shadow-teal-900/10"
                        >
                            {language === "EN" ? "Find Available Slots" : "بحث عن فترات متاحة"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )}

        {/* Step 2: Date & Slot */}
        {currentStep === 2 && (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="lg:col-span-5 space-y-6">
                    <Card className="border-none shadow-xl shadow-teal-900/5 bg-white rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                           <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-3">
                               <CalendarIcon className="h-5 w-5 text-teal-600" />
                               {language === "EN" ? "Pick a Date" : "اختر التاريخ"}
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Calendar 
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="border rounded-2xl p-4 bg-white shadow-sm w-full"
                                disabled={(date) => {
                                    // Disable dates not in availableDates or strictly past
                                    // For simplicity and resilience, assuming getDates returns valid bookable dates
                                    // Check if date string is in availableDates array
                                    if (date < new Date(new Date().setHours(0,0,0,0))) return true
                                    const dStr = format(date, 'yyyy-MM-dd')
                                    // Only enable if in list and active
                                    // return !availableDates.some(ad => ad.Dates === dStr && ad.IsActive === 1)
                                    // Actually the API returns only active dates usually or we filter. 
                                    // If availableDates is empty, we might allow all future? No, stick to API.
                                    if (availableDates.length > 0) {
                                         return !availableDates.some(ad => ad.Dates.split('T')[0] === dStr && ad.IsActive === 1)
                                    }
                                    return false // Fallback
                                }}
                            />
                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                {availableDates.slice(0, 3).map((d, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setSelectedDate(parseISO(d.Dates))}
                                        className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-full font-bold hover:bg-teal-100"
                                    >
                                        {format(parseISO(d.Dates), 'dd MMM')}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-7 space-y-6">
                     <Card className="border-none shadow-xl shadow-teal-900/5 bg-white rounded-[2.5rem] h-full">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 flex flex-row justify-between items-center">
                           <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-3">
                               <Clock className="h-5 w-5 text-teal-600" />
                               {language === "EN" ? "Available Time Slots" : "الفترات الزمنية المتاحة"}
                           </CardTitle>
                           {isLoading && <Loader2 className="h-5 w-5 animate-spin text-teal-600" />}
                        </CardHeader>
                        <CardContent className="p-6">
                            {!selectedDate ? (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                                    <CalendarIcon className="h-12 w-12 mb-4 opacity-20" />
                                    <p className="font-bold uppercase tracking-widest text-sm">Select a date first</p>
                                </div>
                            ) : availableSlots.length === 0 ? (
                                 <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                                    <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
                                    <p className="font-bold uppercase tracking-widest text-sm">No slots available</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {availableSlots.map((slot, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSlotSelection(slot)}
                                            disabled={isLoading}
                                            className="group relative p-4 rounded-2xl border border-slate-100 hover:border-teal-400 hover:shadow-md transition-all bg-white text-left"
                                        >
                                            <p className="font-black text-slate-800 text-lg group-hover:text-teal-700">{slot.TimeSlotStart}</p>
                                            <p className="text-xs text-slate-400 font-medium">to {slot.EndTime}</p>
                                            <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-emerald-400" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                     </Card>
                </div>
             </div>
        )}

        {/* Step 3: Details & Confirmation & OTP */}
        {currentStep === 3 && (
            <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
                <Card className="border-none shadow-2xl shadow-teal-900/10 rounded-[2.5rem] bg-white overflow-hidden">
                    <div className="bg-[#1F4E58] p-8 text-white flex items-center gap-6">
                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                           <User className="h-8 w-8 text-teal-300" />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black">{language === "EN" ? "Visitor Details" : "تفاصيل الزائر"}</h2>
                           <p className="text-teal-50/70 text-sm mt-1">{format(selectedDate!, "EEEE, dd MMM yyyy")} @ {selectedSlot.TimeSlotStart}</p>
                        </div>
                    </div>
                    
                    <CardContent className="p-8 space-y-6">
                        {!showOtpInput ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">{language === "EN" ? "Full Name" : "الاسم الكامل"} <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                        <Input 
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            className="h-14 pl-12 bg-slate-50 border-none rounded-xl"
                                            placeholder="Enter full name"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">{language === "EN" ? "Mobile Number" : "رقم الجوال"} <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                        <Input 
                                            value={mobileNumber}
                                            onChange={(e) => setMobileNumber(e.target.value)}
                                            className="h-14 pl-12 bg-slate-50 border-none rounded-xl"
                                            placeholder="9XXXXXXX"
                                            maxLength={8}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold">Must start with 9 or 7 (8 digits)</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">{language === "EN" ? "Email (Optional)" : "البريد الإلكتروني (اختياري)"}</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                        <Input 
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-14 pl-12 bg-slate-50 border-none rounded-xl"
                                            placeholder="example@mail.com"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button variant="ghost" onClick={handleCancel} className="flex-1 h-14 rounded-xl text-slate-500 font-bold">
                                        {language === "EN" ? "Cancel" : "إلغاء"}
                                    </Button>
                                    <Button 
                                        onClick={handleDetailsSubmit}
                                        disabled={isSubmitting}
                                        className="flex-[2] h-14 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl shadow-lg"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : (language === "EN" ? "Confirm Booking" : "تأكيد الحجز")}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6 py-6 animate-in fade-in slide-in-from-bottom-8">
                                <div className="text-center space-y-2">
                                    <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck className="h-8 w-8 text-teal-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">Verify Mobile Number</h3>
                                    <p className="text-sm text-slate-500">We sent a code to <span className="font-bold text-slate-800">+968 {mobileNumber}</span></p>
                                </div>

                                <div className="space-y-2">
                                    <Input 
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="h-16 text-center text-2xl font-black tracking-[0.5em] bg-slate-50 border-2 border-teal-100 focus:border-teal-500 rounded-xl transition-all"
                                        placeholder="0000"
                                        maxLength={6}
                                    />
                                </div>

                                <Button 
                                    onClick={executeBooking}
                                    disabled={isSubmitting || otp.length < 4}
                                    className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl shadow-lg"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : (language === "EN" ? "Verify & Book" : "تحقق وحجز")}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        )}

        {/* Step 4: Success */}
        {currentStep === 4 && (
             <div className="max-w-xl mx-auto text-center space-y-8 py-12 animate-in zoom-in-95 duration-700">
                <div className="inline-flex relative">
                    <div className="absolute inset-0 bg-teal-200 blur-2xl opacity-50 rounded-full animate-pulse" />
                    <div className="h-32 w-32 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-full flex items-center justify-center shadow-2xl relative z-10 text-white">
                        <CheckCircle2 className="h-16 w-16" />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-800">{language === "EN" ? "Booking Confirmed!" : "تم تأكيد الحجز!"}</h2>
                    <p className="text-slate-500 font-medium text-lg">Your appointment has been successfully scheduled.</p>
                </div>

                <Card className="bg-white border-none shadow-xl shadow-slate-200 rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                        <div className="flex justify-between items-center py-4 border-b border-slate-50">
                            <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Date</span>
                            <span className="font-bold text-slate-800">{format(selectedDate!, "dd MMMM yyyy")}</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-b border-slate-50">
                            <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Time</span>
                            <span className="font-bold text-slate-800">{selectedSlot?.TimeSlotStart}</span>
                        </div>
                        <div className="flex justify-between items-center py-4">
                            <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Location</span>
                            <span className="font-bold text-slate-800">{branches.find(b => b.BranchID.toString() === selectedBranch)?.BranchNameEN}</span>
                        </div>
                    </CardContent>
                </Card>

                <Button 
                    onClick={() => window.location.reload()}
                    className="h-14 px-12 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl shadow-xl"
                >
                    {language === "EN" ? "Book Another" : "حجز آخر"}
                </Button>
             </div>
        )}
      </div>
    </div>
  )
}
