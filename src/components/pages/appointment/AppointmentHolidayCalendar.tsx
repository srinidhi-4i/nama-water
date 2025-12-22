"use client"

import { useState } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import PageHeader from "@/components/layout/PageHeader"

export default function AppointmentHolidayCalendar() {
  const { language } = useLanguage()
  const [selectedDates, setSelectedDates] = useState<Date[]>([])

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
      <PageHeader
        language={language}
        titleEn="Holiday Calendar (Appointments)"
        titleAr="تقويم العطلات (المواعيد)"
        breadcrumbEn="Holiday Calendar (Appointments)"
        breadcrumbAr="تقويم العطلات (المواعيد)"
      />

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

