"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { authService } from "@/services/auth.service"
import { notificationService } from "@/services/notification.service"
import { menuService } from "@/services/menu.service"
import { Header } from "@/components/layout/Header"
import { LogoSection } from "@/components/layout/LogoSection"
import { Sidebar } from "@/components/layout/Sidebar"
import { Footer } from "@/components/layout/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable, Column } from "@/components/ui/data-table"
import { Eye, Edit } from "lucide-react"
import { NotificationTemplate } from "@/types/notification.types"
import { MenuItem } from "@/types/menu"
import { TemplateViewEdit } from "../../components/notification/template-view-edit"

export default function NotificationTemplatePage() {
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

    // Load user details
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
    // Forced reload for menu data structure
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
      // Fetch fresh data
      const response = await notificationService.getTemplates()
      const freshTemplates = response.Notifications || []
      
      // Update list state
      setTemplates(freshTemplates)
      setTotalPages(Math.ceil(freshTemplates.length / 6))

      // Find the updated version of the selected template
      // Using NotificationCategory as it seems to be the unique identifier for templates
      const freshTemplate = freshTemplates.find(t => t.NotificationCategory === template.NotificationCategory) || template
      
      setSelectedTemplate(freshTemplate)
      setViewMode("view")
      setShowViewEdit(true)
    } catch (error) {
      console.error('Error refreshing data:', error)
      // Fallback to existing data if fetch fails
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
      // Fetch fresh data
      const response = await notificationService.getTemplates()
      const freshTemplates = response.Notifications || []
      
      // Update list state
      setTemplates(freshTemplates)
      setTotalPages(Math.ceil(freshTemplates.length / 6))

      // Find the updated version of the selected template
      const freshTemplate = freshTemplates.find(t => t.NotificationCategory === template.NotificationCategory) || template

      setSelectedTemplate(freshTemplate)
      setViewMode("edit")
      setShowViewEdit(true)
    } catch (error) {
       console.error('Error refreshing data:', error)
       // Fallback
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

  const columns: Column<NotificationTemplate>[] = [
    {
      key: 'EventTypeEn',
      header: 'Event Type',
      className: 'font-medium',
    },
    {
      key: 'NotificationTitleEn',
      header: 'Template Name',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(item)}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  // Pagination
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header language={language} onLanguageChange={handleLanguageChange} userDetails={userDetails} />
      
      {/* Logo Section */}
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

            {/* Custom Table Layout matching Reference UI */}
            <div className="space-y-2">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 bg-[#0A3B4C] text-white p-4 rounded-md items-center text-sm font-semibold">
                <div className="col-span-4">Event Type</div>
                <div className="col-span-6">Template Name</div>
                <div className="col-span-2">Actions</div>
              </div>

              {/* Data Rows */}
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-center p-8 text-gray-500">Loading templates...</div>
                ) : currentItems.length === 0 ? (
                  <div className="bg-white p-8 rounded-md border text-center text-gray-500 shadow-sm">
                    No notification templates found
                  </div>
                ) : (
                  currentItems.map((item, index) => (
                    <div 
                      key={item.NotificationID || index} 
                      className="grid grid-cols-12 gap-4 bg-white p-4 rounded-md border shadow-sm items-center text-sm transition-colors hover:bg-gray-50"
                    >
                      <div className="col-span-4 font-medium text-gray-900">{item.EventTypeEn}</div>
                      <div className="col-span-6 text-gray-700">{item.NotificationTitleEn}</div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          title="Edit"
                          className="h-8 w-8 text-gray-500 hover:text-[#0A3B4C]"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleView(item)}
                          title="View"
                          className="h-8 w-8 text-gray-500 hover:text-[#0A3B4C]"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination & Total Count */}
              <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
                <div>Total: {templates.length}</div>
                
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="mx-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === totalPages} 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </main>

      </div>

      <Footer />
    </div>
  )
}
