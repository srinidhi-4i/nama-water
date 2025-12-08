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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, Column } from "@/components/ui/data-table"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Bell, Search, Download, Eye, Edit, Copy, FileSpreadsheet } from "lucide-react"
import { 
  WaterShutdownNotification, 
  WaterShutdownFilters,
  Region,
  EventType,
  WaterShutdownStatus 
} from "@/types/watershutdown.types"
import { format } from "date-fns"

export default function WaterShutdownPage() {
  const router = useRouter()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
  const [notifications, setNotifications] = useState<WaterShutdownNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filter states
  const [selectedRegion, setSelectedRegion] = useState<Region | "ALL">("ALL")
  const [selectedEventType, setSelectedEventType] = useState<EventType | "ALL">("ALL")
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login')
      return
    }
    loadNotifications()
  }, [router, currentPage])

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const filters: WaterShutdownFilters = {
        region: selectedRegion !== "ALL" ? selectedRegion : undefined,
        eventType: selectedEventType !== "ALL" ? selectedEventType : undefined,
        fromDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
        toDate: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
        searchQuery: searchQuery || undefined,
        page: currentPage,
        pageSize: 10,
      }

      const response = await waterShutdownService.getNotifications(filters)
      setNotifications(response.data)
      setTotalPages(Math.ceil(response.total / (filters.pageSize || 10)))
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
    setSelectedRegion("ALL")
    setSelectedEventType("ALL")
    setFromDate(undefined)
    setToDate(undefined)
    setSearchQuery("")
    setCurrentPage(1)
  }

  const handleExport = async () => {
    try {
      const filters: WaterShutdownFilters = {
        region: selectedRegion !== "ALL" ? selectedRegion : undefined,
        eventType: selectedEventType !== "ALL" ? selectedEventType : undefined,
        fromDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
        toDate: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
        searchQuery: searchQuery || undefined,
      }

      const blob = await waterShutdownService.exportToExcel(filters)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `water-shutdown-notifications-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
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

  const getStatusBadge = (status: WaterShutdownStatus) => {
    switch (status) {
      case "SCHEDULED":
        return <Badge variant="secondary">Scheduled</Badge>
      case "CUSTOMER_TRIG":
        return <Badge variant="destructive">Customer Triggered</Badge>
      case "COMPLETED":
        return <Badge variant="default">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const columns: Column<WaterShutdownNotification>[] = [
    {
      key: 'eventId',
      header: 'Event ID',
      className: 'font-medium',
    },
    {
      key: 'eventType',
      header: 'Event Type',
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: 'region',
      header: 'Region',
    },
    {
      key: 'startDateTime',
      header: 'Start Date & Time',
      render: (item) => format(new Date(item.startDateTime), 'dd/MM/yyyy HH:mm'),
    },
    {
      key: 'endDateTime',
      header: 'End Date & Time',
      render: (item) => format(new Date(item.endDateTime), 'dd/MM/yyyy HH:mm'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('View', item.eventId)}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('Download', item.eventId)}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('Edit', item.eventId)}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('Copy', item.eventId)}
            title="Copy"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

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
              Nama Water Operation Notification
            </h1>
            <p className="text-gray-600 mt-2">Manage water shutdown notifications and events</p>
          </div>

          {/* Filters Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search and Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Select value={selectedRegion} onValueChange={(value) => setSelectedRegion(value as Region | "ALL")}>
                    <SelectTrigger id="region">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="MUSCAT">MUSCAT</SelectItem>
                      <SelectItem value="DHOFAR">DHOFAR</SelectItem>
                      <SelectItem value="BATINAH">BATINAH</SelectItem>
                      <SelectItem value="SHARQIYAH">SHARQIYAH</SelectItem>
                      <SelectItem value="DAKHLIYAH">DAKHLIYAH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select value={selectedEventType} onValueChange={(value) => setSelectedEventType(value as EventType | "ALL")}>
                    <SelectTrigger id="eventType">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="Major Planned Event">Major Planned Event</SelectItem>
                      <SelectItem value="Minor Planned Event">Minor Planned Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DateRangePicker
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
              />

              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by Event ID, Region, or Reason..."
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
              <Button variant="outline" onClick={handleExport}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={() => console.log('Create new notification')}>
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
                emptyMessage="No water shutdown notifications found"
              />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
