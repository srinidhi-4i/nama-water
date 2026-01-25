"use client"

import { NotificationEditor } from "@/components/watershutdown/NotificationEditor"
import { useRouter } from "next/navigation"
import PageHeader from "@/components/layout/PageHeader"
import { useLanguage } from "@/components/providers/LanguageProvider"

interface WaterShutdownEditProps {
  eventId: string
}

export default function WaterShutdownEdit({ eventId }: WaterShutdownEditProps) {
  const router = useRouter()
  const { language } = useLanguage()

  const handleBack = () => {
    router.push('/water-shutdown/list')
  }

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden">
      <PageHeader
        language={language}
        titleEn="Edit Water Shutdown Event"
        titleAr="تحرير حدث إيقاف المياه"
        breadcrumbItems={[
          { labelEn: "Home", labelAr: "الرئيسية", href: "/branchhome" },
          { labelEn: "Water Shutdown Notification List", labelAr: "قائمة إشعارات إيقاف المياه", href: "/water-shutdown/list" },
          { labelEn: "Edit", labelAr: "تحرير" }
        ]}
      />
      <div className="p-6">
        <NotificationEditor
          notificationId={eventId}
          onBack={handleBack}
          onSaveSuccess={handleBack}
        />
      </div>
    </div>
  )
}
