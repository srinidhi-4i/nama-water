"use client"

import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"
import { WetlandSlotEditor } from "@/components/wetland/WetlandSlotEditor"

interface WetlandSlotEditorPageProps {
  date: string
}

export default function WetlandSlotEditorPage({ date }: WetlandSlotEditorPageProps) {
  const router = useRouter()
  const { language } = useLanguage()

  const handleBack = () => {
    router.push('/wetland-visit/slot-creation')
  }

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8">
      <PageHeader
        language={language}
        titleEn="Edit Slot"
        titleAr="تعديل الفترة"
        breadcrumbEn="Edit Slot"
        breadcrumbAr="تعديل الفترة"
      />
      <WetlandSlotEditor date={date} onBack={handleBack} />
    </div>
  )
}
