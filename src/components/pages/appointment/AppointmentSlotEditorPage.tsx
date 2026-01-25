"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"
import { appointmentService } from "@/services/appointment.service"
import AppointmentSlotEditor from "@/components/appointment/AppointmentSlotEditor"
import { useRouter, useSearchParams } from "next/navigation"

interface AppointmentSlotEditorPageProps {
  date: string
}

export default function AppointmentSlotEditorPage({ date }: AppointmentSlotEditorPageProps) {
  const { language } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const branchId = searchParams.get('branchId') || ""
  
  const [timeSlotDurations, setTimeSlotDurations] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
        try {
            const data = await appointmentService.getMasterData()
            if (data.TimeSlotDuration || data['Time Slot Duration']) {
                setTimeSlotDurations(data.TimeSlotDuration || data['Time Slot Duration']);
            }
        } catch (e) {
            console.error(e)
        }
    }
    fetchData()
  }, [])

  const handleBack = () => {
    router.push('/appointment-booking/slot-creation')
  }

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden min-h-screen">
      <PageHeader
        language={language}
        titleEn="Appointment Slot Editor"
        titleAr="محرر فترات المواعيد"
        breadcrumbEn="Slot Editor"
        breadcrumbAr="محرر الفترات"
      />
      <div className="max-w-[1600px] mx-auto p-4 md:p-6">
        <AppointmentSlotEditor 
            selectedDate={date}
            branchID={branchId}
            timeSlotDurations={timeSlotDurations}
            onBack={handleBack}
        />
      </div>
    </div>
  )
}
