"use client"

import { useState } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AppointmentHolidayCalendar() {
  const { language } = useLanguage()
  const [selectedDates, setSelectedDates] = useState<Date[]>([])

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 px-2 shadow-md bg-white">
        <div className="flex items-center gap-4 text-center sm:text-left h-12">
          <h1 className="text-2xl font-bold text-[#006A72]">
            {language === "EN" ? "Holiday Calendar (Appointments)" : "تقويم العطلات (المواعيد)"}
          </h1>
        </div>
        
        <div className="text-sm text-gray-500">
          <Link 
            href="/branchhome"
            className="font-semibold text-[#006A72] hover:underline cursor-pointer"
          >
            {language === "EN" ? "Home" : "الرئيسية"}
          </Link>
          <span> &gt; {language === "EN" ? "Holiday Calendar (Appointments)" : "تقويم العطلات (المواعيد)"}</span>
        </div>
      </div>

      <div className="px-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "EN" ? "Select Holiday Dates" : "اختر تواريخ العطلات"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => setSelectedDates(dates || [])}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

