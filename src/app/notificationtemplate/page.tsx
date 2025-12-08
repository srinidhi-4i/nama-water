"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth.service"
import { notificationService } from "@/services/notification.service"
import { Header } from "@/components/layout/Header"
import { LogoSection } from "@/components/layout/LogoSection"
import { Footer } from "@/components/layout/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable, Column } from "@/components/ui/data-table"
import { Bell, Eye, Edit } from "lucide-react"
import { NotificationTemplate } from "@/types/notification.types"
import { TemplateViewEdit } from "../../components/notification/template-view-edit"

export default function NotificationTemplatePage() {
  const router = useRouter()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
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
    loadTemplates()
  }, [router, currentPage])

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

  const handleView = (template: NotificationTemplate) => {
    setSelectedTemplate(template)
    setViewMode("view")
    setShowViewEdit(true)
  }

  const handleEdit = (template: NotificationTemplate) => {
    setSelectedTemplate(template)
    setViewMode("edit")
    setShowViewEdit(true)
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
        <Header language={language} onLanguageChange={handleLanguageChange} />
        <LogoSection />
        
        <main className="flex-1 overflow-auto bg-gradient-to-br from-cyan-50 to-blue-50 p-6">
          <div className="max-w-7xl mx-auto">
            <TemplateViewEdit
              template={selectedTemplate}
              mode={viewMode}
              onBack={handleBack}
            />
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header language={language} onLanguageChange={handleLanguageChange} />
      <LogoSection />
      
      <main className="flex-1 overflow-auto bg-gradient-to-br from-cyan-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.push('/branchhome')}
              className="mb-4"
            >
              ← Back to Home
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="h-8 w-8 text-blue-600" />
              Notification Templates
            </h1>
            <p className="text-gray-600 mt-2">View and edit notification templates</p>
          </div>

          {/* Templates Table */}
          <Card>
            <CardContent className="pt-6">
              <DataTable
                data={currentItems}
                columns={columns}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
                emptyMessage="No notification templates found"
              />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
