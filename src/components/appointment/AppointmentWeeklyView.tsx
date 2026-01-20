"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { Button } from "@/components/ui/button"
import { appointmentService } from "@/services/appointment.service"
import { AppointmentSlot } from "@/types/appointment.types"
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Clock,
  Users
} from "lucide-react"
import { format, addWeeks, subWeeks, startOfWeek, addDays, isToday, isSameDay } from "date-fns"
import { toast } from "sonner"

interface AppointmentWeeklyViewProps {
  branchID: string
  refreshTrigger?: number
  dateRange?: { from: string; to: string }
}

export default function AppointmentWeeklyView({ branchID, refreshTrigger, dateRange }: AppointmentWeeklyViewProps) {
  const { language } = useLanguage()
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 })) // Start on Sunday
  const [isLoading, setIsLoading] = useState(false)
  const [slots, setSlots] = useState<AppointmentSlot[]>([])

  useEffect(() => {
    if (dateRange?.from) {
        setCurrentWeekStart(startOfWeek(new Date(dateRange.from), { weekStartsOn: 0 }))
    }
  }, [dateRange?.from])

  useEffect(() => {
    if (branchID && branchID !== "") {
        fetchSlots()
    } else {
        setSlots([])
    }
  }, [currentWeekStart, branchID, refreshTrigger])

  const fetchSlots = async () => {
    setIsLoading(true)
    try {
      // We'll fetch slots for the current month/year of the week start
      // Note: The API might return slots for the whole month, we filter here
      const month = currentWeekStart.getMonth() + 1
      const year = currentWeekStart.getFullYear()
      const response = await appointmentService.getInternalSlots(month, year, branchID)
      setSlots(response.slots)
    } catch (error) {
      // toast.error(language === "EN" ? "Failed to fetch slots" : "فشل في جلب الفترات")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1))
  const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1))

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  const getSlotsForDay = (date: Date) => {
    return slots.filter(slot => isSameDay(new Date(slot.date), date))
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-50">
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="h-8 w-8 text-slate-400">
             <ChevronLeft className="h-5 w-5" />
           </Button>
           <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8 text-slate-400">
             <ChevronRight className="h-5 w-5" />
           </Button>
           <h3 className="ml-4 font-bold text-slate-700">
             {format(currentWeekStart, "MMMM yyyy")}
           </h3>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <div className="grid grid-cols-7 min-w-[1200px] h-full">
          {weekDays.map((day, idx) => {
            const daySlots = getSlotsForDay(day)
            const isTodayDay = isToday(day)
            
            return (
              <div key={idx} className={`border-r border-slate-100 flex flex-col min-h-[400px] ${isTodayDay ? "bg-teal-50/20" : ""}`}>
                <div className={`p-2 border-b border-slate-50 text-center ${isTodayDay ? "bg-teal-500 text-white" : ""}`}>
                  <div className="text-xl font-black">{format(day, "d")}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${isTodayDay ? "text-white/80" : "text-slate-400"}`}>
                    {format(day, "EEEE")}
                  </div>
                </div>
                
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {isLoading ? (
                    idx === 3 && (
                      <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )
                  ) : daySlots.length > 0 ? (
                    daySlots.map((slot, sIdx) => (
                      <div 
                        key={sIdx}
                        className={`p-3 rounded-lg border text-xs shadow-sm transition-all hover:scale-[1.02] ${
                          slot.bookedCount >= slot.capacity 
                            ? "bg-amber-50 border-amber-100 text-amber-700" 
                            : "bg-teal-50 border-teal-100 text-teal-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          <Clock className="h-3 w-3" />
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div className="flex items-center gap-1.5 opacity-80">
                          <Users className="h-3 w-3" />
                          {slot.bookedCount} / {slot.capacity}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center">
                       <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Slots</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Horizontal Scroll Indicator for responsiveness */}
      <div className="p-1 bg-slate-50 border-t border-slate-100 flex justify-center">
        <div className="w-20 h-1 bg-slate-200 rounded-full" />
      </div>
    </div>
  )
}
