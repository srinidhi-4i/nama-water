"use client"

import { useEffect, useState } from "react"
import { wetlandService } from "@/services/wetland.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit2, Plus } from "lucide-react"
import { WetlandSlot, MonthCalendar } from "@/types/wetland.types"
import { format } from "date-fns"
import { useLanguage } from "@/components/providers/LanguageProvider"
import Link from "next/link"
import PageHeader from "@/components/layout/PageHeader"

export default function WetlandSlotCreation() {
  const { language } = useLanguage()
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [monthCalendar, setMonthCalendar] = useState<MonthCalendar | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadSlots()
  }, [currentMonth, currentYear])

  const loadSlots = async () => {
    setIsLoading(true)
    try {
      const response = await wetlandService.getSlots(currentMonth, currentYear)
      const calendar = wetlandService.buildMonthCalendar(response.slots, currentMonth, currentYear)
      setMonthCalendar(calendar)
    } catch (error) {
      console.error('Error loading slots:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const getMonthName = (month: number) => {
    const date = new Date(currentYear, month - 1, 1)
    return format(date, 'MMMM yyyy')
  }

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr)
    return format(date, 'EEEE')
  }

  const getDayOfMonth = (dateStr: string) => {
    const date = new Date(dateStr)
    return format(date, 'd MMMM yyyy')
  }

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
      <PageHeader
        language={language}
        titleEn="Created Slots"
        titleAr="الفترات المُنشأة"
        breadcrumbEn="Created Slots"
        breadcrumbAr="الفترات المُنشأة"
      />

      <div className="px-6">
        <div className="max-w-7xl mx-auto">
          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-semibold">{getMonthName(currentMonth)}</h2>
            <Button variant="outline" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Create New Slot Button */}
          <div className="flex justify-end mb-4">
            <Button onClick={() => console.log('Create new slot')}>
              <Plus className="h-4 w-4 mr-2" />
              {language === "EN" ? "Create New Slot" : "إنشاء فترة جديدة"}
            </Button>
          </div>

          {/* Calendar Grid */}
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                {language === "EN" ? "Loading slots..." : "جاري تحميل الفترات..."}
              </CardContent>
            </Card>
          ) : monthCalendar && monthCalendar.days.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {monthCalendar.days.map((day) => (
                <Card key={day.date} className="min-h-[200px]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      <div className="font-semibold">{getDayOfMonth(day.date)}</div>
                      <div className="text-xs text-gray-500 font-normal">{getDayName(day.date)}</div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {day.slots.length === 0 ? (
                      <div className="text-xs text-gray-400 text-center py-4">
                        {language === "EN" ? "No slots" : "لا توجد فترات"}
                      </div>
                    ) : (
                      day.slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="relative bg-blue-50 border border-blue-200 rounded p-2 hover:bg-blue-100 transition-colors"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => console.log('Edit slot', slot.id)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <div className="text-xs font-medium pr-6">
                            {slot.startTime} AM-{slot.endTime}
                          </div>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {slot.bookedCount}/{slot.capacity}
                          </Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                {language === "EN" ? "No slots available for this month" : "لا توجد فترات متاحة لهذا الشهر"}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

