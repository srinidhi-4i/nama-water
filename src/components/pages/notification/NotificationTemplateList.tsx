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
import PageHeader from "@/components/layout/PageHeader"

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
      <div className="flex-1 bg-slate-100 overflow-x-hidden ">
        <PageHeader
          language={language}
          titleEn="Notification Template"
          titleAr="قالب الإشعار"
          breadcrumbEn="Notification Template List"
          breadcrumbAr="قائمة قوالب الإشعارات"
        />
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
    <div className="flex-1 bg-slate-100 overflow-x-hidden ">
      <PageHeader
        language={language}
        titleEn="Notification Template"
        titleAr="قالب الإشعار"
        breadcrumbEn="Notification Template List"
        breadcrumbAr="قائمة قوالب الإشعارات"
      />

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

