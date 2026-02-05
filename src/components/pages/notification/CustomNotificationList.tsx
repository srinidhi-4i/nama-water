"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileSpreadsheet } from "lucide-react"
import { notificationService } from "@/services/notification.service"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { FloatingLabelInput, FloatingLabel } from "@/components/ui/floating-label"
import { CustomNotification, EventType } from "@/types/notification.types"
import { format } from "date-fns"
import { CreateNotification } from "@/components/notification/create-notification"
import { EditNotification } from "@/components/notification/edit-notification"
import { getCustomNotificationColumns } from "@/app/(dashboard)/notification-center/custom/columns"
import { useLanguage } from "@/components/providers/LanguageProvider"
import Link from "next/link"
import PageHeader from "@/components/layout/PageHeader"

export default function CustomNotificationList() {
  const router = useRouter()
  const { language } = useLanguage()
  const [notifications, setNotifications] = useState<CustomNotification[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
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
    loadEventTypes()
    loadNotifications()
  }, [])

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
      }

      const response = await notificationService.getNotifications(filters)
      setNotifications(response.Table || [])
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
    setSelectedEventType("ALL")
    setFromDate(undefined)
    setToDate(undefined)
    setSearchQuery("")
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

  const handleView = (notification: CustomNotification) => {
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

  const columns = getCustomNotificationColumns(handleEdit, handleView);

  if (showCreate) {
    return (
      <div className="flex-1 bg-slate-100 overflow-x-hidden ">
        <div className="px-6">
          <CreateNotification onBack={handleBack} />
        </div>
      </div>
    )
  }

  if (showEdit && selectedNotification) {
    return (
      <div className="flex-1 bg-slate-100 overflow-x-hidden ">
        <div className="px-6">
          <EditNotification notification={selectedNotification} onBack={handleBack} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden ">
      
      <PageHeader
        language={language}
        titleEn="Custom Notification"
        titleAr="الإشعار المخصص"
        breadcrumbEn="Custom Notification List"
        breadcrumbAr="قائمة الإشعارات المخصصة"
      />


      <div className="px-6 mt-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <FloatingLabelInput 
                type="date"
                label="From Date"
                id="fromDate"
                value={fromDate ? format(fromDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setFromDate(e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full bg-white h-[50px]"
              />
            </div>
            <div className="relative">
              <FloatingLabelInput 
                type="date"
                label="To Date"
                id="toDate"
                value={toDate ? format(toDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setToDate(e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full bg-white h-[50px]"
              />
            </div>

            <div className="relative">
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger id="eventType" className="bg-white w-full h-[50px] pt-4">
                  <SelectValue placeholder=" " />
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
              <FloatingLabel htmlFor="eventType">Event Type</FloatingLabel>
            </div>
            
            <div className="relative">
              <FloatingLabelInput
                id="search"
                label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-white w-full h-[50px]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="flex items-end gap-2 pb-[1px]">
              <Button onClick={handleSearch} className="bg-[#1F4E58] hover:bg-[#163a42] text-white px-6">
                Search
              </Button>
              <Button variant="outline" onClick={handleClearFilters} className="text-[#1F4E58] border-[#1F4E58] hover:bg-teal-50 px-6">
                Clear Filter
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {notifications.length > 0 && (
                <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto text-[#1F4E58] border-[#1F4E58]">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              )}
              <Button onClick={() => setShowCreate(true)} className="bg-[#E54B4B] hover:bg-[#d03b3b] text-white w-full sm:w-auto px-6">
                Create New Notification
              </Button>
            </div>
          </div>
        </div>
        
        <div>
          <DataTable
            data={notifications}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No custom notifications found"
          />
        </div>
      </div>
    </div>
  )
}

