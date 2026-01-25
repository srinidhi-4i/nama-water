"use client"

import { NotificationView } from "@/components/watershutdown/notification-view-edit"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"

interface WaterShutdownViewProps {
  eventId: string
}

export default function WaterShutdownView({ eventId }: WaterShutdownViewProps) {
  const router = useRouter()
  const { language } = useLanguage()

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden">
      <PageHeader
        language={language}
        titleEn="View Water Shutdown Event"
        titleAr="عرض حدث إيقاف المياه"
        breadcrumbItems={[
          { labelEn: "Home", labelAr: "الرئيسية", href: "/branchhome" },
          { labelEn: "Water Shutdown Notification List", labelAr: "قائمة إشعارات إيقاف المياه", href: "/water-shutdown/list" },
          { labelEn: "View", labelAr: "عرض" }
        ]}
      />
      <div className="p-6">
        <NotificationView
          notificationId={eventId}
          onBack={() => router.push('/water-shutdown/list')}
          language={language}
        />
      </div>
    </div>
  )
}
