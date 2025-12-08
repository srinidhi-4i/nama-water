"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth.service"
import { waterShutdownService } from "@/services/watershutdown.service"
import { Header } from "@/components/layout/Header"
import { LogoSection } from "@/components/layout/LogoSection"
import { Footer } from "@/components/layout/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable, Column } from "@/components/ui/data-table"
import { FileText, Eye, Edit } from "lucide-react"
import { WaterShutdownTemplate } from "@/types/watershutdown.types"

export default function WaterShutdownTemplatesPage() {
  const router = useRouter()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
  const [templates, setTemplates] = useState<WaterShutdownTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login')
      return
    }
    loadTemplates()
  }, [router])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const data = await waterShutdownService.getTemplates()
      setTemplates(data)
      setTotalPages(Math.ceil(data.length / 10))
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLanguageChange = (lang: "EN" | "AR") => {
    setLanguage(lang)
  }

  const columns: Column<WaterShutdownTemplate>[] = [
    {
      key: 'eventType',
      header: 'Event Type',
      className: 'font-medium',
    },
    {
      key: 'templateType',
      header: 'Template Type',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('Edit', item.id)}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('View', item.id)}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  // Paginate templates
  const paginatedTemplates = templates.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Header language={language} onLanguageChange={handleLanguageChange} />
      <LogoSection />
      
      <main className="flex-1 overflow-auto bg-gradient-to-br from-cyan-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.push('/watershutdown')}
              className="mb-4"
            >
              ← Back to Water Shutdown Notification
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              Water Shut Down Templates
            </h1>
            <p className="text-gray-600 mt-2">
              Home &gt; Water Shutdown Notification
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center mb-4">
            <Button onClick={() => console.log('Create new template')}>
              Create New Template
            </Button>
          </div>

          {/* Data Table */}
          <Card>
            <CardContent className="pt-6">
              <DataTable
                data={paginatedTemplates}
                columns={columns}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
                emptyMessage="No templates found"
              />
            </CardContent>
          </Card>

          <div className="mt-4 text-sm text-gray-600">
            Total: {templates.length}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
