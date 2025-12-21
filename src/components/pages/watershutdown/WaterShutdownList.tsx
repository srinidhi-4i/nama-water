"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth.service"
import { waterShutdownService } from "@/services/watershutdown.service"
import { menuService } from "@/services/menu.service"
import { Header } from "@/components/layout/Header"
import { LogoSection } from "@/components/layout/LogoSection"
import { Sidebar } from "@/components/layout/Sidebar"
import { Footer } from "@/components/layout/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label" // Replaced by FloatingLabel
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { FloatingLabelInput, FloatingLabel } from "@/components/ui/floating-label"
// import { DateRangePicker } from "@/components/ui/date-range-picker" // Not used in reference code block?
import { Search } from "lucide-react"
import { 
  WaterShutdownNotification, 
  WaterShutdownFilters,
  Region,
  EventType,
  RegionItem,
  EventTypeItem
} from "@/types/watershutdown.types"
import { MenuItem } from "@/types/menu"
import { format } from "date-fns"
import Link from "next/link"
import { getWaterShutdownColumns } from "@/app/watershutdown/shutdownNotification/columns"
import { NotificationViewEdit } from "@/components/watershutdown/notification-view-edit"

import { useAuth } from "@/components/providers/AuthProvider"

export default function WaterShutdownList() {
  const router = useRouter()
  const { userDetails } = useAuth()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [notifications, setNotifications] = useState<WaterShutdownNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Master Data
  const [regionMaster, setRegionMaster] = useState<RegionItem[]>([])
  const [eventMaster, setEventMaster] = useState<EventTypeItem[]>([])

  // Filter states
  const [selectedRegion, setSelectedRegion] = useState<Region | "ALL">("ALL")
  const [selectedEventType, setSelectedEventType] = useState<EventType | "ALL">("ALL")
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // View/Edit State
  const [showViewEdit, setShowViewEdit] = useState(false)
  const [viewMode, setViewMode] = useState<"view" | "edit">("view")
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  useEffect(() => {
    loadMenuData()
    loadMasterData()
    loadNotifications()
  }, [])

  const loadMasterData = async () => {
    try {
        const data = await waterShutdownService.getWaterShutdownMasterData();
        setRegionMaster(data.regions);
        setEventMaster(data.eventTypes);
    } catch (error) {
        console.error('Error loading master data', error)
    }
  }

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
      }

      const response = await waterShutdownService.getNotifications(filters)
      setNotifications(response.data)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    loadNotifications()
  }

  const handleClearFilters = () => {
    setSelectedRegion("ALL")
    setSelectedEventType("ALL")
    setFromDate(undefined)
    setToDate(undefined)
    setSearchQuery("")
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

  const handleView = async (id: string) => {
    setIsDetailLoading(true)
    try {
      // Pre-fetch to ensure fresh data
      await waterShutdownService.getNotificationById(id)
      setSelectedNotificationId(id)
      setViewMode("view")
      setShowViewEdit(true)
    } catch (error) {
      console.error('Error fetching notification data:', error)
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleEdit = async (id: string) => {
    setIsDetailLoading(true)
    try {
      // Pre-fetch to ensure fresh data
      await waterShutdownService.getNotificationById(id)
      setSelectedNotificationId(id)
      setViewMode("edit")
      setShowViewEdit(true)
    } catch (error) {
      console.error('Error fetching notification data:', error)
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleBack = () => {
    setShowViewEdit(false)
    setSelectedNotificationId(null)
    loadNotifications() // Refresh list
  }

  const tableColumns = getWaterShutdownColumns({
      onView: handleView,
      onDownload: (id: string) => console.log("Download", id),
      onEdit: handleEdit,
      onSMS: (id: string) => console.log("SMS", id),
      onComplete: (id: string) => console.log("Complete", id),
  }); // In a real app, wrap in useMemo

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

        <main className="flex-1 bg-slate-100  overflow-x-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 px-2 shadow-md">
                 <div className="flex items-center gap-4 text-center sm:text-left h-12 ">
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
            <div className="px-6">
            {showViewEdit && selectedNotificationId ? (
              <NotificationViewEdit 
                notificationId={selectedNotificationId}
                mode={viewMode}
                onBack={handleBack}
                language={language}
              />
            ) : (
              <>
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                   {/* ... filters ... */}
                <div className="relative">
                  <Select value={selectedRegion} onValueChange={(value) => setSelectedRegion(value as Region | "ALL")}>
                    <SelectTrigger id="region" className="bg-white w-full h-[50px] pt-4">
                      <SelectValue placeholder=" " />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {regionMaster.map((region) => (
                         <SelectItem key={region.RegionID} value={region.RegionCode?.trim()}>
                            {region.RegionName || region.RegionCode}
                         </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FloatingLabel htmlFor="region">Region</FloatingLabel>
                </div>

                <div className="relative">
                  <FloatingLabelInput 
                      type="date" 
                      id="fromDate"
                      label="From Date"
                      value={fromDate ? format(fromDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setFromDate(e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full bg-white"
                  />
                </div>

                <div className="relative">
                  <FloatingLabelInput 
                      type="date" 
                      id="toDate"
                      label="To Date"
                      value={toDate ? format(toDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setToDate(e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full bg-white"
                  />
                </div>

                <div className="flex items-end gap-2 pb-[1px]">
                  <Button onClick={handleSearch} className="bg-[#1F4E58] hover:bg-[#163a42] text-white px-6">
                    Search
                  </Button>
                  <Button variant="outline" onClick={handleClearFilters} className="text-[#1F4E58] border-[#1F4E58] hover:bg-teal-50 px-6">
                    Clear Filter
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative lg:col-span-1">
                  <Select value={selectedEventType} onValueChange={(value) => setSelectedEventType(value as EventType | "ALL")}>
                    <SelectTrigger id="eventType" className="bg-white w-full h-[50px] pt-4">
                      <SelectValue placeholder=" " />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {eventMaster?.map((event) => (
                          <SelectItem key={event?.EventTypeID || Math.random()} value={event?.EventTypeCode || event?.EventTypeID?.toString() || ""}>
                            {event?.EventTypeName}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FloatingLabel htmlFor="eventType">Event Type</FloatingLabel>
                </div>

                <div className="relative lg:col-span-1">
                  <FloatingLabelInput
                      id="search"
                      label="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="bg-white w-full"
                  />
                </div>

                <div className="flex items-end gap-2 md:col-span-2 lg:col-span-2 pb-[1px]">
                  <Button variant="default" onClick={handleExport} className="bg-[#1F4E58] hover:bg-[#163a42] text-white">
                    Export Excel
                  </Button>
                  <Button 
                    onClick={async () => {
                      setIsDetailLoading(true);
                      await loadMasterData();
                      setIsDetailLoading(false);
                      console.log('Create new notification');
                    }} 
                    className="bg-[#E54B4B] hover:bg-[#d03b3b] text-white"
                  >
                    Create New Notification
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="px-6">
                <DataTable
                  data={notifications}
                  columns={tableColumns}
                  isLoading={isLoading || isDetailLoading}
                  emptyMessage="No water shutdown notifications found"
                />
            </div>
          </>
        )}
      </div>
              
          </main>
      </div>

      <Footer />
    </div>
  )
}
