"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"
import { WetlandSlotCalendar } from "@/components/wetland/WetlandSlotCalendar"
import { WetlandSlotEditor } from "@/components/wetland/WetlandSlotEditor"
import { Suspense } from "react"

function WetlandSlotManager() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const { language } = useLanguage()

  const handleDateSelect = (date: string) => {
    // Navigate to same page with date param
    router.push(`/wetland/slot-creation?date=${date}`)
  }

  const handleBack = () => {
    // Remove date param
    router.push('/wetland/slot-creation')
  }

  return (
    <div className="flex-1 bg-[#F8FAFC] overflow-x-hidden pb-8 min-h-screen">
      <PageHeader
        language={language}
        titleEn={dateParam ? "Edit Slot" : "Created Slots"}
        titleAr={dateParam ? "تعديل الفترة" : "الفترات المُنشأة"}
        breadcrumbEn={dateParam ? "Edit Slot" : "Created Slots"}
        breadcrumbAr={dateParam ? "تعديل الفترة" : "الفترات المُنشأة"}
      />

      {dateParam ? (
        <WetlandSlotEditor date={dateParam} onBack={handleBack} />
      ) : (
        <WetlandSlotCalendar onDateSelect={handleDateSelect} />
      )}
    </div>
  )
}

export default function WetlandSlotCreation() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WetlandSlotManager />
    </Suspense>
  )
}
