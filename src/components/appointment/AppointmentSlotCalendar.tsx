"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { appointmentService } from "@/services/appointment.service"
import { AppointmentSlot, AppointmentMonthCalendar } from "@/types/appointment.types"
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  Users,
  Loader2,
  CalendarCheck
} from "lucide-react"
import { format, addMonths, subMonths, isSameMonth, isToday, startOfMonth, endOfMonth, isSameDay } from "date-fns"
import { toast } from "sonner"

interface AppointmentSlotCalendarProps {
  onDateSelect: (date: string) => void
}

export default function AppointmentSlotCalendar({ onDateSelect }: AppointmentSlotCalendarProps) {
  const { language } = useLanguage()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [monthCalendar, setMonthCalendar] = useState<AppointmentMonthCalendar | null>(null)
  
  // Master data
  const [governorates, setGovernorates] = useState<any[]>([])
  const [wilayats, setWilayats] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  
  // Selection
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>("1")
  const [selectedWilayat, setSelectedWilayat] = useState<string>("1")
  const [selectedBranch, setSelectedBranch] = useState<string>("1")

  useEffect(() => {
    loadMasterData()
  }, [])

  useEffect(() => {
    if (selectedBranch && selectedBranch !== "") {
      fetchSlots()
    } else {
      setMonthCalendar(null)
    }
  }, [currentDate, selectedBranch])

  const loadMasterData = async () => {
    try {
      const data = await appointmentService.getMasterData()
      setGovernorates(data.Governorates || [])
      setWilayats(data.Wilayats || [])
      setBranches(data.Table || [])
    } catch (error) {
       // toast.error("Failed to load master data")
    }
  }

  const fetchSlots = async () => {
    setIsLoading(true)
    try {
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()
      const response = await appointmentService.getInternalSlots(month, year, selectedBranch)
      const calendar = appointmentService.buildMonthCalendar(response.slots, month, year)
      setMonthCalendar(calendar)
    } catch (error) {
      toast.error(language === "EN" ? "Failed to fetch slots" : "فشل في جلب الفترات")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const handleToday = () => setCurrentDate(new Date())

  const getDayStatus = (slots: AppointmentSlot[]) => {
    if (slots.length === 0) return "empty"
    const hasAvailability = slots.some(s => s.bookedCount < s.capacity)
    return hasAvailability ? "available" : "full"
  }

  return (
    <Card className="border-none shadow-xl bg-white overflow-hidden">
      <CardHeader className="bg-[#1F4E58] text-white p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <CalendarCheck className="h-7 w-7 text-white" />
              </div>
              {language === "EN" ? "Slot Calendar" : "تقويم الفترات"}
            </CardTitle>
            <CardDescription className="text-teal-50/80 text-lg">
              {language === "EN" ? "Manage and view available appointment slots" : "إدارة وعرض فترات المواعيد المتاحة"}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 p-1.5 rounded-xl backdrop-blur-sm">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="text-white hover:bg-white/20 h-10 w-10">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="px-6 font-bold text-xl min-w-[180px] text-center">
              {format(currentDate, "MMMM yyyy")}
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="text-white hover:bg-white/20 h-10 w-10">
              <ChevronRight className="h-6 w-6" />
            </Button>
            <div className="w-[1px] h-6 bg-white/20 mx-1" />
            <Button variant="ghost" onClick={handleToday} className="text-white hover:bg-white/20 font-semibold px-4">
              {language === "EN" ? "Today" : "اليوم"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="space-y-1.5">
               <label className="text-xs font-bold uppercase tracking-wider text-teal-100/70">{language === "EN" ? "Governorate" : "المحافظة"}</label>
               <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Muscat</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold uppercase tracking-wider text-teal-100/70">{language === "EN" ? "Wilayat" : "الولاية"}</label>
               <Select value={selectedWilayat} onValueChange={setSelectedWilayat}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Bousher</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold uppercase tracking-wider text-teal-100/70">{language === "EN" ? "Branch" : "الفرع"}</label>
               <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => (
                      <SelectItem key={b.BranchID} value={b.BranchID.toString()}>
                        {language === "EN" ? b.BranchNameEN : b.BranchNameAR}
                      </SelectItem>
                    ))}
                  </SelectContent>
               </Select>
            </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-xl">
              <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
              <p className="font-semibold text-slate-600">{language === "EN" ? "Refreshing Calendar..." : "جاري تحديث التقويم..."}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="py-4 text-center text-sm font-bold text-slate-400 uppercase tracking-widest">
              {language === "EN" ? day : day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthCalendar?.days.map((day, idx) => {
            const dayDate = new Date(day.date)
            const isCurrentMonth = isSameMonth(dayDate, currentDate)
            const isTodayDate = isToday(dayDate)
            const status = getDayStatus(day.slots)

            return (
              <div
                key={`${day.date}-${idx}`}
                className={`min-h-[160px] p-2 border-r border-b border-slate-100 last:border-r-0 flex flex-col gap-2 transition-all duration-300 relative group ${
                  !isCurrentMonth ? "bg-slate-50/40 text-slate-300" : "bg-white"
                } ${isTodayDate ? "ring-2 ring-inset ring-teal-500/20" : ""}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-lg font-bold w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
                    isTodayDate ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20" : 
                    isCurrentMonth ? "text-slate-700 group-hover:bg-slate-100" : "text-slate-300"
                  }`}>
                    {format(dayDate, "d")}
                  </span>
                  
                  {isCurrentMonth && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-9 w-9 text-teal-600 hover:bg-teal-50 rounded-xl transition-all hover:scale-110"
                      onClick={() => onDateSelect(day.date)}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 overflow-hidden pb-2">
                  {day.slots.slice(0, 3).map((slot, sIdx) => (
                    <div 
                      key={sIdx}
                      className={`text-[11px] p-2 rounded-lg border flex flex-col gap-0.5 shadow-sm transition-transform hover:scale-[1.02] cursor-pointer ${
                        slot.bookedCount >= slot.capacity 
                          ? "bg-amber-50 border-amber-100 text-amber-700" 
                          : "bg-teal-50 border-teal-100 text-teal-700"
                      }`}
                      onClick={() => onDateSelect(day.date)}
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <Clock className="h-3 w-3" />
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="flex items-center gap-1 opacity-80">
                        <Users className="h-2.5 w-2.5" />
                        {slot.bookedCount} / {slot.capacity}
                      </div>
                    </div>
                  ))}
                  {day.slots.length > 3 && (
                    <div className="text-[10px] text-center font-bold text-slate-400 py-1 bg-slate-50 rounded-lg mt-1 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                      + {day.slots.length - 3} {language === "EN" ? "more slots" : "فترات إضافية"}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>

      <div className="p-8 bg-slate-50 border-t border-slate-100">
        <div className="flex flex-wrap gap-8 items-center justify-center font-semibold text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg bg-white border border-slate-200 shadow-sm" />
            <span>{language === "EN" ? "Available" : "متاح"}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg bg-teal-50 border border-teal-100 shadow-sm" />
            <span>{language === "EN" ? "Has Slots" : "به فترات"}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg bg-amber-50 border border-amber-100 shadow-sm" />
            <span>{language === "EN" ? "Partially Full" : "ممتلئ جزئياً"}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
