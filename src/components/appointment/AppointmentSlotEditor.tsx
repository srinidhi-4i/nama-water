"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { appointmentService } from "@/services/appointment.service"
import { AppointmentSlot } from "@/types/appointment.types"
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  X, 
  Clock, 
  Users, 
  Timer,
  LayoutGrid,
  Loader2,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface AppointmentSlotEditorProps {
  selectedDate: string
  onBack: () => void
}

export default function AppointmentSlotEditor({ selectedDate, onBack }: AppointmentSlotEditorProps) {
  const { language } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [slots, setSlots] = useState<any[]>([])
  
  // Slot defaults
  const [duration, setDuration] = useState("30")
  const [counter, setCounter] = useState("1")
  const [capacity, setCapacity] = useState("5")

  useEffect(() => {
    fetchSlotsForDate()
  }, [selectedDate])

  const fetchSlotsForDate = async () => {
    setIsLoading(true)
    try {
      const date = new Date(selectedDate)
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      const response = await appointmentService.getInternalSlots(month, year)
      
      const dateSlots = response.slots.filter(s => s.date === selectedDate)
      if (dateSlots.length > 0) {
        setSlots(dateSlots.map(s => ({
          ...s,
          isExisting: true
        })))
        // Use first slot's duration and capacity as template
        setDuration(dateSlots[0].duration?.toString() || "30")
        setCapacity(dateSlots[0].capacity?.toString() || "5")
      } else {
        setSlots([{
          startTime: "08:00",
          endTime: "08:30",
          capacity: parseInt(capacity),
          isNew: true
        }])
      }
    } catch (error) {
      toast.error(language === "EN" ? "Failed to load slots" : "فشل في تحميل الفترات")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSlot = () => {
    const lastSlot = slots[slots.length - 1]
    let newStartTime = "08:00"
    let newEndTime = "08:30"

    if (lastSlot) {
      newStartTime = lastSlot.endTime
      const [hours, minutes] = lastSlot.endTime.split(":").map(Number)
      const endTotalMinutes = hours * 60 + minutes + parseInt(duration)
      const endHours = Math.floor(endTotalMinutes / 60)
      const endMinutes = endTotalMinutes % 60
      newEndTime = `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`
    }

    setSlots([...slots, {
      startTime: newStartTime,
      endTime: newEndTime,
      capacity: parseInt(capacity),
      isNew: true
    }])
  }

  const handleRemoveSlot = (index: number) => {
    const newSlots = [...slots]
    if (newSlots[index].isExisting) {
      newSlots[index].isDeleted = true
    } else {
      newSlots.splice(index, 1)
    }
    setSlots(newSlots)
  }

  const updateSlotField = (index: number, field: string, value: any) => {
    const newSlots = [...slots]
    newSlots[index][field] = value
    
    // If start time or duration changed, update end time
    if (field === "startTime") {
       const [hours, minutes] = value.split(":").map(Number)
       const endTotalMinutes = hours * 60 + minutes + parseInt(duration)
       const endHours = Math.floor(endTotalMinutes / 60)
       const endMinutes = endTotalMinutes % 60
       newSlots[index].endTime = `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`
    }
    
    setSlots(newSlots)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const jsonSlots = slots.map(s => ({
        SlotID: s.id || "",
        SlotDuration: duration,
        MaximumVisitors: s.capacity.toString(),
        StartTime: s.startTime,
        EndTime: s.endTime,
        IsDeleted: s.isDeleted ? "1" : "0",
        Reason: ""
      }))

      const payload = [{
        SlotDate: selectedDate,
        SlotCount: counter,
        Slots: jsonSlots
      }]

      const result = await appointmentService.updateSlot(payload)
      if (result.StatusCode === 605) {
        toast.success(language === "EN" ? "Slots updated successfully" : "تم تحديث الفترات بنجاح")
        onBack()
      } else {
        toast.error(result.Message || (language === "EN" ? "Failed to save slots" : "فشل في حفظ الفترات"))
      }
    } catch (error) {
      toast.error(language === "EN" ? "An error occurred" : "حدث خطأ ما")
    } finally {
      setIsSaving(false)
    }
  }

  const visibleSlots = slots.filter(s => !s.isDeleted)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-12 w-12 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-teal-600 transition-all">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              {format(new Date(selectedDate), "EEEE, dd MMMM yyyy")}
            </h2>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" />
              {language === "EN" ? "Define time slots for this date" : "تحديد فترات زمنية لهذا التاريخ"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
            onClick={onBack}
          >
            {language === "EN" ? "Cancel" : "إلغاء"}
          </Button>
          <Button 
            className="h-12 px-8 rounded-xl bg-[#1F4E58] hover:bg-[#163a42] text-white font-bold shadow-lg shadow-teal-900/10 transition-all"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {language === "EN" ? "Saving..." : "جاري الحفظ..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                {language === "EN" ? "Save Changes" : "حفظ التغييرات"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 border-none shadow-sm h-fit sticky top-6">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-teal-600" />
              {language === "EN" ? "Config Settings" : "إعدادات التكوين"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Timer className="h-3.5 w-3.5" />
                {language === "EN" ? "Default Duration (Min)" : "المدة الافتراضية (دقيقة)"}
              </label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 Minutes</SelectItem>
                  <SelectItem value="30">30 Minutes</SelectItem>
                  <SelectItem value="45">45 Minutes</SelectItem>
                  <SelectItem value="60">1 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                {language === "EN" ? "Default Capacity" : "السعة الافتراضية"}
              </label>
              <Input 
                type="number" 
                value={capacity} 
                onChange={(e) => setCapacity(e.target.value)}
                className="h-11 bg-slate-50 border-slate-200"
              />
            </div>

            <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 flex gap-3">
              <AlertCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
              <p className="text-xs text-teal-800 leading-relaxed font-medium">
                {language === "EN" 
                  ? "Changing these settings will apply to any NEW slots you add below." 
                  : "تغيير هذه الإعدادات سيطبق على أي فترات جديدة تضيفها أدناه."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-white">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-teal-600" />
                {language === "EN" ? "Time Slots" : "الفترات الزمنية"}
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddSlot}
                className="rounded-lg border-teal-200 text-teal-600 hover:bg-teal-50 font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === "EN" ? "Add Slot" : "إضافة فترة"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {visibleSlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                   <Clock className="h-16 w-16 mb-4 opacity-10" />
                   <p className="font-semibold">{language === "EN" ? "No slots defined for this date" : "لا يوجد فترات محددة لهذا التاريخ"}</p>
                   <Button variant="link" onClick={handleAddSlot} className="text-teal-600 font-bold">
                     {language === "EN" ? "Add your first slot" : "أضف فترتك الأولى"}
                   </Button>
                </div>
              ) : (
                visibleSlots.map((slot, index) => (
                  <div 
                    key={index} 
                    className="group flex flex-col md:flex-row gap-6 p-6 rounded-2xl border border-slate-100 bg-white hover:border-teal-100 hover:shadow-md transition-all duration-300 items-start md:items-center relative"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{language === "EN" ? "Start Time" : "وقت البدء"}</label>
                          <Input 
                            type="time" 
                            value={slot.startTime} 
                            onChange={(e) => updateSlotField(index, "startTime", e.target.value)}
                            className="h-11 bg-slate-50 border-slate-100 focus:bg-white transition-colors"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{language === "EN" ? "End Time" : "وقت الانتهاء"}</label>
                          <Input 
                            type="time" 
                            value={slot.endTime} 
                            disabled
                            className="h-11 bg-slate-100 border-slate-100 text-slate-500 cursor-not-allowed"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{language === "EN" ? "Capacity" : "السعة"}</label>
                          <div className="relative">
                            <Input 
                              type="number" 
                              value={slot.capacity} 
                              onChange={(e) => updateSlotField(index, "capacity", parseInt(e.target.value))}
                              className="h-11 bg-slate-50 border-slate-100 focus:bg-white pl-9 transition-colors"
                            />
                            <Users className="h-4 w-4 text-slate-300 absolute left-3 top-3.5" />
                          </div>
                       </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-3 -top-3 md:relative md:top-0 md:right-0 bg-white border border-slate-100 shadow-sm text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all rounded-xl opacity-0 group-hover:opacity-100"
                      onClick={() => handleRemoveSlot(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            
            {visibleSlots.length > 0 && (
              <Button 
                variant="ghost" 
                className="w-full mt-6 h-14 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-100 transition-all font-bold"
                onClick={handleAddSlot}
              >
                <Plus className="mr-2 h-5 w-5" />
                {language === "EN" ? "Add Another Slot" : "إضافة فترة أخرى"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
