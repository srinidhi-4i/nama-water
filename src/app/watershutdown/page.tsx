"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { authService } from "@/services/auth.service"
import { waterShutdownService } from "@/services/watershutdown.service"
import { menuService } from "@/services/menu.service"
import { Header } from "@/components/layout/Header"
import { LogoSection } from "@/components/layout/LogoSection"
import { Sidebar } from "@/components/layout/Sidebar"
import { Footer } from "@/components/layout/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, Column } from "@/components/ui/data-table"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Search, Download, Eye, Edit, Copy, FileSpreadsheet } from "lucide-react"
import { 
  WaterShutdownNotification, 
  WaterShutdownFilters,
  Region,
  EventType,
  WaterShutdownStatus 
} from "@/types/watershutdown.types"
import { MenuItem } from "@/types/menu"
import { format } from "date-fns"
import Link from "next/link"

export default function WaterShutdownPage() {
  const router = useRouter()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [userDetails, setUserDetails] = useState<any>(null)
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
    loadNotifications()
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
      header: 'Event Name', // Matches Reference "Event Name"
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
      header: 'C/L Actions', // Matches Reference
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('View', item.eventId)}
            title="View"
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4 text-[#006A72]" /> {/* Teal color */}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('Download', item.eventId)}
            title="Download"
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4 text-[#006A72]" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('Edit', item.eventId)}
            title="Edit"
            className="h-8 w-8 p-0"
            disabled={item.status === 'COMPLETED'} // Disable if completed/cancelled matches logic
          >
            <Edit className="h-4 w-4 text-[#006A72]" />
          </Button>
           {/* Intermediate SMS Action */}
           {/* Logic to show/enable based on status would go here, enabled for demo */}
           <Button 
            variant="ghost" 
            size="sm" 
            title="Intermediate SMS"
            className="h-8 w-8 p-0"
            onClick={() => console.log('Intermediate SMS', item.eventId)}
           >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006A72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square-text"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/></svg>
           </Button>

           {/* Completion Notification Action */}
           <Button 
            variant="ghost" 
            size="sm" 
            title="Completion Notification"
            className="h-8 w-8 p-0"
            onClick={() => console.log('Completion', item.eventId)}
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006A72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
           </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Header language={language} onLanguageChange={handleLanguageChange} userDetails={userDetails} />
       {/* Main Layout: Sidebar + Content */}
      {/* Logo Section */}
      <LogoSection />
      <div className="flex flex-1">
        <Sidebar menuItems={menuItems} language={language} />

        <main className="flex-1 bg-gray-50 p-6 overflow-x-hidden"> 
            {/* Header with Back Button and Breadcrumb */}
            <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-4">
                   <Button
                      variant="ghost"
                      onClick={() => router.back()}
                      className="p-0 hover:bg-transparent"
                    >
                      
                    </Button>
                    <h1 className="text-2xl font-bold text-[#006A72]">
                      Nama Water Operation Notification
                    </h1>
                 </div>
                 
                <div className="text-sm text-gray-500">
  <Link 
    href="/branchhome"
    className="font-semibold text-[#006A72] hover:underline cursor-pointer"
  >
    Home
  </Link>
  <span> &gt; Water Shutdown Notification</span>
</div>
            </div>

            {/* Filters Section matching Reference UI Layout Exactly */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              
              {/* Row 1: Region, Dates, Search Actions */}
              <div className="flex flex-wrap items-end gap-4 mb-6">
                <div className="w-64">
                   <div className="flex items-center gap-4">
                      <Label htmlFor="region" className="text-sm font-bold text-gray-700 w-16">Region</Label>
                      <Select value={selectedRegion} onValueChange={(value) => setSelectedRegion(value as Region | "ALL")}>
                        <SelectTrigger id="region" className="bg-white flex-1">
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
                </div>

                <div className="flex items-center gap-2">
                    <Label htmlFor="fromDate" className="text-sm font-bold text-gray-700 whitespace-nowrap">From Date</Label>
                    <Input 
                        type="date" 
                        id="fromDate"
                        value={fromDate ? format(fromDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setFromDate(e.target.value ? new Date(e.target.value) : undefined)}
                        className="w-[150px] bg-white"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Label htmlFor="toDate" className="text-sm font-bold text-gray-700 whitespace-nowrap">To Date</Label>
                    <Input 
                        type="date" 
                        id="toDate"
                        value={toDate ? format(toDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setToDate(e.target.value ? new Date(e.target.value) : undefined)}
                        className="w-[150px] bg-white"
                    />
                </div>

                <div className="flex gap-2 ml-auto">
                    <Button onClick={handleSearch} className="bg-[#1F4E58] hover:bg-[#163a42] text-white w-24">
                        Search
                    </Button>
                    <Button variant="outline" onClick={handleClearFilters} className="text-[#1F4E58] border-[#1F4E58] hover:bg-teal-50 w-24">
                        Clear Filter
                    </Button>
                </div>
              </div>

              {/* Row 2: Event Type, Global Search, Export, Create */}
              <div className="flex flex-wrap items-center gap-4">
                 <div className="w-auto min-w-[300px]">
                   <div className="flex items-center gap-4">
                      <Label htmlFor="eventType" className="text-sm font-bold text-gray-700 whitespace-nowrap w-20">Event Type</Label>
                      <Select value={selectedEventType} onValueChange={(value) => setSelectedEventType(value as EventType | "ALL")}>
                        <SelectTrigger id="eventType" className="bg-white flex-1 min-w-[200px]">
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

                 <div className="flex-1 min-w-[200px]">
                      <Input
                          placeholder="Search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          className="bg-white w-full"
                      />
                 </div>

                 <div className="flex gap-2 shrink-0">
                    <Button variant="default" onClick={handleExport} className="bg-[#1F4E58] hover:bg-[#163a42] text-white">
                      Export Excel
                    </Button>
                    <Button onClick={() => console.log('Create new notification')} className="bg-[#E54B4B] hover:bg-[#d03b3b] text-white">
                      Create New Notification
                    </Button>
                 </div>
              </div>

            </div>

            {/* Data Table */}
            <Card>
              <CardContent className="p-0">
                  {/* Table styling to match verified reference - Blue headers */}
                 <div className="rounded-md border overflow-hidden">
                    <DataTable
                      data={notifications}
                      columns={columns}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      isLoading={isLoading}
                      emptyMessage="No water shutdown notifications found"
                    />
                 </div>
              </CardContent>
            </Card>
          </main>
        
        {/* Footer was here but layout suggests full page wrapper, ensuring footer is outside flex-1 if needed, 
            but referencing NotificationPage, footer is after flex-1 container. 
            The structure in page.tsx shows <div className="flex flex-col min-h-screen"> ... <div flex-1> ... </div> <Footer /> </div>
            So removing the extra wrapper is correct.
        */}
      </div>

      <Footer />
    </div>
  )
}
