"use client"

import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"

export default function AppointmentSlotCreation() {
  const { language } = useLanguage()

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
      <PageHeader
        language={language}
        titleEn="Appointment Slot Creation"
        titleAr="إنشاء فترات المواعيد"
        breadcrumbEn="Appointment Slot Creation"
        breadcrumbAr="إنشاء فترات المواعيد"
      />

      <div className="px-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-gray-500 text-center py-8">
            {language === "EN" ? "Appointment slot creation will be implemented here" : "سيتم تنفيذ إنشاء فترات المواعيد هنا"}
          </p>
        </div>
      </div>
    </div>
  )
}

