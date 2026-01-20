"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { appointmentService } from "@/services/appointment.service"
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
  CheckCircle2
} from "lucide-react"
import { toast } from "sonner"
import { format, addDays } from "date-fns"

export default function AppointmentSlotCreation() {
  const { language } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Master data
  const [governorates, setGovernorates] = useState<any[]>([])
  const [wilayats, setWilayats] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])

  // Form state
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>("")
  const [selectedWilayat, setSelectedWilayat] = useState<string>("")
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const [counter, setCounter] = useState(1)
  const [duration, setDuration] = useState(15)
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("14:00")

  useEffect(() => {
    loadMasterData()
  }, [])

  const loadMasterData = async () => {
    try {
      console.log('AppointmentSlotCreation: Loading master data...');
      setIsLoading(true)
      const data = await appointmentService.getMasterData()
      console.log('AppointmentSlotCreation: Master data received:', data);
      
      const govs = data.Governorates || data.Governorate || [];
      const wils = data.Wilayats || data.Wilayat || [];
      const brs = data.Table || data.Branch || [];

      console.log(`AppointmentSlotCreation: Counts -> Govs: ${govs.length}, Wils: ${wils.length}, Brs: ${brs.length}`);
      
      setGovernorates(govs)
      setWilayats(wils)
      setBranches(brs)
    } catch (error) {
      console.error('AppointmentSlotCreation: Error loading master data:', error);
      toast.error("Failed to load reference data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!fromDate || !toDate || !selectedBranch || !startTime || !endTime) {
      toast.error(language === "EN" ? "Please fill all required fields" : "يرجى ملء جميع الحقول المطلوبة")
      return
    }

    setIsSubmitting(true)
    try {
      // Use the specialized admin creation endpoint discovered in research
      const payload = {
        governorateID: selectedGovernorate,
        wilayatID: selectedWilayat,
        branchID: selectedBranch,
        timeSlotDurationID: "1", // This would normally be a selective from master data, using 1 as mapped to ID
        timeSlotStart: startTime, 
        timeSlotEnd: endTime,
        startDate: fromDate,
        endDate: toDate,
        internalUserID: "1", // Default for now
        noOfAppointmentPerSlot: counter.toString(),
        lang: language
      }

      console.log('AppointmentSlotCreation: Creating slots via admin endpoint...', payload);

      const response = await appointmentService.createSlotsByAdmin(payload)
      
      // Legacy API returns IsBlock: 0 on success for this endpoint
      if (response && (response.IsBlock === 0 || response.StatusCode === 605 || response.IsSuccess === 1)) {
        toast.success(language === "EN" ? "Slots created successfully" : "تم إنشاء الفترات بنجاح")
        setRefreshTrigger(prev => prev + 1)
        // Reset range fields after success
        // setFromDate("")
        // setToDate("")
      } else {
        toast.error(response?.ErrorMessage || response?.Message || "Failed to create slots")
      }
    } catch (error) {
      console.error('AppointmentSlotCreation: Error during slot creation:', error);
      toast.error("An error occurred while creating slots")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 bg-[#F8FAFC] overflow-x-hidden min-h-screen">
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
                      onChange={(e) => setFromDate(e.target.value)}
                      className="h-8 bg-slate-50 border-slate-200 text-xs px-2 shadow-none" 
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "To Date" : "إلى تاريخ"}</label>
                    <Input 
                      type="date" 
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="h-8 bg-slate-50 border-slate-200 text-xs px-2 shadow-none" 
                    />
                  </div>
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
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-8 bg-slate-50 border-slate-200 text-xs px-2" 
                    />
                  </div>
                  
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "End Time" : "وقت الانتهاء"}</label>
                     <Input 
                      type="time" 
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="h-8 bg-slate-50 border-slate-200 text-xs px-2" 
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCreate} 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-900/20 h-10 text-xs font-bold tracking-wide uppercase"
                disabled={isSubmitting || !selectedBranch || !fromDate || !toDate}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "EN" ? "Create Slots" : "إنشاء الفترات")}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Calendar Panel (3/5) */}
        <div className="lg:col-span-7">
           <AppointmentWeeklyView 
              branchID={selectedBranch} 
              refreshTrigger={refreshTrigger}
              dateRange={{ from: fromDate, to: toDate }}
           />
        </div>
      </div>
    </div>
  )
}
