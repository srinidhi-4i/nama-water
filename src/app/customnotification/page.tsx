"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth.service"
import { notificationService } from "@/services/notification.service"
import { Header } from "@/components/layout/Header"
import { LogoSection } from "@/components/layout/LogoSection"
import { Footer } from "@/components/layout/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, Column } from "@/components/ui/data-table"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Bell, Search, FileSpreadsheet, Eye, Edit } from "lucide-react"
import { CustomNotification, EventType } from "@/types/notification.types"
import { format } from "date-fns"
import { CreateNotification } from "@/components/notification/create-notification"
import { EditNotification } from "@/components/notification/edit-notification"

export default function CustomNotificationPage() {
  const router = useRouter()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
  const [notifications, setNotifications] = useState<CustomNotification[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filter states
  const [selectedEventType, setSelectedEventType] = useState<string>("ALL")
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()
  const [searchQuery, setSearchQuery] = useState("")

  // View states
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<CustomNotification | null>(null)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login')
      return
    }
    loadEventTypes()
    loadNotifications()
  }, [router])

  const loadEventTypes = async () => {
    try {
      const response = await notificationService.getTemplates()
      setEventTypes(response.EventType || [])
    } catch (error) {
      console.error('Error loading event types:', error)
    }
  }

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const filters = {
        fromDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
        toDate: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
        eventCode: selectedEventType !== "ALL" ? selectedEventType : undefined,
        searchQuery: searchQuery || undefined,
        page: currentPage,
        pageSize: 5,
      }

      const response = await notificationService.getNotifications(filters)
      setNotifications(response.Table || [])
      setTotalPages(Math.ceil((response.TotalCount || 0) / 5))
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadNotifications()
  }

  const handleClearFilters = () => {
    setSelectedEventType("ALL")
    setFromDate(undefined)
    setToDate(undefined)
    setSearchQuery("")
    setCurrentPage(1)
    setTimeout(() => loadNotifications(), 100)
  }

  const handleExport = async () => {
    try {
      const filters = {
        fromDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
        toDate: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
        eventCode: selectedEventType !== "ALL" ? selectedEventType : undefined,
        searchQuery: searchQuery || undefined,
      }

      const blob = await notificationService.exportToExcel(filters)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `custom-notifications-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Export functionality is not yet available')
    }
  }

  const handleLanguageChange = (lang: "EN" | "AR") => {
    setLanguage(lang)
  }

  const handleView = (notification: CustomNotification) => {
    // TODO: Implement view modal
    console.log('View notification:', notification)
  }

  const handleEdit = (notification: CustomNotification) => {
    setSelectedNotification(notification)
    setShowEdit(true)
  }

  const handleBack = () => {
    setShowCreate(false)
    setShowEdit(false)
    setSelectedNotification(null)
    loadNotifications()
  }

  const columns: Column<CustomNotification>[] = [
    {
      key: 'EventTypeEn',
      header: 'Event Type',
      className: 'font-medium',
    },
    {
      key: 'Status',
      header: 'Status',
    },
    {
      key: 'CreatedDateTime',
      header: 'Created Date and Time',
      render: (item) => format(new Date(item.CreatedDateTime), 'dd/MM/yyyy HH:mm'),
    },
    {
      key: 'ScheduledDateTime',
      header: 'Scheduled Date and Time',
      render: (item) => format(new Date(item.ScheduledDateTime), 'dd/MM/yyyy HH:mm'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(item)}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (showCreate) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header language={language} onLanguageChange={handleLanguageChange} />
        <LogoSection />
        
        <main className="flex-1 overflow-auto bg-gradient-to-br from-cyan-50 to-blue-50 p-6">
          <div className="max-w-7xl mx-auto">
            <CreateNotification onBack={handleBack} />
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  if (showEdit && selectedNotification) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header language={language} onLanguageChange={handleLanguageChange} />
        <LogoSection />
        
        <main className="flex-1 overflow-auto bg-gradient-to-br from-cyan-50 to-blue-50 p-6">
          <div className="max-w-7xl mx-auto">
            <EditNotification notification={selectedNotification} onBack={handleBack} />
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
              Custom Notification
            </h1>
            <p className="text-gray-600 mt-2">Create and manage custom notifications</p>
          </div>

          {/* Filters Card */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DateRangePicker
                  fromDate={fromDate}
                  toDate={toDate}
                  onFromDateChange={setFromDate}
                  onToDateChange={setToDate}
                />

                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                    <SelectTrigger id="eventType">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.EventTypeCode} value={type.EventTypeCode}>
                          {type.EventTypeEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by Event Type, Status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              Total: {notifications.length} notifications
            </div>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <Button variant="outline" onClick={handleExport}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              )}
              <Button onClick={() => setShowCreate(true)} className="bg-red-600 hover:bg-red-700">
                Create New Notification
              </Button>
            </div>
          </div>

          {/* Data Table */}
          <Card>
            <CardContent className="pt-6">
              <DataTable
                data={notifications}
                columns={columns}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
                emptyMessage="No custom notifications found"
              />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
