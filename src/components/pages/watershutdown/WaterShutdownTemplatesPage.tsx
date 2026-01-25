"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { waterShutdownService } from "@/services/watershutdown.service"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { WaterShutdownTemplate } from "@/types/watershutdown.types"
import { useLanguage } from "@/components/providers/LanguageProvider"
import Link from "next/link"
import { CreateTemplate } from "@/components/watershutdown/create-template"
import { TemplateViewEdit } from "@/components/watershutdown/template-view-edit"
import { getWaterShutdownTemplateColumns } from "@/app/(dashboard)/water-shutdown/templates/columns"
import PageHeader from "@/components/layout/PageHeader"

export default function WaterShutdownTemplatesPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [templates, setTemplates] = useState<WaterShutdownTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const data = await waterShutdownService.getTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = async (template: WaterShutdownTemplate) => {
    router.push(`/water-shutdown/templates/${template.id}?mode=view`)
  }

  const handleEdit = async (template: WaterShutdownTemplate) => {
    router.push(`/water-shutdown/templates/${template.id}?mode=edit`)
  }

  const columns = getWaterShutdownTemplateColumns({
    onView: handleView,
    onEdit: handleEdit
  })

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
      <PageHeader
        language={language}
        titleEn="Water Shut Down Templates"
        titleAr="قوالب إيقاف المياه"
        breadcrumbEn="Water Shut Down Templates"
        breadcrumbAr="قوالب إيقاف المياه"
      />

      <div className="p-6">
        <div className="flex justify-end mb-4">
          <Button 
            onClick={() => router.push('/water-shutdown/templates/create')}
            disabled={isLoading}
            className="bg-[#EF4444] hover:bg-[#DC2626] text-white"
          >
            {isLoading ? (language === "EN" ? "Loading..." : "جاري التحميل...") : (language === "EN" ? "Create New Template" : "إنشاء قالب جديد")}
          </Button>
        </div>

        <DataTable
          data={templates}
          columns={columns}
          isLoading={isLoading}
          emptyMessage={language === "EN" ? "No templates found" : "لم يتم العثور على قوالب"}
        />
      </div>
    </div>
  )
}
