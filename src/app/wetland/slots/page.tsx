"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth.service"
import { wetlandService } from "@/services/wetland.service"
import { Header } from "@/components/layout/Header"
import { LogoSection } from "@/components/layout/LogoSection"
import { Footer } from "@/components/layout/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit2, Plus } from "lucide-react"
import { WetlandSlot, MonthCalendar } from "@/types/wetland.types"
import { format } from "date-fns"

export default function WetlandSlotsPage() {
  const router = useRouter()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [monthCalendar, setMonthCalendar] = useState<MonthCalendar | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login')
      return
    }
    loadSlots()
  }, [router, currentMonth, currentYear])

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

  const handleLanguageChange = (lang: "EN" | "AR") => {
    setLanguage(lang)
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
    <div className="flex flex-col min-h-screen">
      <Header language={language} onLanguageChange={handleLanguageChange} />
      <LogoSection />
      
      <main className="flex-1 overflow-auto bg-gradient-to-br from-green-50 to-teal-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.push('/branchhome')}
              className="mb-4"
            >
              ← Back to Home
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-green-600" />
              Created Slots
            </h1>
            <p className="text-gray-600 mt-2">
              Home &gt; Slot Creation &gt; Created Slots
            </p>
          </div>

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
              Create New Slot
            </Button>
          </div>

          {/* Calendar Grid */}
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                Loading slots...
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
                        No slots
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
                No slots available for this month
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
