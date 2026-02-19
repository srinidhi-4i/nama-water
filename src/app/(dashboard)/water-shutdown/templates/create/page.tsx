"use client"

import { useRouter } from "next/navigation"
import { CreateTemplate } from "@/components/watershutdown/create-template"
import PageHeader from "@/components/layout/PageHeader"
import { useLanguage } from "@/components/providers/LanguageProvider"

export default function CreateTemplatePage() {
  const router = useRouter()
  const { language } = useLanguage()

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden">
      <PageHeader
        language={language}
        titleEn="Create Water Shut Down Template"
        titleAr="إنشاء قالب إيقاف المياه"
        breadcrumbItems={[
          { labelEn: "Home", labelAr: "الرئيسية", href: "/branchhome" },
          { labelEn: "Water Shutdown Templates", labelAr: "قوالب إيقاف المياه", href: "/water-shutdown/templates" },
          { labelEn: "Create", labelAr: "إنشاء" }
        ]}
      />
      <div className="p-6">
        <CreateTemplate onBack={() => router.push("/water-shutdown/templates")} />
      </div>
    </div>
  )
}
