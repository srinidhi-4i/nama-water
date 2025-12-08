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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Info } from "lucide-react"
import { HolidayType } from "@/types/wetland.types"
import { format } from "date-fns"

export default function WetlandHolidaysPage() {
  const router = useRouter()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
  const [selectedHolidayType, setSelectedHolidayType] = useState<HolidayType | "">("")
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login')
      return
    }
  }, [router])

  const handleLanguageChange = (lang: "EN" | "AR") => {
    setLanguage(lang)
  }

  const handleSubmit = async () => {
    if (!selectedHolidayType || !selectedDate) {
      alert('Please select holiday type and date')
      return
    }

    setIsSubmitting(true)
    try {
      await wetlandService.createHoliday({
        holidayType: selectedHolidayType,
        year: selectedYear,
        date: format(selectedDate, 'yyyy-MM-dd'),
      })
      
      alert('Holiday created successfully')
      // Reset form
      setSelectedHolidayType("")
      setSelectedDate(undefined)
    } catch (error) {
      console.error('Error creating holiday:', error)
      alert('Failed to create holiday')
    } finally {
      setIsSubmitting(false)
    }
  }

  const years = Array.from({ length: 10 }, (_, i) => 2024 + i)

  return (
    <div className="flex flex-col min-h-screen">
      <Header language={language} onLanguageChange={handleLanguageChange} />
      <LogoSection />
      
      <main className="flex-1 overflow-auto bg-gradient-to-br from-green-50 to-teal-50 p-6">
        <div className="max-w-4xl mx-auto">
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
              Holiday Calender
            </h1>
            <p className="text-gray-600 mt-2">
              Home &gt; Calender Creation
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create Holiday</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="holidayType">Holiday Type*</Label>
                  <Select 
                    value={selectedHolidayType} 
                    onValueChange={(value) => setSelectedHolidayType(value as HolidayType)}
                  >
                    <SelectTrigger id="holidayType">
                      <SelectValue placeholder="Select Holiday Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="National Holiday">National Holiday</SelectItem>
                      <SelectItem value="Public Holiday">Public Holiday</SelectItem>
                      <SelectItem value="Maintenance Day">Maintenance Day</SelectItem>
                      <SelectItem value="Special Event">Special Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="year">Year*</Label>
                  <Select 
                    value={selectedYear.toString()} 
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger id="year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!selectedHolidayType && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-900">
                    Please Select Holiday Type for Creating The Holiday
                  </p>
                </div>
              )}

              {selectedHolidayType && (
                <div>
                  <Label>Select Holiday Date</Label>
                  <div className="mt-2 flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                      disabled={(date) => {
                        const year = date.getFullYear()
                        return year !== selectedYear
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmit}
                  disabled={!selectedHolidayType || !selectedDate || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
