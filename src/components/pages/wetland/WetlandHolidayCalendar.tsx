"use client"

import { useState } from "react"
import { wetlandService } from "@/services/wetland.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Info } from "lucide-react"
import { HolidayType } from "@/types/wetland.types"
import { format } from "date-fns"
import { useLanguage } from "@/components/providers/LanguageProvider"
import Link from "next/link"

export default function WetlandHolidayCalendar() {
  const { language } = useLanguage()
  const [selectedHolidayType, setSelectedHolidayType] = useState<HolidayType | "">("")
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedHolidayType || !selectedDate) {
      alert(language === "EN" ? 'Please select holiday type and date' : 'يرجى اختيار نوع العطلة والتاريخ')
      return
    }

    setIsSubmitting(true)
    try {
      await wetlandService.createHoliday({
        holidayType: selectedHolidayType,
        year: selectedYear,
        date: format(selectedDate, 'yyyy-MM-dd'),
      })
      
      alert(language === "EN" ? 'Holiday created successfully' : 'تم إنشاء العطلة بنجاح')
      // Reset form
      setSelectedHolidayType("")
      setSelectedDate(undefined)
    } catch (error) {
      console.error('Error creating holiday:', error)
      alert(language === "EN" ? 'Failed to create holiday' : 'فشل إنشاء العطلة')
    } finally {
      setIsSubmitting(false)
    }
  }

  const years = Array.from({ length: 10 }, (_, i) => 2024 + i)

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 px-2 shadow-md bg-white">
        <div className="flex items-center gap-4 text-center sm:text-left h-12">
          <h1 className="text-2xl font-bold text-[#006A72] flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-green-600" />
            {language === "EN" ? "Holiday Calendar" : "تقويم العطلات"}
          </h1>
        </div>
        
        <div className="text-sm text-gray-500">
          <Link 
            href="/branchhome"
            className="font-semibold text-[#006A72] hover:underline cursor-pointer"
          >
            {language === "EN" ? "Home" : "الرئيسية"}
          </Link>
          <span> &gt; {language === "EN" ? "Calendar Creation" : "إنشاء التقويم"}</span>
        </div>
      </div>

      <div className="px-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{language === "EN" ? "Create Holiday" : "إنشاء عطلة"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="holidayType">{language === "EN" ? "Holiday Type*" : "نوع العطلة*"}</Label>
                  <Select 
                    value={selectedHolidayType} 
                    onValueChange={(value) => setSelectedHolidayType(value as HolidayType)}
                  >
                    <SelectTrigger id="holidayType">
                      <SelectValue placeholder={language === "EN" ? "Select Holiday Type" : "اختر نوع العطلة"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="National Holiday">{language === "EN" ? "National Holiday" : "عطلة وطنية"}</SelectItem>
                      <SelectItem value="Public Holiday">{language === "EN" ? "Public Holiday" : "عطلة عامة"}</SelectItem>
                      <SelectItem value="Maintenance Day">{language === "EN" ? "Maintenance Day" : "يوم الصيانة"}</SelectItem>
                      <SelectItem value="Special Event">{language === "EN" ? "Special Event" : "حدث خاص"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="year">{language === "EN" ? "Year*" : "السنة*"}</Label>
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
                    {language === "EN" ? "Please Select Holiday Type for Creating The Holiday" : "يرجى اختيار نوع العطلة لإنشاء العطلة"}
                  </p>
                </div>
              )}

              {selectedHolidayType && (
                <div>
                  <Label>{language === "EN" ? "Select Holiday Date" : "اختر تاريخ العطلة"}</Label>
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
                  {isSubmitting ? (language === "EN" ? 'Submitting...' : 'جاري الإرسال...') : (language === "EN" ? 'Submit' : 'إرسال')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

