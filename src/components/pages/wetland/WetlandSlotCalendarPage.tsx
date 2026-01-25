"use client"

import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"
import { WetlandSlotCalendar } from "@/components/wetland/WetlandSlotCalendar"

export default function WetlandSlotCalendarPage() {
  const router = useRouter()
  const { language } = useLanguage()

  const handleDateSelect = (date: string) => {
    router.push(`/wetland-visit/slot-creation/${date}`)
  }

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8">
      <PageHeader
        language={language}
        titleEn="Created Slots"
        titleAr="الفترات المُنشأة"
        breadcrumbEn="Created Slots"
        breadcrumbAr="الفترات المُنشأة"
      />
      <WetlandSlotCalendar onDateSelect={handleDateSelect} />
    </div>
  )
}
