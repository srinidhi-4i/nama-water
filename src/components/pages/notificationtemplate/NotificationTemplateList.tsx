"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { authService } from "@/services/auth.service"
import { notificationService } from "@/services/notification.service"
import { menuService } from "@/services/menu.service"
import { Header } from "@/components/layout/Header"
import { LogoSection } from "@/components/layout/LogoSection"
import { Sidebar } from "@/components/layout/Sidebar"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { NotificationTemplate } from "@/types/notification.types"
import { MenuItem } from "@/types/menu"
import { TemplateViewEdit } from "@/components/notification/template-view-edit"
import { getNotificationTemplateColumns } from "@/app/notifications-center/notificationtemplate/columns"

import { useAuth } from "@/components/providers/AuthProvider"
import Link from "next/link"

export default function NotificationTemplateList() {
  const router = useRouter()
  const { userDetails } = useAuth()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showViewEdit, setShowViewEdit] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "edit">("view")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    loadMenuData()
    loadTemplates()
  }, [])

  const loadMenuData = async () => {
    try {
      const data = await menuService.getMenuDetails()
      if (data && data.length > 0) {
        const transformedData = data.map((item: any) => ({
          MenuID: item.MenuId,
          MenuNameEn: item.Menu_Name_EN,
          MenuNameAr: item.Menu_Name_AR,
          MenuURL: item.Target_Url,
          ApplicationNameEn: item.ApplicationNameEn || "General"
        }))
        setMenuItems(transformedData)
      }
    } catch (error) {
      console.error('Error loading menu data:', error)
    }
  }

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

  const handleLanguageChange = (lang: "EN" | "AR") => {
    setLanguage(lang)
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
      <div className="flex flex-col min-h-screen">
        <Header 
          language={language} 
          onLanguageChange={handleLanguageChange} 
          userDetails={userDetails} 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <LogoSection />
        <div className="flex flex-1">
          <Sidebar 
            menuItems={menuItems} 
            language={language} 
            isOpen={isSidebarOpen} 
            onMobileClose={() => setIsSidebarOpen(false)}
          />
          <main className="flex-1 bg-gray-50 p-6">
            <TemplateViewEdit
              template={selectedTemplate}
              mode={viewMode}
              onBack={handleBack}
              language={language}
            />
          </main>
        </div>
        <Footer />
      </div>
    )
  }

  const columns = getNotificationTemplateColumns(handleEdit, handleView);

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        language={language} 
        onLanguageChange={handleLanguageChange} 
        userDetails={userDetails} 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <LogoSection />
      <div className="flex flex-1">
        <Sidebar 
          menuItems={menuItems} 
          language={language} 
          isOpen={isSidebarOpen} 
          onMobileClose={() => setIsSidebarOpen(false)}
        />
       <main className="flex-1 bg-slate-100 overflow-x-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 px-2 shadow-md">
                 <div className="flex items-center gap-4 text-center sm:text-left h-12">
                    <h1 className="text-2xl font-bold text-[#006A72]">
                      Notification Template
                    </h1>
                 </div>
                 
                <div className="text-sm text-gray-500">
                  <Link 
                    href="/branchhome"
                    className="font-semibold text-[#006A72] hover:underline cursor-pointer"
                  >
                    Home
                  </Link>
                  <span> &gt; Notification Template List</span>
                </div>
            </div>

            <div className ="px-6">
                <DataTable 
                    data={templates}
                    columns={columns}
                    isLoading={isLoading}
                    emptyMessage="No notification templates found"
                />
            </div>
          </main>
      </div>
      <Footer />
    </div>
  )
}
