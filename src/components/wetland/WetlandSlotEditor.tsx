'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Trash2, Plus, Minus, Loader2, X, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { wetlandService } from '@/services/wetland.service'
import { WetlandSlot } from '@/types/wetland.types'
import { useLanguage } from '@/components/providers/LanguageProvider'
import moment from 'moment'
import { AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction, AlertDialog } from '@/components/ui/alert-dialog'

interface SlotData {
  SlotID: string
  SlotDuration: string
  MaximumVisitors: string
  StartTime: string
  EndTime: string
  IsDeleted: string
  Reason: string
  AppoitmentsBooked?: number
}

// Helper component for duration stepper
const DurationStepper = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const intVal = parseInt(value) || 1;
  
  const handleDecrement = () => {
    if (intVal > 1) onChange((intVal - 1).toString())
  }
  
  const handleIncrement = () => {
    if (intVal < 5) onChange((intVal + 1).toString())
  }
  
  return (
    <div className="flex items-center">
      <Button 
        variant="outline" 
        size="icon" 
        className="h-8 w-8 rounded-full border-teal-500 text-teal-600 hover:bg-teal-50"
        onClick={handleDecrement}
        disabled={intVal <= 1}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="mx-2 min-w-[3rem] text-center font-medium">{intVal} hr</span>
      <Button 
        variant="outline" 
        size="icon" 
        className="h-8 w-8 rounded-full border-teal-500 text-teal-600 hover:bg-teal-50"
        onClick={handleIncrement}
        disabled={intVal >= 5}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface WetlandSlotEditorProps {
  date: string
  onBack: () => void
}

export function WetlandSlotEditor({ date, onBack }: WetlandSlotEditorProps) {
  const router = useRouter()
  const { language } = useLanguage()
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(date))
  
  const [monthSlots, setMonthSlots] = useState<WetlandSlot[]>([])
  const [holidays, setHolidays] = useState<any[]>([])
  
  // Current day's slots
  const [slots, setSlots] = useState<SlotData[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  // Track deleted slots that were existing on server
  const [deletedSlots, setDeletedSlots] = useState<SlotData[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Initialize and load data
  useEffect(() => {
    const initialize = async () => {
      try {
        setPageLoading(true)
        const initialDate = new Date(date)
        
        setSelectedDate(initialDate)
        
        // Load data for the month
        await loadMonthData(initialDate)
        
        // Load slots for the specific date
        await loadSlotsForDate(initialDate)
      } catch (error) {
        console.error('Initialization error:', error)
      } finally {
        setPageLoading(false)
      }
    }

    initialize()
  }, [date])

  const loadMonthData = async (date: Date) => {
    try {
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      
      const [slotsResponse, holidaysResponse] = await Promise.all([
        wetlandService.getSlots(month, year),
        wetlandService.getHolidays(year)
      ])
      
      setMonthSlots(slotsResponse.slots)
      setHolidays(holidaysResponse.holidays)
    } catch (error) {
      console.error('Error loading month data:', error)
      toast.error('Failed to load calendar data')
    }
  }

  const loadSlotsForDate = async (date: Date) => {
    try {
      setLoading(true)
      const formattedDate = moment(date).format('YYYY-MM-DD')
      
      const response = await wetlandService.getSlots(date.getMonth() + 1, date.getFullYear())
      
      // Filter slots for the selected date
      const dateSlots = response.slots.filter(
        slot => slot.date === formattedDate
      )

      if (dateSlots.length > 0) {
        // Convert to the format expected by the form
        const formattedSlots: SlotData[] = dateSlots.map((slot: any) => ({
          SlotID: slot.id,
          SlotDuration: slot.duration?.toString() || calculateDuration(slot.startTime, slot.endTime),
          MaximumVisitors: slot.capacity.toString(),
          StartTime: moment(slot.startTime, ['HH:mm', 'hh:mm A']).format('HH:mm'), // Ensure 24h format for input
          EndTime: moment(slot.endTime, ['HH:mm', 'hh:mm A']).format('hh:mm A'), // Display format for read-only
          IsDeleted: '',
          Reason: '',
          AppoitmentsBooked: slot.bookedCount
        }))
        setSlots(formattedSlots)
    } else {
        setSlots([])
    }
    } catch (error) {
      console.error('Error loading slots:', error)
      toast.error('Failed to load slots')
    } finally {
      setLoading(false)
    }
  }

  const calculateDuration = (start: string, end: string) => {
      if (!start || !end) return '1';
      try {
        const startTime = moment(start, 'HH:mm');
        const endTime = moment(end, 'HH:mm');
        const duration = moment.duration(endTime.diff(startTime));
        return Math.max(1, Math.round(duration.asHours())).toString();
      } catch (e) {
          return '1';
      }
  }

  const handleDateSelect = async (date: Date | undefined) => {
    if (date) {
        // Just update local state for UI, logic remains on prop 'date' for fetch?
        // Actually editing a different date requires restart, so maybe re-route?
        // But requested to be single page. 
        // For now, let's allow changing date locally which updates URL via parent wrapper? 
        // No, parent wrapper handles URL. Component should call parent. However prop is 'date'.
        // Let's assume selecting a new date in calendar just navigates/switches view context.
        // WE need a callback to parent to change date?
        // The original logic updated URL.
        const newDateStr = moment(date).format('YYYY-MM-DD')
        // We can use router.replace to update URL, which triggers parent update?
        // Or callback. Let's use router for consistency with parent wrapper logic.
        // Actually, parent passes 'date' prop. We should respect that.
        // If we want to change date, we should change URL.
        const params = new URLSearchParams(window.location.search)
        params.set('date', newDateStr)
        router.replace(`?${params.toString()}`)
    }
  }

  const handleMonthChange = (month: Date) => {
    loadMonthData(month)
  }

  const handleSlotChange = (index: number, field: keyof SlotData, value: string) => {
    const updatedSlots = [...slots]
    updatedSlots[index] = {
      ...updatedSlots[index],
      [field]: value
    }
    
    // Auto-calculate end time
    if (field === 'StartTime' || field === 'SlotDuration') {
      const startTime = field === 'StartTime' ? value : updatedSlots[index].StartTime
      const duration = field === 'SlotDuration' ? parseInt(value) : parseInt(updatedSlots[index].SlotDuration)
      
      if (startTime && duration && !isNaN(duration)) {
        // Handle AM/PM if present, otherwise assume HH:mm
        const format = startTime.toLowerCase().includes('m') ? 'hh:mm A' : 'HH:mm';
        const endTime = moment(startTime, format).add(duration, 'hours').format(format)
        if (endTime !== 'Invalid date') {
            updatedSlots[index].EndTime = endTime
        }
      }
    }
    
    setSlots(updatedSlots)
  }

  const handleAddSlot = () => {
    const lastSlot = slots[slots.length - 1]
    let newStartTime = '07:00'
    
    if (lastSlot && lastSlot.EndTime) {
        // Try to start after the last slot
        // lastSlot.EndTime is likely in 'hh:mm A' format from the render, or 'HH:mm' from input
        const format = lastSlot.EndTime.toLowerCase().includes('m') ? 'hh:mm A' : 'HH:mm';
        const lastEnd = moment(lastSlot.EndTime, format);
        
        if (lastEnd.isValid()) {
            newStartTime = lastEnd.format('HH:mm'); // Ensure 24h format for the input
        }
    }
    
    // Calculate new end time (default 1 hour)
    const newEndTime = moment(newStartTime, 'HH:mm').add(1, 'hours').format('hh:mm A');

    const newSlot: SlotData = {
      SlotID: '0',
      SlotDuration: '1',
      MaximumVisitors: '25',
      StartTime: newStartTime,
      EndTime: newEndTime,
      IsDeleted: '',
      Reason: '',
      AppoitmentsBooked: 0
    }
    
    setSlots([...slots, newSlot])
  }

  const handleRemoveSlot = (index: number) => {
      const currentSlot = slots[index]
       if (currentSlot.AppoitmentsBooked && currentSlot.AppoitmentsBooked! > 0) {
          toast.error('Cannot delete slot with booked appointments')
          return
        }

      const updatedSlots = [...slots]
      updatedSlots.splice(index, 1)
      setSlots(updatedSlots)
      
      if (currentSlot.SlotID && currentSlot.SlotID !== '0') {
          setDeletedSlots([...deletedSlots, { ...currentSlot, IsDeleted: '1' }])
      }
  }

  const confirmDeleteAllSlots = () => {
    const slotsToDelete = slots.filter(s => s.SlotID && s.SlotID !== '0').map(s => ({ ...s, IsDeleted: '1' }))
    const bookedSlots = slots.filter(s => s.AppoitmentsBooked && s.AppoitmentsBooked > 0)
      
    if (bookedSlots.length > 0) {
        toast.error(`Cannot delete all: ${bookedSlots.length} slot(s) have bookings`)
        setIsDeleteDialogOpen(false)
        return
    }
    
    setDeletedSlots([...deletedSlots, ...slotsToDelete])
    setSlots([])
    setIsDeleteDialogOpen(false)
    toast.success('All slots marked for deletion. Click Save to apply.')
  }

  const handleSave = async () => {
    try {
      if (!selectedDate) return
      setLoading(true)
      
      // Combine active slots and deleted slots
      const allSlotsToSubmit = [
          ...slots.map(s => ({ ...s, IsDeleted: '' })),
          ...deletedSlots
      ]

      const slotData = [{
        SlotDate: moment(selectedDate).format('YYYY-MM-DD'),
        SlotCount: allSlotsToSubmit.length,
        Slots: allSlotsToSubmit
      }]

      await wetlandService.updateSlot('', slotData)
      toast.success('Slots updated successfully!')
      
      // Refresh data
      setDeletedSlots([])
      await loadSlotsForDate(selectedDate)
      await loadMonthData(selectedDate) 
      
    } catch (error: any) {
      console.error('Error saving slots:', error)
      toast.error(error.response?.data?.ResponseMessage || error.message || 'Failed to update slots')
    } finally {
      setLoading(false)
    }
  }

  // Calendar Coloring
  const getDayModifiers = (date: Date) => {
    const dateStr = moment(date).format('YYYY-MM-DD')
    
    const isHoliday = holidays.some(h => 
        h.HolidayDate && h.HolidayDate.split('T')[0] === dateStr
    )
    if (isHoliday) return 'holiday'
    
    const daySlots = monthSlots.filter(s => s.date === dateStr)
    if (daySlots.length > 0) {
        const isFull = daySlots.every(s => s.bookedCount >= s.capacity)
        if (isFull) return 'booked'
        return 'available'
    }
    
    return undefined
  }
  
  const modifiers = {
      holiday: (date: Date) => getDayModifiers(date) === 'holiday',
      booked: (date: Date) => getDayModifiers(date) === 'booked',
      available: (date: Date) => getDayModifiers(date) === 'available',
  }

  return (
    <div className="container mx-auto px-4 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Calendar Section - Left Side */}
        <Card className="lg:col-span-4 p-6 h-fit border-none shadow-sm bg-white">
        <div className="mb-6">
            <h3 className="font-semibold text-teal-900 text-lg">Al Ansab Wetland</h3>
            <p className="text-sm text-slate-500 mt-1">Al Ansab Water Treatment Station, Al Ansab St, Muscat, Oman</p>
        </div>
        
        <div className="flex justify-center border-b border-slate-100 pb-6 mb-6">
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                onMonthChange={handleMonthChange}
                className="rounded-lg p-3 bg-white"
                modifiers={modifiers}
                modifiersClassNames={{
                    booked: "bg-teal-50 text-teal-600 font-medium hover:bg-teal-100 rounded-md",
                    available: "text-teal-700 bg-white border border-teal-200 hover:bg-teal-50 rounded-md",
                    holiday: "bg-slate-100 text-slate-400 cursor-not-allowed hover:bg-slate-100 rounded-md",
                    selected: "!bg-teal-600 !text-white hover:!bg-teal-700 shadow-md rounded-md"
                }}
                classNames={{
                    day_selected: "!bg-teal-600 !text-white hover:!bg-teal-700 focus:!bg-teal-600 shadow-md",
                    day_today: "bg-slate-50 font-bold text-slate-900",
                    head_cell: "text-slate-400 font-normal text-[0.8rem]",
                    cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-teal-600/5 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                }}
            />
        </div>

        <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3">Legend</h4>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-50 border border-teal-100 rounded-sm"></div>
                <span className="text-xs text-slate-600 font-medium">Booked</span>
                </div>
                <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white border border-teal-300 rounded-sm"></div>
                <span className="text-xs text-slate-600 font-medium">Available</span>
                </div>
                <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
                <span className="text-xs text-slate-600 font-medium">Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-600 rounded-sm shadow-sm"></div>
                <span className="text-xs text-slate-600 font-medium">Selected</span>
                </div>
            </div>
        </div>
        </Card>

        {/* Slot Editor Section - Right Side */}
        <Card className="lg:col-span-8 p-6 border-none shadow-sm bg-white">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
            <div>
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    {selectedDate ? moment(selectedDate).format('dddd, D MMMM') : 'Select a date'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    {slots.length > 0 ? (
                    <>
                        <span className="font-semibold text-teal-600">{slots.length}</span> Active Slots
                    </>
                    ) : 'No slots configured'}
                </p>
            </div>
            <div className="flex gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={loading || slots.length === 0}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-9 px-3"
                    title="Delete all slots for this date"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All
                </Button>
            </div>
        </div>

        {pageLoading ? (
            <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        ) : (
            <>
            {slots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
                        <Clock className="h-8 w-8 text-teal-500" />
                    </div>
                    <h3 className="text-slate-900 font-medium mb-1">No slots available</h3>
                    <p className="text-slate-500 text-sm mb-6">There are no time slots configured for this date.</p>
                    <Button onClick={handleAddSlot} className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Slot
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {slots.map((slot, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-teal-100 hover:shadow-md transition-all duration-200 items-start md:items-center group">
                            {/* Slot Label/Selection */}
                            <div className="flex items-center gap-3 min-w-[90px]">
                                <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-semibold text-xs border border-teal-100">
                                    {index + 1}
                                </div>
                                <span className="text-sm font-medium text-slate-700">Slot</span>
                            </div>

                            {/* Controls */}
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4 items-end w-full">
                                <div className="space-y-1.5 w-full">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Duration</label>
                                    <DurationStepper 
                                        value={slot.SlotDuration} 
                                        onChange={(val) => handleSlotChange(index, 'SlotDuration', val)} 
                                    />
                                </div>
                                
                                <div className="space-y-1.5 w-full">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Visitors</label>
                                    <Input
                                        type="number"
                                        className="h-9 w-full bg-slate-50 border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                                        value={slot.MaximumVisitors}
                                        onChange={(e) => handleSlotChange(index, 'MaximumVisitors', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5 w-full">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Start</label>
                                    <Input
                                        type="time"
                                        className="h-9 w-full bg-slate-50 border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                                        value={slot.StartTime}
                                        onChange={(e) => handleSlotChange(index, 'StartTime', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5 w-full">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">End</label>
                                    <Input
                                        type="text"
                                        className="h-9 w-full bg-slate-100 border-none text-slate-500 pointer-events-none"
                                        value={slot.EndTime}
                                        readOnly
                                    />
                                </div>
                            </div>

                            {/* Remove Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity -mr-2"
                                onClick={() => handleRemoveSlot(index)}
                                title="Remove Slot"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    
                    <div className="pt-2">
                            <Button onClick={handleAddSlot} variant="ghost" className="w-full border border-dashed border-slate-200 text-slate-500 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 py-6">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Slot
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between pt-6 mt-8 border-t border-slate-100">
                <Button variant="ghost" onClick={onBack} className="px-6 text-slate-500 hover:text-slate-800">
                    Back
                </Button>
                <Button 
                    onClick={handleSave} 
                    disabled={loading} 
                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 px-8 min-w-[140px] h-10"
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
            </>
        )}
        </Card>
    </div>
    
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
    <AlertDialogContent>
        <AlertDialogHeader>
        <AlertDialogTitle>Delete all slots?</AlertDialogTitle>
        <AlertDialogDescription>
            This will mark all slots for {selectedDate ? moment(selectedDate).format('MMMM Do') : 'this day'} as deleted. 
            This action cannot be undone after saving.
        </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={confirmDeleteAllSlots} className="bg-red-600 hover:bg-red-700">
            Yes, Delete All
        </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
    </AlertDialog>
    </div>
  )
}
