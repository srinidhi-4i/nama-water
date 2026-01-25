"use client"

import { NotificationEditor } from "@/components/watershutdown/NotificationEditor"
import { useRouter } from "next/navigation"
import PageHeader from "@/components/layout/PageHeader"
import { useLanguage } from "@/components/providers/LanguageProvider"

export default function WaterShutdownCreate() {
  const router = useRouter()
  const { language } = useLanguage()

  const handleBack = () => {
    router.push('/water-shutdown/list')
  }

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden">
      <PageHeader
        language={language}
        titleEn="Create Water Shutdown Event"
        titleAr="إنشاء حدث إيقاف المياه"
        breadcrumbItems={[
          { labelEn: "Home", labelAr: "الرئيسية", href: "/branchhome" },
          { labelEn: "Water Shutdown Notification List", labelAr: "قائمة إشعارات إيقاف المياه", href: "/water-shutdown/list" },
          { labelEn: "Create", labelAr: "إنشاء" }
        ]}
      />
      <div className="p-6">
        <NotificationEditor
          onBack={handleBack}
          onSaveSuccess={handleBack}
        />
      </div>
    </div>
  )
}
