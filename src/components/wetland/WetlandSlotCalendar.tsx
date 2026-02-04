"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { wetlandService } from "@/services/wetland.service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus, Edit2 } from "lucide-react"
import { MonthCalendar } from "@/types/wetland.types"
import { format, addMonths, subMonths, isSameMonth, isToday } from "date-fns"
import { useLanguage } from "@/components/providers/LanguageProvider"
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal"
import { LoadingButton } from "@/components/ui/loading-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface WetlandSlotCalendarProps {
  onDateSelect: (date: string) => void
}

export function WetlandSlotCalendar({ onDateSelect }: WetlandSlotCalendarProps) {
  const { language } = useLanguage()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [monthCalendar, setMonthCalendar] = useState<MonthCalendar | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Form states for new slot
  const [newSlotDate, setNewSlotDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [newSlotStartTime, setNewSlotStartTime] = useState("07:00")
  const [newSlotEndTime, setNewSlotEndTime] = useState("08:00")
  const [newSlotCapacity, setNewSlotCapacity] = useState("25")

  useEffect(() => {
    loadSlots()
  }, [currentDate])

  const loadSlots = async () => {
    setIsLoading(true)
    try {
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()
      console.log('Loading slots for:', { month, year })
      const response = await wetlandService.getSlots(month, year)
      console.log('Slots response received:', response)
      const calendar = wetlandService.buildMonthCalendar(response.slots, month, year)
      setMonthCalendar(calendar)
    } catch (error: any) {
      toast.error(language === "EN" 
        ? `Failed to load slots: ${error.message || 'Unknown error'}` 
        : `فشل في تحميل الفترات: ${error.message || 'خطأ غير معروف'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleCreateSlot = async () => {
    try {
      setIsLoading(true)
      await wetlandService.createSlot({
        date: newSlotDate,
        startTime: newSlotStartTime,
        endTime: newSlotEndTime,
        capacity: parseInt(newSlotCapacity),
      })
      toast.success(language === "EN" ? "Slot created successfully" : "تم إنشاء الفترة بنجاح")
      setIsCreateDialogOpen(false)
      loadSlots()
      
      // Navigate to edit for that day after creation?
      // onDateSelect(newSlotDate)
    } catch (error: any) {
      // Show the actual error message from the API
      const errorMessage = error.message || (language === "EN" ? "Failed to create slot" : "فشل في إنشاء الفترة")
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const dayNames = language === "EN" 
    ? [
        { long: 'Monday', short: 'Mon' },
        { long: 'Tuesday', short: 'Tues' },
        { long: 'Wednesday', short: 'Wed' },
        { long: 'Thursday', short: 'Thurs' },
        { long: 'Friday', short: 'Fri' },
        { long: 'Saturday', short: 'Sat' },
        { long: 'Sunday', short: 'Sun' }
      ]
    : [
        { long: 'الأثنين', short: 'أثنين' },
        { long: 'الثلاثاء', short: 'ثلاثاء' },
        { long: 'الأربعاء', short: 'ربعاء' },
        { long: 'الخميس', short: 'خميس' },
        { long: 'الجمعة', short: 'جمعة' },
        { long: 'السبت', short: 'سبت' },
        { long: 'الأحد', short: 'أحد' }
      ]

  return (
    <div className="px-6 mt-4">
      <div className="max-w-[1600px] mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Calendar Header/Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePreviousMonth} className="text-slate-400 hover:text-teal-600">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="text-slate-400 hover:text-teal-600">
              <ChevronRight className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold text-slate-800 ml-2">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
          </div>

          <ResponsiveModal open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <ResponsiveModalTrigger asChild>
              <Button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm sm:w-auto w-full">
                <Plus className="h-4 w-4 mr-2 text-teal-600" />
                {language === "EN" ? "Create New Slot" : "إنشاء فترة جديدة"}
              </Button>
            </ResponsiveModalTrigger>
            <ResponsiveModalContent side="bottom" className="sm:max-w-[500px]">
              <ResponsiveModalHeader>
                <ResponsiveModalTitle className="text-xl font-bold text-teal-900 border-b pb-4">
                  {language === "EN" ? "Create New Slot" : "إنشاء فترة جديدة"}
                </ResponsiveModalTitle>
              </ResponsiveModalHeader>
              <div className="grid gap-6 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="date" className="sm:text-right font-semibold text-slate-700">
                    {language === "EN" ? "Date" : "التاريخ"}
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={newSlotDate}
                    onChange={(e) => setNewSlotDate(e.target.value)}
                    className="sm:col-span-3 h-11 border-slate-200 focus:ring-teal-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="startTime" className="sm:text-right font-semibold text-slate-700">
                    {language === "EN" ? "Start" : "البدء"}
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newSlotStartTime}
                    onChange={(e) => setNewSlotStartTime(e.target.value)}
                    className="sm:col-span-3 h-11 border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="endTime" className="sm:text-right font-semibold text-slate-700">
                    {language === "EN" ? "End" : "الانتهاء"}
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newSlotEndTime}
                    onChange={(e) => setNewSlotEndTime(e.target.value)}
                    className="sm:col-span-3 h-11 border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="capacity" className="sm:text-right font-semibold text-slate-700">
                    {language === "EN" ? "Capacity" : "السعة"}
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={newSlotCapacity}
                    onChange={(e) => setNewSlotCapacity(e.target.value)}
                    className="sm:col-span-3 h-11 border-slate-200"
                  />
                </div>
              </div>
              <ResponsiveModalFooter className="mt-2">
                <LoadingButton 
                  type="submit" 
                  onClick={handleCreateSlot} 
                  isLoading={isLoading} 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-12 rounded-lg shadow-lg shadow-teal-100"
                >
                  {language === "EN" ? "Save Slot" : "حفظ الفترة"}
                </LoadingButton>
              </ResponsiveModalFooter>
            </ResponsiveModalContent>
          </ResponsiveModal>
        </div>

        {/* Calendar Grid Header */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-100">
          {dayNames.map((day, i) => (
            <div key={i} className="py-3 px-1 sm:px-4 text-sm sm:text-sm font-semibold text-slate-600 border-r border-slate-100 last:border-r-0 text-center uppercase tracking-tighter sm:tracking-normal">
              <span className="hidden lg:inline">{day.long}</span>
              <span className="lg:hidden">{day.short}</span>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-slate-500">{language === "EN" ? "Loading slots..." : "جاري تحميل الفترات..."}</p>
          </div>
        ) : monthCalendar ? (
          <div className="grid grid-cols-7">
            {monthCalendar.days.map((day, idx) => {
              const dayDate = new Date(day.date)
              const isCurrentMonth = isSameMonth(dayDate, currentDate)
              const isTodayDate = isToday(dayDate)
              
              return (
                <div 
                  key={`${day.date}-${idx}`} 
                  className={`min-h-[160px] p-2 border-r border-b border-slate-100 last:border-r-0 flex flex-col gap-2 transition-colors ${
                    !isCurrentMonth ? 'bg-slate-50/30' : ''
                  } ${isTodayDate ? 'bg-teal-50/20' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      !isCurrentMonth ? 'text-slate-300' : isTodayDate ? 'text-teal-600 font-bold' : 'text-slate-600'
                    }`}>
                      {format(dayDate, 'd')}
                      {format(dayDate, 'd') === '1' && (
                        <span className="ml-1 text-[10px] uppercase font-normal">{format(dayDate, 'MMM')}</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[130px] pr-0.5 custom-scrollbar">
                    {day.slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="group relative flex flex-col border border-dashed border-red-200 bg-white rounded-md p-1.5 hover:border-teal-400 hover:bg-teal-50/30 transition-all cursor-pointer shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-1 overflow-hidden">
                            <span className="text-[9px] font-bold text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                              {slot.startTime} to {slot.endTime}
                            </span>
                            <Badge variant="secondary" className="bg-[#1F4E58] text-[8px] text-white hover:bg-[#1F4E58] px-1 h-3.5 rounded-sm shrink-0">
                              {slot.bookedCount}/{slot.capacity}
                            </Badge>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              onDateSelect(day.date) // Call parent handler
                            }}
                            className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-white shadow-md border border-slate-100 rounded-full p-1 text-teal-600 hover:text-teal-700 transition-opacity z-10"
                          >
                            <Edit2 className="h-2 w-2" />
                          </button>
                        </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}
