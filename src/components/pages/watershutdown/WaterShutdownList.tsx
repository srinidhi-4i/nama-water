"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { waterShutdownService } from "@/services/watershutdown.service"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { FloatingLabelInput, FloatingLabel } from "@/components/ui/floating-label"
import { 
  WaterShutdownNotification, 
  WaterShutdownFilters,
  Region,
  EventType,
  RegionItem,
  EventTypeItem
} from "@/types/watershutdown.types"
import { format } from "date-fns"
import Link from "next/link"
import { getWaterShutdownColumns } from "@/app/(dashboard)/watershutdown/list/columns"
import { NotificationViewEdit } from "@/components/watershutdown/notification-view-edit"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"

export default function WaterShutdownList() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WaterShutdownList.tsx:24',message:'WaterShutdownList component started',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const router = useRouter()
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WaterShutdownList.tsx:29',message:'Before useLanguage hook',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  const { language } = useLanguage()
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WaterShutdownList.tsx:32',message:'After useLanguage hook',data:{language},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
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

  // View/Edit State
  const [showViewEdit, setShowViewEdit] = useState(false)
  const [viewMode, setViewMode] = useState<"view" | "edit">("view")
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WaterShutdownList.tsx:47',message:'useEffect triggered',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WaterShutdownList.tsx:200',message:'Before return JSX',data:{showViewEdit,hasSelectedId:!!selectedNotificationId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden">
      <PageHeader
        language={language}
        titleEn="Water Shutdown Notification"
        titleAr="إشعارات إغلاق المياه"
        breadcrumbEn="Water Shutdown Notification"
        breadcrumbAr="إشعارات إغلاق المياه"
      />
      
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
                <div className="relative">
                  <Select value={selectedRegion} onValueChange={(value) => setSelectedRegion(value as Region | "ALL")}>
                    <SelectTrigger id="region" className="bg-white w-full h-[50px] pt-4">
                      <SelectValue placeholder=" " />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {regionMaster.map((region, index) => (
                         <SelectItem key={`${region.RegionID}-${index}`} value={region.RegionCode?.trim()}>
                            {region.RegionName || region.RegionCode}
                         </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FloatingLabel htmlFor="region">{language === "EN" ? `Region` : `المنطقة`}</FloatingLabel>
                </div>

                <div className="relative">
                  <FloatingLabelInput 
                      type="date" 
                      id="fromDate"
                      label={language === "EN" ? `From Date` : `تاريخ البدء`}
                      value={fromDate ? format(fromDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setFromDate(e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full bg-white"
                  />
                </div>

                <div className="relative">
                  <FloatingLabelInput 
                      type="date" 
                      id="toDate"
                      label={language === "EN" ? `To Date` : `تاريخ الانتهاء`}
                      value={toDate ? format(toDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setToDate(e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full bg-white"
                  />
                </div>

                <div className="flex items-end gap-2 pb-[1px]">
                  <Button onClick={handleSearch} className="bg-[#1F4E58] hover:bg-[#163a42] text-white px-6">
                    {language === "EN" ? `Search` : `بحث`}
                  </Button>
                  <Button variant="outline" onClick={handleClearFilters} className="text-[#1F4E58] border-[#1F4E58] hover:bg-teal-50 px-6">
                    {language === "EN" ? `Clear Filter` : `مسح الفلاتر`}
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
                  <FloatingLabel htmlFor="eventType">{language === "EN" ? `Event Type` : `نوع الحدث`}</FloatingLabel>
                </div>

                <div className="relative lg:col-span-1">
                  <FloatingLabelInput
                      id="search"
                      label={language === "EN" ? `Search` : `بحث`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="bg-white w-full"
                  />
                </div>

                <div className="flex items-end gap-2 md:col-span-2 lg:col-span-2 pb-[1px]">
                  <Button variant="default" onClick={handleExport} className="bg-[#1F4E58] hover:bg-[#163a42] text-white">
                    {language === "EN" ? `Export Excel` : `تصدير إلى Excel`}
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
                    {language === "EN" ? `Create New Notification` : `إنشاء إشعار جديد`}
                  </Button>
                </div>
              </div>
            </div>
            
            <div >
              <DataTable
                data={notifications}
                columns={tableColumns}
                isLoading={isLoading || isDetailLoading}
                emptyMessage={language === "EN" ? `No water shutdown notifications found` : `لا يوجد إشعارات إغلاق المياه`}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
