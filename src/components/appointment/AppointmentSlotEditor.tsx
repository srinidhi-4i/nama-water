"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { appointmentService } from "@/services/appointment.service"
import { authService } from "@/services/auth.service"
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Minus,
  Loader2,
  Clock,
  CheckSquare
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface AppointmentSlotEditorProps {
  selectedDate: string
  branchID: string
  onBack: () => void
  timeSlotDurations: any[]
}

interface EditorSlot {
  id?: string
  startTime: string
  endTime: string
  capacity: number
  duration: number
  isExisting: boolean
  isDeleted?: boolean 
  isModified?: boolean
}

export default function AppointmentSlotEditor({ selectedDate, branchID, onBack, timeSlotDurations = [] }: AppointmentSlotEditorProps) {
  const { language } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [slots, setSlots] = useState<EditorSlot[]>([])
  
  // Selection State
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])

  // Bulk Edit Controls (Right Panel)
  const [bulkDisable, setBulkDisable] = useState(false)
  const [bulkDurationEnabled, setBulkDurationEnabled] = useState(false)
  
  // Initialize bulk duration with the first available option or 15 as fallback
  const [bulkDuration, setBulkDuration] = useState(
      timeSlotDurations.length > 0 ? parseInt(timeSlotDurations[0].Duration) : 15
  )
  
  const [bulkCountersEnabled, setBulkCountersEnabled] = useState(false)
  const [bulkCounters, setBulkCounters] = useState(1)

  // Add New Slots Controls (Bottom Panel)
  const [addSlotsMode, setAddSlotsMode] = useState(false)
  const [newStartTime, setNewStartTime] = useState("")
  const [newEndTime, setNewEndTime] = useState("")

  useEffect(() => {
    fetchSlotsForDate()
  }, [selectedDate, branchID])

  const getDurationID = (mins: number) => {
    const found = timeSlotDurations.find((d: any) => (d.Duration == mins || d.Name == mins.toString()));
    return found ? found.ID?.toString() : "1"; 
  }

  const fetchSlotsForDate = async () => {
    setIsLoading(true)
    try {
      const response = await appointmentService.getSlotsForEditor(branchID, selectedDate)
      
      const mappedSlots: EditorSlot[] = response.slots.map((s: any) => ({
        id: s.BranchWiseSlotID?.toString(),
        startTime: convertTo24Hour(s.TimeSlotStart) || s.TimeSlotStart,
        endTime: s.TimeSlotEnd || "", 
        capacity: parseInt(s.TotalAppointmentsForSlot || '0'),
        duration: parseInt(s.TilmeSlotDuration || '30'), 
        isExisting: true,
        isModified: false,
        isDeleted: s.IsActive === false || s.IsDeleted === true
      }))

      mappedSlots.sort((a, b) => a.startTime.localeCompare(b.startTime))
      setSlots(mappedSlots)
      setSelectedIndices([]) 
    } catch (error) {
      toast.error(language === "EN" ? "Failed to load slots" : "فشل في تحميل الفترات")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const convertTo24Hour = (timeStr: string) => {
    if (!timeStr) return ""
    const [time, modifier] = timeStr.split(' ');
    if (!modifier) return timeStr; 
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
    return `${hours}:${minutes}`;
  }

  const convertTo12Hour = (timeStr: string) => {
    if (!timeStr) return ""
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }

  // --- Selection Logic ---

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIndices(slots.map((_, i) => i))
    } else {
      setSelectedIndices([])
    }
  }

  const handleSelectSlot = (index: number, checked: boolean) => {
    if (checked) {
      setSelectedIndices(prev => [...prev, index])
    } else {
      setSelectedIndices(prev => prev.filter(i => i !== index))
    }
  }

  const isAllSelected = slots.length > 0 && selectedIndices.length === slots.length

  // --- Bulk Actions Logic ---

  useEffect(() => {
     if (selectedIndices.length === 0) return;
     // Note: We might want to separate "setting bulk control" from "applying"
     // But for "Disable", immediate application is common with checkbox UI.
  }, [bulkDisable])

  const applyBulkDisable = (checked: boolean) => {
    setBulkDisable(checked)
    if (selectedIndices.length === 0) return;
    
    setSlots(prev => prev.map((slot, idx) => {
       if (selectedIndices.includes(idx)) {
           return { ...slot, isDeleted: checked, isModified: true }
       }
       return slot
    }))
  }

  const applyBulkDuration = (value: number) => {
      setBulkDuration(value)
      if (!bulkDurationEnabled || selectedIndices.length === 0) return;
      
      setSlots(prev => prev.map((slot, idx) => {
         if (selectedIndices.includes(idx)) {
             return { ...slot, duration: value, isModified: true }
         }
         return slot
      }))
  }

  const applyBulkCounters = (value: number) => {
      setBulkCounters(value)
      if (!bulkCountersEnabled || selectedIndices.length === 0) return;

      setSlots(prev => prev.map((slot, idx) => {
         if (selectedIndices.includes(idx)) {
             return { ...slot, capacity: value, isModified: true }
         }
         return slot
      }))
  }
  
  const toggleBulkDuration = (checked: boolean) => {
      setBulkDurationEnabled(checked)
      if (checked && selectedIndices.length > 0) {
          applyBulkDuration(bulkDuration) 
      }
  }

  const toggleBulkCounters = (checked: boolean) => {
      setBulkCountersEnabled(checked)
      if (checked && selectedIndices.length > 0) {
          applyBulkCounters(bulkCounters) 
      }
  }

  const handleDisableAllForDay = (checked: boolean) => {
      setSlots(prev => prev.map(s => ({ ...s, isDeleted: checked, isModified: true })))
  }




  const handleAddStartEndSlots = () => {
      if (!newStartTime || !newEndTime) {
          toast.error(language === "EN" ? "Please select start and end time" : "يرجى اختيار وقت البدء والانتهاء");
          return;
      }
      
      if (!bulkDuration || !bulkCounters) {
          toast.error(language === "EN" ? "Please set duration and counters" : "يرجى تحديد المدة والعدادات");
          return;
      }

      const generated: EditorSlot[] = []
      const [startH, startM] = newStartTime.split(':').map(Number)
      const [endH, endM] = newEndTime.split(':').map(Number)
      
      let currentMin = startH * 60 + startM
      const endMin = endH * 60 + endM

      while (currentMin + bulkDuration <= endMin) {
          const slotStartH = Math.floor(currentMin / 60)
          const slotStartM = currentMin % 60
          
          const timeString = `${String(slotStartH).padStart(2,'0')}:${String(slotStartM).padStart(2,'0')}`

          generated.push({
              startTime: timeString,
              endTime: "", 
              capacity: bulkCounters,
              duration: bulkDuration,
              isExisting: false,
              isModified: true,
              isDeleted: false
          })

          currentMin += bulkDuration
      }

      setSlots(prev => [...prev, ...generated])
      setAddSlotsMode(false)
      setNewStartTime("")
      setNewEndTime("")
      toast.success(language === "EN" ? `Added ${generated.length} slots` : `تم إضافة ${generated.length} فترة`)
  }


  // --- Save Logic ---
  const handleSave = async () => {
    setIsSaving(true)
    let successCount = 0
    let errorCount = 0

    try {
      const user = authService.getCurrentUser()
      const internalUserID = user?.BranchUserDetails?.[0]?.UserADId || "1"

      // 1. Existing Slots (Updates)
      const modifiedExisting = slots.filter(s => s.isExisting && s.isModified)
      for (const slot of modifiedExisting) {
          try {
              if (slot.isDeleted) {
                   await appointmentService.updateSlot({
                      branchID,
                      fromDate: selectedDate,
                      toDate: selectedDate,
                      branchWiseTimeSlotID: slot.id,
                      startTime: convertTo12Hour(slot.startTime), 
                      isDisable: '1'
                  })
              } else {
                  await appointmentService.updateSlot({
                      branchID,
                      fromDate: selectedDate,
                      toDate: selectedDate,
                      branchWiseTimeSlotID: slot.id,
                      startTime: convertTo12Hour(slot.startTime),
                      noOfCounter: slot.capacity.toString(),
                      slotDuration: slot.duration.toString(), 
                      isDisable: '0'
                  })
              }
              successCount++
          } catch (e) {
              errorCount++
              console.error("Error updating slot", e)
          }
      }

      // 2. New Slots
      const newSlots = slots.filter(s => !s.isExisting)

      for (const slot of newSlots) {
         try {
             const [h, m] = slot.startTime.split(':').map(Number)
             const totalMins = h * 60 + m + slot.duration
             const endH = Math.floor(totalMins / 60)
             const endM = totalMins % 60
             const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`

             const payload = {
                 governorateID: "0", 
                 wilayatID: "0",
                 branchID: branchID,
                 timeSlotDurationID: getDurationID(slot.duration), // Use dynamic ID
                 timeSlotStart: convertTo12Hour(slot.startTime),
                 timeSlotEnd: convertTo12Hour(endTime),
                 startDate: selectedDate,
                 endDate: selectedDate,
                 internalUserID: internalUserID,
                 noOfAppointmentPerSlot: slot.capacity.toString(),
                 lang: "EN"
             }
             
             await appointmentService.createSlotsByAdmin(payload)
             successCount++
         } catch (e) {
             errorCount++
         }
      }

      if (successCount > 0) {
          toast.success(language === "EN" ? "Saved successfully" : "تم الحفظ بنجاح")
          onBack()
      } else if (errorCount > 0) {
          toast.error(language === "EN" ? "Failed to save" : "فشل الحفظ")
      } else {
          onBack()
      }

    } catch (e) {
        toast.error("Error saving")
    } finally {
        setIsSaving(false)
    }
  }


  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
       {/* Header */}
       <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  {branchID}
              </h2>
              <div className="text-xl font-black text-teal-700">
                  {format(new Date(selectedDate), "dd-MMM-yyyy")}
              </div>
          </div>
          
          <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                  {language === "EN" ? "Disable all slots for the day" : "تعطيل جميع الفترات لليوم"}
              </span>
              <Switch 
                  checked={slots.length > 0 && slots.every(s => s.isDeleted)}
                  onCheckedChange={handleDisableAllForDay}
              />
          </div>
       </div>

       <div className="flex flex-1 flex-col lg:flex-row">
           {/* Left Panel: Slot Grid */}
           <div className="flex-1 p-6 border-r border-slate-50 bg-slate-50/10">
               <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-2 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">
                      <CheckSquare className="h-4 w-4 text-teal-600" />
                      <span className="text-xs font-bold text-teal-800">
                          {language === "EN" ? "Edit Time Slot(s)" : "تعديل الفترات"}
                      </span>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                      <Checkbox 
                        id="selectAll" 
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                      />
                      <label htmlFor="selectAll" className="text-xs font-bold text-slate-500 cursor-pointer">
                          {language === "EN" ? "Select All" : "تحديد الكل"}
                      </label>
                  </div>
               </div>

               {/* Slots Grid */}
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {slots.map((slot, idx) => (
                      <div 
                        key={idx}
                        className={`
                           relative p-3 rounded-lg border flex flex-col gap-2 transition-all
                           ${slot.isDeleted ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-teal-300'}
                           ${selectedIndices.includes(idx) ? 'ring-2 ring-teal-500 border-transparent bg-teal-50/50' : ''}
                        `}
                      >
                          <div className="flex justify-between items-start">
                             <Checkbox 
                                checked={selectedIndices.includes(idx)}
                                onCheckedChange={(c) => handleSelectSlot(idx, c as boolean)}
                             />
                             <div className="px-1.5 py-0.5 bg-slate-800 text-white text-[10px] font-bold rounded">
                                 {slot.capacity != null ? `0/${slot.capacity}` : '0/0'} 
                             </div>
                          </div>
                          
                          <div className="font-bold text-sm text-slate-700 mt-1">
                              {convertTo12Hour(slot.startTime)}
                          </div>
                      </div>
                  ))}
               </div>
           </div>

           {/* Right Panel: Bulk Controls */}
           <div className="w-full lg:w-80 p-6 space-y-8 bg-white">
              {/* Disable Control */}
              <div className="flex items-center gap-3">
                  <Checkbox 
                      id="bulkDisable"
                      checked={bulkDisable}
                      onCheckedChange={applyBulkDisable}
                      disabled={selectedIndices.length === 0}
                  />
                  <label htmlFor="bulkDisable" className="text-xs font-bold text-slate-500">
                       {language === "EN" ? "Disable the slot(s)" : "تعطيل الفترات"}
                  </label>
              </div>

              {/* Duration Control */}
              <div className="space-y-2">
                  <div className="flex items-center gap-3">
                     <Checkbox 
                        id="bulkDuration"
                        checked={bulkDurationEnabled}
                        onCheckedChange={toggleBulkDuration}
                        disabled={selectedIndices.length === 0}
                     />
                     <label htmlFor="bulkDuration" className="text-xs font-bold text-slate-500">
                        {language === "EN" ? "Duration" : "المدة"}
                     </label>
                  </div>
                  <div className="flex items-center gap-2 pl-7">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => applyBulkDuration(Math.max(5, bulkDuration - 5))} disabled={!bulkDurationEnabled}>
                          <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-bold w-12 text-center text-slate-600">{bulkDuration} mins</span>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => applyBulkDuration(bulkDuration + 5)} disabled={!bulkDurationEnabled}>
                          <Plus className="h-3 w-3" />
                      </Button>
                  </div>
              </div>

              {/* Counters Control */}
              <div className="space-y-2">
                  <div className="flex items-center gap-3">
                     <Checkbox 
                        id="bulkCounters"
                        checked={bulkCountersEnabled}
                        onCheckedChange={toggleBulkCounters}
                        disabled={selectedIndices.length === 0}
                     />
                     <label htmlFor="bulkCounters" className="text-xs font-bold text-slate-500">
                        {language === "EN" ? "Number of Counter(s)" : "عدد العدادات"}
                     </label>
                  </div>
                  <div className="flex items-center gap-2 pl-7">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => applyBulkCounters(Math.max(1, bulkCounters - 1))} disabled={!bulkCountersEnabled}>
                          <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-bold w-12 text-center text-slate-600">{bulkCounters}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => applyBulkCounters(bulkCounters + 1)} disabled={!bulkCountersEnabled}>
                          <Plus className="h-3 w-3" />
                      </Button>
                  </div>
              </div>
           </div>
       </div>

       {/* Bottom Section: Add Slots */}
       <div className="border-t border-slate-100 p-6 bg-slate-50">
           <div className="flex items-center gap-2 mb-4">
              <Checkbox 
                  id="addSlots" 
                  checked={addSlotsMode}
                  onCheckedChange={(c) => setAddSlotsMode(c as boolean)}
              />
              <label htmlFor="addSlots" className="text-sm font-bold text-slate-700">
                  {language === "EN" ? "Edit Start Time and End Time" : "تعديل وقت البدء والانتهاء"}
              </label>
           </div>

           <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all ${addSlotsMode ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
               <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">{language === "EN" ? "Start Time" : "وقت البدء"}</label>
                   <Input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className="bg-white" />
               </div>
               <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">{language === "EN" ? "End Time" : "وقت الانتهاء"}</label>
                   <Input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} className="bg-white" />
               </div>
               <div className="flex items-end">
                   <Button className="w-full bg-[#9CA3AF] hover:bg-slate-500 text-white font-bold" onClick={handleAddStartEndSlots}>
                       {language === "EN" ? "Add Slots" : "إضافة فترات"}
                   </Button>
               </div>
           </div>
           
           {addSlotsMode && (
               <p className="text-[10px] text-red-400 mt-2 font-medium">
                   {language === "EN" ? "Note: Please select the duration and number of counter(s) for adding slots." : "ملاحظة: يرجى تحديد المدة وعدد العدادات لإضافة الفترات."}
               </p>
           )}
       </div>

       {/* Footer Actions */}
       <div className="p-4 border-t border-slate-100 flex justify-between bg-white">
           <Button variant="outline" onClick={onBack} className="w-32 font-bold border-slate-200">
               <ArrowLeft className="h-4 w-4 mr-2" />
               {language === "EN" ? "Back" : "رجوع"}
           </Button>
           <Button onClick={handleSave} disabled={isSaving} className="w-32 bg-[#1F4E58] hover:bg-[#163a42] text-white font-bold">
               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "EN" ? "Save" : "حفظ")}
           </Button>
       </div>
    </div>
  )
}
