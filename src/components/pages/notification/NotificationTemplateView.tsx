"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { notificationService } from "@/services/notification.service"
import { NotificationTemplate } from "@/types/notification.types"
import { TemplateViewEdit } from "@/components/notification/template-view-edit"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"
import { Loader2 } from "lucide-react"

interface NotificationTemplateViewProps {
  id: string
  mode: "view" | "edit"
}

export default function NotificationTemplateView({ id, mode }: NotificationTemplateViewProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const [template, setTemplate] = useState<NotificationTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTemplate = async () => {
      setIsLoading(true)
      try {
        const response = await notificationService.getTemplates()
        const templates = response.Notifications || []
        const found = templates.find((t: NotificationTemplate) => t.NotificationId === Number(id))
        
        if (found) {
          setTemplate(found)
        } else {
          router.push('/notification-center/templates')
        }
      } catch (error) {
        console.error('Error loading template:', error)
        router.push('/notification-center/templates')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplate()
  }, [id, router])

  const handleBack = () => {
    router.push('/notification-center/templates')
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-slate-100 overflow-x-hidden">
        <PageHeader
          language={language}
          titleEn="Notification Template"
          titleAr="قالب الإشعار"
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
        titleEn={mode === "edit" ? "Edit Notification Template" : "Notification Template"}
        titleAr={mode === "edit" ? "تحرير قالب الإشعار" : "قالب الإشعار"}
        breadcrumbItems={[
          { labelEn: "Home", labelAr: "الرئيسية", href: "/branchhome" },
          { labelEn: "Notification Templates", labelAr: "قوالب الإشعارات", href: "/notification-center/templates" },
          { labelEn: mode === "edit" ? "Edit" : "View", labelAr: mode === "edit" ? "تحرير" : "عرض" }
        ]}
      />
      <div className="p-4">
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
