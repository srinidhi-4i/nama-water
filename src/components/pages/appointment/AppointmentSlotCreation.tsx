"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { appointmentService } from "@/services/appointment.service"
import { authService } from "@/services/auth.service"
import AppointmentWeeklyView from "@/components/appointment/AppointmentWeeklyView"
import { 
  Calendar, 
  Clock, 
  Users, 
  Timer, 
  ArrowLeft, 
  MapPin,
  Plus, 
  Minus,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import { format, addDays, getYear, eachYearOfInterval } from "date-fns"
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal"
import { LoadingButton } from "@/components/ui/loading-button"

import AppointmentSlotEditor from "@/components/appointment/AppointmentSlotEditor"

export default function AppointmentSlotCreation() {
  const { language } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // View state
  const [viewMode, setViewMode] = useState<"creation" | "edit">("creation")
  const [editingDate, setEditingDate] = useState<string>("")

  // Master data
  const [governorates, setGovernorates] = useState<any[]>([])
  const [wilayats, setWilayats] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [timeSlotDurations, setTimeSlotDurations] = useState<any[]>([])

  // Form state
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>("")
  const [selectedWilayat, setSelectedWilayat] = useState<string>("")
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const [counter, setCounter] = useState(1)
  const [duration, setDuration] = useState(15) // Default to 15 mins
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("14:00")
  
  // Validation state
  const [dateError, setDateError] = useState<string>("")
  const [timeError, setTimeError] = useState<string>("")

  // Modals state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showHolidayModal, setShowHolidayModal] = useState(false)
  
  useEffect(() => {
    loadMasterData()
  }, [])

  const loadMasterData = async () => {
    try {
      setIsLoading(true)
      const data = await appointmentService.getMasterData()
      
      const govs = data.Governorates || data.Governorate || [];
      const wils = data.Wilayats || data.Wilayat || [];
      const brs = data.Table || data.Branch || [];
      
      setGovernorates(govs)
      setWilayats(wils)
      setBranches(brs)

      if (data.TimeSlotDuration || data['Time Slot Duration']) {
         setTimeSlotDurations(data.TimeSlotDuration || data['Time Slot Duration']);
      }
      
    } catch (error) {
      console.error('Error loading master data:', error);
      toast.error("Failed to load reference data")
    } finally {
      setIsLoading(false)
    }
  }

  const convertTo12Hour = (time: string) => {
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours, 10)
    const suffix = h >= 12 ? 'PM' : 'AM'
    const adjustedH = h % 12 || 12
    return `${adjustedH}:${minutes} ${suffix}`
  }

  const getDurationID = (mins: number) => {
    const found = timeSlotDurations.find((d: any) => (d.Duration == mins || d.Name == mins.toString()));
    return found ? found.ID?.toString() : mins.toString();
  }

  const isHolidaysDefined = async () => {
    if (!fromDate || !toDate) return false;
    const startYear = getYear(new Date(fromDate));
    const endYear = getYear(new Date(toDate));
    const yearRange = eachYearOfInterval({ start: new Date(startYear, 0, 1), end: new Date(endYear, 0, 1) });
    
    try {
        const results = await Promise.all(yearRange.map(async (date) => {
            const y = getYear(date);
            const holidays = await appointmentService.getHolidayDates(`${y}-01-01`, `${y}-12-31`);
            return holidays.length > 0;
        }));
        return results.every(r => r);
    } catch (e) {
        return false;
    }
  }

  const checkAvailability = async () => {
      const holidayDefined = await isHolidaysDefined();
      if (!holidayDefined) {
          setShowHolidayModal(true);
          return false;
      }

      const availabilityResponse = await appointmentService.checkAvailableTimeSlots(selectedBranch, fromDate, toDate);
      
      const holidayTable = availabilityResponse?.Table1 || [];
      const slotsTable = availabilityResponse?.Table || [];

      const holidays = holidayTable.filter((item: any) => item.HolidayReason === "WO" || item.HolidayReason === "SH");
      if (holidays.length > 0 && holidays.length === holidayTable.length) {
          toast.error(language === "EN" ? "Selected range contains only holidays/weekends" : "النطاق المحدد يحتوي فقط على عطلات / عطلات نهاية الأسبوع");
          return false;
      }

      if (slotsTable.length > 0) {
          setShowConfirmModal(true);
          return false;
      }

      return true;
  }

  const handleCreateClick = async () => {
    if (!fromDate || !toDate || !selectedBranch || !startTime || !endTime) {
      toast.error(language === "EN" ? "Please fill all required fields" : "يرجى ملء جميع الحقول المطلوبة")
      return
    }

    // 1. Date Validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startD = new Date(fromDate);
    const endD = new Date(toDate);

    if (startD < today) {
        toast.error(language === "EN" ? "From Date cannot be in the past" : "لا يمكن أن يكون تاريخ البدء في الماضي");
        return;
    }

    if (endD < startD) {
        toast.error(language === "EN" ? "To Date cannot be before From Date" : "لا يمكن أن يكون تاريخ الانتهاء قبل تاريخ البدء");
        return;
    }

    // 2. Time Validation
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
        toast.error(language === "EN" ? "End Time must be after Start Time" : "يجب أن يكون وقت الانتهاء بعد وقت البدء");
        return;
    }

    const canProceed = await checkAvailability();
    if (canProceed) {
        performCreate();
    }
  }

  const performCreate = async () => {
    setIsSubmitting(true)
    try {
      const currentUser = authService.getCurrentUser();
      const internalUserID = currentUser?.BranchUserDetails?.[0]?.UserADId || "1";

      const payload = {
        governorateID: selectedGovernorate,
        wilayatID: selectedWilayat,
        branchID: selectedBranch,
        timeSlotDurationID: getDurationID(duration), 
        timeSlotStart: convertTo12Hour(startTime), 
        timeSlotEnd: convertTo12Hour(endTime),
        startDate: fromDate,
        endDate: toDate,
        internalUserID: internalUserID, 
        noOfAppointmentPerSlot: counter.toString(),
        lang: language
      }

      const response = await appointmentService.createSlotsByAdmin(payload)
      
      // Strict check on response
      if (response && (response.StatusCode === 605 || response.IsSuccess === 1)) {
        // Double check IsBlock if present
        if (response.IsBlock === 1 || response.Data?.IsBlock === 1) {
             toast.error(response.ErrorMessage || response.Data?.ErrorMessage || (language === "EN" ? "Failed to create slots: Slots are blocked" : "فشل إنشاء الفترات: الفترات محظورة"))
        } else {
             toast.success(language === "EN" ? "Slots created successfully" : "تم إنشاء الفترات بنجاح")
             setRefreshTrigger(prev => prev + 1)
             setShowConfirmModal(false);
        }
      } else {
        toast.error(response?.ErrorMessage || response?.Message || (language === "EN" ? "Failed to create slots" : "فشل في إنشاء الفترات"))
      }
    } catch (error) {
      console.error('Error creating slots:', error);
      toast.error(language === "EN" ? "An error occurred while creating slots" : "حدث خطأ أثناء إنشاء الفترات")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDateSelect = (date: string) => {
    setEditingDate(date)
    setViewMode("edit")
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Render Editor View
  if (viewMode === "edit" && editingDate) {
    return (
      <div className="flex-1 bg-slate-100 overflow-x-hidden min-h-screen">
         <div className="max-w-[1600px] mx-auto p-4 md:p-6">
            <AppointmentSlotEditor 
              selectedDate={editingDate}
              branchID={selectedBranch}
              timeSlotDurations={timeSlotDurations}
              onBack={() => {
                setViewMode("creation")
                setEditingDate("")
                setRefreshTrigger(prev => prev + 1) // Refresh calendar when returning
              }}
            />
         </div>
      </div>
    )
  }

  // Render Creation View
  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden ">
      <PageHeader
        language={language}
        titleEn="Appointment Booking"
        titleAr="حجز المواعيد"
        breadcrumbEn="Slot Creation"
        breadcrumbAr="إنشاء الفترات"
      />

      <div className="max-w-[1600px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Panel (2/5) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-none shadow-sm shadow-teal-900/5 bg-white overflow-hidden">
            <div className="p-4 space-y-6">
              <div className="space-y-2">
                <div className="space-y-0.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === "EN" ? "Governorate" : "المحافظة"} <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    value={selectedGovernorate} 
                    onValueChange={(val) => {
                      setSelectedGovernorate(val);
                      setSelectedWilayat("");
                      setSelectedBranch("");
                    }}
                  >
                    <SelectTrigger className="h-8 bg-white border-slate-200 text-xs shadow-none">
                      <SelectValue placeholder="Select Governorate" />
                    </SelectTrigger>
                    <SelectContent>
                      {governorates.map((g, idx) => {
                        const id = g.GovernorateID?.toString() || g.GovernarateID?.toString() || g.ID?.toString() || `gov-${idx}`;
                        const name = language === "EN" ? (g.GovernorateNameEN || g.GovernorateEn || g.NameEn) : (g.GovernorateNameAR || g.GovernorateAr || g.NameAr);
                        return (
                          <SelectItem key={id} value={id}>
                            {name || `Gov ${id}`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-0.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === "EN" ? "Wilayat" : "الولاية"} <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    value={selectedWilayat} 
                    onValueChange={(val) => {
                      setSelectedWilayat(val);
                      setSelectedBranch("");
                    }}
                    disabled={!selectedGovernorate}
                  >
                    <SelectTrigger className="h-8 bg-white border-slate-200 text-xs shadow-none">
                      <SelectValue placeholder="Select Wilayat" />
                    </SelectTrigger>
                    <SelectContent>
                      {wilayats
                        .filter(w => w.GovernorateID?.toString() === selectedGovernorate)
                        .map((w, idx) => {
                          const id = w.WilayatID?.toString() || `wil-${idx}`;
                          const name = language === "EN" ? w.WilayatNameEN : w.WilayatNameAR;
                          return (
                            <SelectItem key={id} value={id}>
                              {name || `Wilayat ${id}`}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === "EN" ? "Branch Name" : "اسم الفرع"} <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    value={selectedBranch} 
                    onValueChange={setSelectedBranch}
                    disabled={!selectedWilayat}
                  >
                    <SelectTrigger className="h-8 bg-white border-slate-200 text-xs shadow-none">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches
                        .filter(b => b.WilayatID?.toString() === selectedWilayat)
                        .map((b, idx) => {
                          const id = b.BranchID?.toString() || `br-${idx}`;
                          const name = language === "EN" ? b.BranchNameEN : b.BranchNameAR;
                          return (
                            <SelectItem key={id} value={id}>
                              {name || `Branch ${id}`}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={`space-y-2 transition-opacity duration-300 ${!selectedBranch ? 'opacity-50 pointer-events-none' : ''}`}>
                <h3 className="text-teal-900 font-bold text-[10px] tracking-wide border-b border-teal-100/50 pb-0.5 flex items-center gap-2 uppercase">
                   <Calendar className="h-3 w-3 text-teal-600" />
                   {language === "EN" ? "SELECT DATE RANGE" : "اختر نطاق التاريخ"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "From Date" : "من تاريخ"}</label>
                    <Input 
                      type="date" 
                      value={fromDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFromDate(val);
                        // Validate immediately
                        if (val && new Date(val) < new Date(new Date().setHours(0,0,0,0))) {
                             setDateError(language === "EN" ? "Date cannot be in the past" : "لا يمكن أن يكون التاريخ في الماضي");
                        } else if (toDate && val > toDate) {
                             setDateError(language === "EN" ? "From Date cannot be after To Date" : "تاريخ البدء لا يمكن أن يكون بعد تاريخ الانتهاء");
                        } else {
                             setDateError("");
                        }
                      }}
                      className={`h-8 bg-slate-50 border-slate-200 text-xs px-2 shadow-none ${dateError ? "border-red-500" : ""}`} 
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "To Date" : "إلى تاريخ"}</label>
                    <Input 
                      type="date" 
                      value={toDate}
                      onChange={(e) => {
                          const val = e.target.value;
                          setToDate(val);
                          if (fromDate && val < fromDate) {
                              setDateError(language === "EN" ? "To Date cannot be before From Date" : "تاريخ الانتهاء لا يمكن أن يكون قبل تاريخ البدء");
                          } else {
                              setDateError("");
                          }
                      }}
                      className={`h-8 bg-slate-50 border-slate-200 text-xs px-2 shadow-none ${dateError ? "border-red-500" : ""}`} 
                    />
                  </div>
                  {dateError && (
                      <div className="col-span-2 text-[10px] text-red-500 font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {dateError}
                      </div>
                  )}
                </div>
              </div>

              <div className={`space-y-2 transition-opacity duration-300 ${(!selectedBranch || !fromDate || !toDate) ? 'opacity-50 pointer-events-none' : ''}`}>
                <h3 className="text-teal-900 font-bold text-[10px] tracking-wide border-b border-teal-100/50 pb-0.5 flex items-center gap-2 uppercase">
                  <Clock className="h-3 w-3 text-teal-600" />
                  {language === "EN" ? "CREATE TIME SLOT" : "إنشاء فترة زمنية"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "Available Counter" : "عداد متاح"}</label>
                    <div className="flex h-8 rounded-md border border-slate-200 overflow-hidden bg-slate-50">
                       <button onClick={() => setCounter(Math.max(1, counter - 1))} className="w-8 flex items-center justify-center hover:bg-slate-100 transition-colors">
                         <Minus className="h-3 w-3 text-slate-500" />
                       </button>
                       <div className="flex-1 flex items-center justify-center font-bold text-xs text-slate-700">
                         {counter}
                       </div>
                       <button onClick={() => setCounter(counter + 1)} className="w-8 flex items-center justify-center hover:bg-slate-100 transition-colors border-l border-slate-100">
                         <Plus className="h-3 w-3 text-slate-500" />
                       </button>
                    </div>
                  </div>
                  
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "Slot Duration" : "مدة الفترة"}</label>
                    <div className="flex h-8 rounded-md border border-slate-200 overflow-hidden bg-slate-50">
                       <button onClick={() => setDuration(Math.max(5, duration - 5))} className="w-8 flex items-center justify-center hover:bg-slate-100 transition-colors">
                         <Minus className="h-3 w-3 text-slate-500" />
                       </button>
                       <div className="flex-1 flex items-center justify-center font-bold text-xs text-slate-700">
                         {duration} <span className="text-[8px] ml-1 uppercase opacity-50">Min</span>
                       </div>
                       <button onClick={() => setDuration(duration + 5)} className="w-8 flex items-center justify-center hover:bg-slate-100 transition-colors border-l border-slate-100">
                         <Plus className="h-3 w-3 text-slate-500" />
                       </button>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "Start Time" : "وقت البدء"}</label>
                    <Input 
                      type="time" 
                      value={startTime}
                      onChange={(e) => {
                          const val = e.target.value;
                          setStartTime(val);
                          // Time check
                          if (val && endTime && val >= endTime) {
                               setTimeError(language === "EN" ? "Start time must be before end time" : "يجب أن يكون وقت البدء قبل وقت الانتهاء");
                          } else {
                               setTimeError("");
                          }
                      }}
                      className={`h-8 bg-slate-50 border-slate-200 text-xs px-2 ${timeError ? "border-red-500" : ""}`} 
                    />
                  </div>
                  
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "End Time" : "وقت الانتهاء"}</label>
                     <Input 
                      type="time" 
                      value={endTime}
                      onChange={(e) => {
                          const val = e.target.value;
                          setEndTime(val);
                          if (startTime && val <= startTime) {
                              setTimeError(language === "EN" ? "End time must be after start time" : "يجب أن يكون وقت الانتهاء بعد وقت البدء");
                          } else {
                              setTimeError("");
                          }
                      }}
                      className={`h-8 bg-slate-50 border-slate-200 text-xs px-2 ${timeError ? "border-red-500" : ""}`} 
                    />
                  </div>
                  {timeError && (
                      <div className="col-span-2 text-[10px] text-red-500 font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {timeError}
                      </div>
                  )}
                </div>
              </div>

              <LoadingButton 
                onClick={handleCreateClick} 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-900/20 h-10 text-xs font-bold tracking-wide uppercase"
                isLoading={isSubmitting}
                disabled={!selectedBranch || !fromDate || !toDate}
              >
                {language === "EN" ? "Create Slots" : "إنشاء الفترات"}
              </LoadingButton>
            </div>
          </Card>
        </div>

        {/* Right Calendar Panel (3/5) */}
        <div className="lg:col-span-7">
           <AppointmentWeeklyView 
              branchID={selectedBranch} 
              refreshTrigger={refreshTrigger}
              dateRange={{ from: fromDate, to: toDate }}
              onDateSelect={handleDateSelect}
           />
        </div>
      </div>
      
      {/* Confirm existing slots modal */}
      <ResponsiveModal open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <ResponsiveModalContent side="bottom">
              <ResponsiveModalHeader>
                  <ResponsiveModalTitle>{language === "EN" ? "Existing Slots Found" : "تم العثور على فترات موجودة"}</ResponsiveModalTitle>
                  <ResponsiveModalDescription>
                      {language === "EN" 
                       ? "Are you sure you want to overwrite existing slots for the selected date range?" 
                       : "هل أنت متأكد أنك تريد استبدال الفترات الزمنية الموجودة للنطاق الزمني المحدد؟"}
                  </ResponsiveModalDescription>
              </ResponsiveModalHeader>
              <ResponsiveModalFooter className="flex-row gap-3 sm:justify-end">
                  <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="flex-1 sm:flex-none sm:w-auto">
                      {language === "EN" ? "Cancel" : "إلغاء"}
                  </Button>
                  <LoadingButton onClick={performCreate} isLoading={isSubmitting} className="flex-1 sm:flex-none sm:w-auto">
                      {language === "EN" ? "Yes, Overwrite" : "نعم، استبدل"}
                  </LoadingButton>
              </ResponsiveModalFooter>
          </ResponsiveModalContent>
      </ResponsiveModal>
      
      {/* Holidays not defined modal */}
      <ResponsiveModal open={showHolidayModal} onOpenChange={setShowHolidayModal}>
          <ResponsiveModalContent side="bottom">
              <ResponsiveModalHeader>
                  <ResponsiveModalTitle className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-5 w-5" />
                      {language === "EN" ? "Configuration Required" : "مطلوب تكوين"}
                  </ResponsiveModalTitle>
                  <ResponsiveModalDescription>
                      {language === "EN" 
                       ? "Holidays are not defined for the selected year(s). Please configure the holiday calendar first." 
                       : "العطلات غير محددة للسنة (السنوات) المحددة. يرجى تكوين تقويم العطلات أولاً."}
                  </ResponsiveModalDescription>
              </ResponsiveModalHeader>
              <ResponsiveModalFooter className="flex-row">
                  <Button onClick={() => setShowHolidayModal(false)} className="flex-1 sm:flex-none sm:w-auto">
                      {language === "EN" ? "Close" : "إإغلاق"}
                  </Button>
              </ResponsiveModalFooter>
          </ResponsiveModalContent>
      </ResponsiveModal>
    </div>
  )
}
