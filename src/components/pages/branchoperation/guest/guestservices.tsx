"use client"

import { useLanguage } from "@/components/providers/LanguageProvider"
import { GuestUserServices } from "@/components/branchoperations/GuestUserServices"
import PageHeader from "@/components/layout/PageHeader"

export default function GuestUserServicesPage() {
  const { language } = useLanguage()

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden">
      <PageHeader
        language={language}
        titleEn="Guest User Services"
        titleAr="خدمات المستخدم الضيف"
        breadcrumbEn="Guest User Services"
        breadcrumbAr="خدمات المستخدم الضيف"
      />
     

      <div className="px-6 py-4">
        <GuestUserServices />
      </div>
    </div>
  )
}
