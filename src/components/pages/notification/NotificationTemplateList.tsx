"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { notificationService } from "@/services/notification.service"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { NotificationTemplate } from "@/types/notification.types"
import { TemplateViewEdit } from "@/components/notification/template-view-edit"
import { getNotificationTemplateColumns } from "@/app/(dashboard)/notification-center/templates/columns"
import { useLanguage } from "@/components/providers/LanguageProvider"
import Link from "next/link"

export default function NotificationTemplateList() {
  const router = useRouter()
  const { language } = useLanguage()
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showViewEdit, setShowViewEdit] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "edit">("view")

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await notificationService.getTemplates()
      setTemplates(response.Notifications || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = async (template: NotificationTemplate) => {
    setIsLoading(true)
    try {
      const response = await notificationService.getTemplates()
      const freshTemplates = response.Notifications || []
      
      setTemplates(freshTemplates)

      const freshTemplate = freshTemplates.find(t => t.NotificationCategory === template.NotificationCategory) || template
      
      setSelectedTemplate(freshTemplate)
      setViewMode("view")
      setShowViewEdit(true)
    } catch (error) {
      console.error('Error refreshing data:', error)
      setSelectedTemplate(template)
      setViewMode("view")
      setShowViewEdit(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async (template: NotificationTemplate) => {
    setIsLoading(true)
    try {
      const response = await notificationService.getTemplates()
      const freshTemplates = response.Notifications || []
      
      setTemplates(freshTemplates)

      const freshTemplate = freshTemplates.find(t => t.NotificationCategory === template.NotificationCategory) || template

      setSelectedTemplate(freshTemplate)
      setViewMode("edit")
      setShowViewEdit(true)
    } catch (error) {
       console.error('Error refreshing data:', error)
       setSelectedTemplate(template)
       setViewMode("edit")
       setShowViewEdit(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setShowViewEdit(false)
    setSelectedTemplate(null)
    loadTemplates()
  }
  
  if (showViewEdit && selectedTemplate) {
    return (
      <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 px-2 shadow-md bg-white">
          <div className="flex items-center gap-4 text-center sm:text-left h-12">
            <h1 className="text-2xl font-bold text-[#006A72]">
              {language === "EN" ? `Notification Template ${viewMode === "view" ? "View" : "Edit"}` : `عرض قالب الإشعار ${viewMode === "view" ? "عرض" : "تعديل"}`}
            </h1>
          </div>
          
          <div className="text-sm text-gray-500">
            <Link 
              href="/branchhome"
              className="font-semibold text-[#006A72] hover:underline cursor-pointer"
            >
              {language === "EN" ? "Home" : "الرئيسية"}
            </Link>
            <span> &gt; {viewMode === "view" ? (language === "EN" ? "View" : "عرض") : (language === "EN" ? "Edit" : "تعديل")} {language === "EN" ? "Notification Template" : "قالب الإشعار"}</span>
          </div>
        </div>
        <div className="px-6">
          <TemplateViewEdit
            template={selectedTemplate}
            mode={viewMode}
            onBack={handleBack}
            language={language}
          />
        </div>
      </div>
    )
  }

  const columns = getNotificationTemplateColumns(handleEdit, handleView);

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 px-2 shadow-md bg-white">
        <div className="flex items-center gap-4 text-center sm:text-left h-12">
          <h1 className="text-2xl font-bold text-[#006A72]">
            {language === "EN" ? "Notification Template" : "قالب الإشعار"}
          </h1>
        </div>
        
        <div className="text-sm text-gray-500">
          <Link 
            href="/branchhome"
            className="font-semibold text-[#006A72] hover:underline cursor-pointer"
          >
            {language === "EN" ? "Home" : "الرئيسية"}
          </Link>
          <span> &gt; {language === "EN" ? "Notification Template List" : "قائمة قوالب الإشعارات"}</span>
        </div>
      </div>

      <div className="px-6">
        <DataTable 
          data={templates}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No notification templates found"
        />
      </div>
    </div>
  )
}

