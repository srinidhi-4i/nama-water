"use client"

import { useEffect, useState } from "react"
import { waterShutdownService } from "@/services/watershutdown.service"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { WaterShutdownTemplate } from "@/types/watershutdown.types"
import { useLanguage } from "@/components/providers/LanguageProvider"
import Link from "next/link"
import { CreateTemplate } from "@/components/watershutdown/create-template"
import { TemplateViewEdit } from "@/components/watershutdown/template-view-edit"
import { getWaterShutdownTemplateColumns } from "@/app/(dashboard)/watershutdown/templates/columns"
import PageHeader from "@/components/layout/PageHeader"

export default function WaterShutdownTemplatesPage() {
  const { language } = useLanguage()
  const [templates, setTemplates] = useState<WaterShutdownTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showViewEdit, setShowViewEdit] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WaterShutdownTemplate | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "edit">("view")
  const [isDetailLoading, setIsDetailLoading] = useState(false)

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
    setIsDetailLoading(true)
    try {
      const freshTemplate = await waterShutdownService.getTemplateById(template.id)
      setSelectedTemplate(freshTemplate)
      setViewMode("view")
      setShowViewEdit(true)
    } catch (error) {
       console.error("Error fetching template details:", error)
    } finally {
       setIsDetailLoading(false)
    }
  }

  const handleEdit = async (template: WaterShutdownTemplate) => {
    setIsDetailLoading(true)
    try {
      const freshTemplate = await waterShutdownService.getTemplateById(template.id)
      setSelectedTemplate(freshTemplate)
      setViewMode("edit")
      setShowViewEdit(true)
    } catch (error) {
       console.error("Error fetching template details:", error)
    } finally {
       setIsDetailLoading(false)
    }
  }

  const handleBack = () => {
    setShowCreate(false)
    setShowViewEdit(false)
    setSelectedTemplate(null)
    loadTemplates()
  }

  const handleCreate = async () => {
    setIsDetailLoading(true)
    try {
      await waterShutdownService.getWaterShutdownMasterData()
      setShowCreate(true)
    } catch (error) {
      console.error('Error loading master data:', error)
    } finally {
      setIsDetailLoading(false)
    }
  }

  const columns = getWaterShutdownTemplateColumns({
    onView: handleView,
    onEdit: handleEdit
  })

  // Render logic for different states (List, Create, View/Edit)
  const renderContent = () => {
    if (showCreate) {
      return (
        <>
    <div className="flex-1 bg-slate-100 overflow-x-hidden ">
           <PageHeader
             language={language}
             titleEn="Water Shut Down Template creation"
             titleAr="إنشاء قالب إيقاف المياه"
             breadcrumbEn="Water Shut Down Template creation"
             breadcrumbAr="إنشاء قالب إيقاف المياه"
           />
          </div>
          <div className="px-6">
            <CreateTemplate onBack={handleBack} />
          </div>
        </>
      )
    }

    if (showViewEdit && selectedTemplate) {
      return (
        <>
    <div className="flex-1 bg-slate-100 overflow-x-hidden ">
           <PageHeader
             language={language}
             titleEn="Water Shut Down Template creation"
             titleAr="إنشاء قالب إيقاف المياه"
             breadcrumbEn="Water Shut Down Template creation"
             breadcrumbAr="إنشاء قالب إيقاف المياه"
           />
          </div>
          <div className="px-6">
            <TemplateViewEdit 
              template={selectedTemplate} 
              mode={viewMode} 
              onBack={handleBack}
              language={language}
            />
          </div>
        </>
      )
    }

    return (
      <>
    <div className="flex-1 bg-slate-100 overflow-x-hidden ">
          <PageHeader
            language={language}
            titleEn="Water Shut Down Templates"
            titleAr="قوالب إيقاف المياه"
            breadcrumbEn="Water Shut Down Templates"
            breadcrumbAr="قوالب إيقاف المياه"
          />
        </div>

        <div className="px-6">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={handleCreate}
              disabled={isDetailLoading}
              className="bg-[#EF4444] hover:bg-[#DC2626] text-white"
            >
              {isDetailLoading ? (language === "EN" ? "Loading..." : "جاري التحميل...") : (language === "EN" ? "Create New Template" : "إنشاء قالب جديد")}
            </Button>
          </div>

          <DataTable
            data={templates}
            columns={columns}
            isLoading={isLoading || isDetailLoading}
            emptyMessage={language === "EN" ? "No templates found" : "لم يتم العثور على قوالب"}
          />
        </div>
      </>
    )
  }

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
      {renderContent()}
    </div>
  )
}
