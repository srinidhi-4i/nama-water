"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { waterShutdownService } from "@/services/watershutdown.service"
import { WaterShutdownTemplate } from "@/types/watershutdown.types"
import { TemplateViewEdit } from "@/components/watershutdown/template-view-edit"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"
import { Loader2 } from "lucide-react"

interface WaterShutdownTemplateViewProps {
  id: string
  mode: "view" | "edit"
}

export default function WaterShutdownTemplateView({ id, mode }: WaterShutdownTemplateViewProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const [template, setTemplate] = useState<WaterShutdownTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTemplate = async () => {
      setIsLoading(true)
      try {
        const freshTemplate = await waterShutdownService.getTemplateById(id)
        setTemplate(freshTemplate)
      } catch (error) {
        console.error('Error loading template:', error)
        router.push('/water-shutdown/templates')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplate()
  }, [id, router])

  const handleBack = () => {
    router.push('/water-shutdown/templates')
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-slate-100 overflow-x-hidden">
        <PageHeader
          language={language}
          titleEn="Water Shut Down Template"
          titleAr="قالب إيقاف المياه"
          breadcrumbEn="Loading..."
          breadcrumbAr="جاري التحميل..."
        />
        <div className="flex items-center justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </div>
    )
  }

  if (!template) {
    return null
  }

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden">
      <PageHeader
        language={language}
        titleEn={mode === "edit" ? "Edit Water Shut Down Template" : "Water Shut Down Template"}
        titleAr={mode === "edit" ? "تحرير قالب إيقاف المياه" : "قالب إيقاف المياه"}
        breadcrumbItems={[
          { labelEn: "Home", labelAr: "الرئيسية", href: "/branchhome" },
          { labelEn: "Water Shutdown Templates", labelAr: "قوالب إيقاف المياه", href: "/water-shutdown/templates" },
          { labelEn: mode === "edit" ? "Edit" : "View", labelAr: mode === "edit" ? "تحرير" : "عرض" }
        ]}
      />
      <div className="p-6">
        <TemplateViewEdit 
          template={template} 
          mode={mode} 
          onBack={handleBack}
          language={language}
        />
      </div>
    </div>
  )
}
