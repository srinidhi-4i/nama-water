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
import { getColumns } from "@/app/notificationtemplate/columns"

export default function NotificationTemplateList() {
  const router = useRouter()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [userDetails, setUserDetails] = useState<any>(null)
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showViewEdit, setShowViewEdit] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "edit">("view")

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login')
      return
    }

    try {
      const userData = authService.getCurrentUser()
      if (userData && userData.BranchUserDetails && userData.BranchUserDetails.length > 0) {
        setUserDetails(userData.BranchUserDetails[0])
      }
    } catch (error) {
      console.error('Error loading user details:', error)
    }

    loadMenuData()
    loadTemplates()
  }, [router, currentPage])

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
      setTotalPages(Math.ceil((response.Notifications?.length || 0) / 6))
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
      setTotalPages(Math.ceil(freshTemplates.length / 6))

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
      setTotalPages(Math.ceil(freshTemplates.length / 6))

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

  // Pagination for DataTable
  const indexOfLastItem = currentPage * 6
  const indexOfFirstItem = indexOfLastItem - 6
  const currentItems = templates.slice(indexOfFirstItem, indexOfLastItem)

  if (showViewEdit && selectedTemplate) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header language={language} onLanguageChange={handleLanguageChange} userDetails={userDetails} />
        <LogoSection />
        <div className="flex flex-1">
          <Sidebar menuItems={menuItems} language={language} />
          <main className="flex-1 bg-gray-50 p-6">
            <TemplateViewEdit
              template={selectedTemplate}
              mode={viewMode}
              onBack={handleBack}
            />
          </main>
        </div>
        <Footer />
      </div>
    )
  }

  const columns = getColumns(handleEdit, handleView);

  return (
    <div className="flex flex-col min-h-screen">
      <Header language={language} onLanguageChange={handleLanguageChange} userDetails={userDetails} />
      <LogoSection />
      <div className="flex flex-1">
        <Sidebar menuItems={menuItems} language={language} />
        <main className="flex-1 bg-gray-50 p-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 text-teal-900 hover:text-teal-800 hover:bg-teal-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <h1 className="text-2xl font-semibold text-teal-900 mb-6">
              Notification Templates
            </h1>

            <div className="rounded-md border overflow-hidden bg-white shadow-sm">
                <DataTable
                    data={currentItems}
                    columns={columns}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
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
