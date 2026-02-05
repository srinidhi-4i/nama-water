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
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
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
  const [showView, setShowView] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<CustomNotification | null>(null)

  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const notificationId = searchParams.get('id')

  useEffect(() => {
    loadEventTypes()
    loadNotifications()
  }, [])

  useEffect(() => {
    if (mode === 'edit' || mode === 'view') {
      if (notificationId && notifications.length > 0) {
        const found = notifications.find(n => {
          let idValue = (n as any).NotificationId ?? 
                          (n as any).NotificationID ?? 
                          (n as any).NotificationRquestID ?? 
                          (n as any).id ?? 
                          (n as any).ID ??
                          (n as any).EventId ??
                          (n as any).EventID ??
                          (n as any).NotificationUniqueId;
          
          if (!idValue) {
            const idKey = Object.keys(n).find(k => k.toLowerCase().includes('id'));
            if (idKey) idValue = (n as any)[idKey];
          }

          return idValue?.toString() === notificationId;
        })
        if (found) {
          setSelectedNotification(found)
          setShowEdit(mode === 'edit')
          setShowView(mode === 'view')
        }
      }
    } else if (mode === 'create') {
      setShowCreate(true)
    } else {
      setShowCreate(false)
      setShowEdit(false)
      setShowView(false)
      setSelectedNotification(null)
    }
  }, [mode, notificationId, notifications])

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

  const handleExport = () => {
    try {
      // Use SpreadsheetML (Excel XML) format for a real Excel experience without external libraries
      const headers = [
        "Event Type",
        "Status",
        "Created Date and Time",
        "Scheduled Date and Time",
        "User Type"
      ];

      // Map data to rows with fallbacks
      const rows = notifications.map(item => {
        const eventType = item.EventTypeEn || (item as any).EventTypeName || (item as any).EventName || '';
        const status = item.Status || (item as any).StatusCode || '';
        
        // Robust date fallbacks
        const createdDateVal = item.CreatedDateTime || (item as any).CreatedDate || (item as any).CreationDate;
        const createdDateStr = createdDateVal ? format(new Date(createdDateVal), 'dd/MM/yyyy HH:mm') : '';
        
        const scheduledDateVal = item.ScheduledDateTime || (item as any).NotificationScheduledDatetime || (item as any).NotificationScheduledDate || (item as any).ScheduledDate;
        const scheduledDateStr = scheduledDateVal ? format(new Date(scheduledDateVal), 'dd/MM/yyyy HH:mm') : '';
        
        const userType = item.UserType === 'REGISTERED' || (item as any).UserType === 'RGUSR' ? 'Registered Users' : 'All Users';

        return [eventType, status, createdDateStr, scheduledDateStr, userType];
      });

      // Build XML for Excel
      let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">
<Worksheet ss:Name="Notifications">
<Table>
<Column ss:AutoFitWidth="1" ss:Width="150"/>
<Column ss:AutoFitWidth="1" ss:Width="100"/>
<Column ss:AutoFitWidth="1" ss:Width="130"/>
<Column ss:AutoFitWidth="1" ss:Width="130"/>
<Column ss:AutoFitWidth="1" ss:Width="100"/>
<Row ss:StyleID="Header">
${headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('\n')}
</Row>
${rows.map(row => `
<Row>
${row.map(cell => `<Cell><Data ss:Type="String">${String(cell || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`).join('\n')}
</Row>`).join('\n')}
</Table>
</Worksheet>
</Workbook>`;

      const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `custom-notifications-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Excel exported successfully");
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export data');
    }
  }

  const handleView = (notification: CustomNotification) => {
    let id = notification.NotificationId ?? 
             (notification as any).NotificationID ?? 
             (notification as any).NotificationRquestID ?? 
             (notification as any).id ?? 
             (notification as any).ID ??
             (notification as any).EventId ??
             (notification as any).EventID ??
             (notification as any).NotificationUniqueId;

    if (!id) {
      const idKey = Object.keys(notification).find(k => k.toLowerCase().includes('id'));
      if (idKey) id = (notification as any)[idKey];
    }

    router.push(`/notification-center/custom?mode=view&id=${id}`)
  }

  const handleEdit = (notification: CustomNotification) => {
    let id = notification.NotificationId ?? 
             (notification as any).NotificationID ?? 
             (notification as any).NotificationRquestID ?? 
             (notification as any).id ?? 
             (notification as any).ID ??
             (notification as any).EventId ??
             (notification as any).EventID ??
             (notification as any).NotificationUniqueId;

    if (!id) {
      const idKey = Object.keys(notification).find(k => k.toLowerCase().includes('id'));
      if (idKey) id = (notification as any)[idKey];
    }
    
    router.push(`/notification-center/custom?mode=edit&id=${id}`)
  }

  const handleBack = () => {
    router.push('/notification-center/custom')
    setNotifications([]) // Force visible refresh
    setTimeout(() => {
      loadNotifications()
    }, 100)
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

  if ((mode === 'edit' || mode === 'view') && !selectedNotification && isLoading) {
    return (
      <div className="flex-1 bg-slate-100 flex items-center justify-center min-h-[400px]">
        <div className="text-[#1F4E58] font-medium animate-pulse">Loading notification...</div>
      </div>
    )
  }

  if ((showEdit || showView) && selectedNotification) {
    return (
      <div className="flex-1 bg-slate-100 overflow-x-hidden ">
        <div className="px-6">
          <EditNotification 
            notification={selectedNotification} 
            onBack={handleBack} 
            isViewOnly={showView} 
          />
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
        breadcrumbItems={[
          { labelEn: "Home", labelAr: "الرئيسية", href: "/branchhome" },
          { labelEn: "Custom Notification", labelAr: "الإشعار المخصص" }
        ]}
      />


      <div className="px-4 mt-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
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

            <div className="flex items-end gap-2 lg:col-start-4">
              <Button onClick={handleSearch} className="flex-1 bg-[#1F4E58] hover:bg-[#163a42] text-white">
                Search
              </Button>
              <Button variant="outline" onClick={handleClearFilters} className="flex-1 text-[#1F4E58]  hover:bg-teal-50 ">
                Clear Filter
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div className="relative">
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger id="eventType" className="bg-white w-full">
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
                className="bg-white w-full "
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:col-span-2 items-end justify-end ">
              {notifications.length > 0 && (
                <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto text-black ">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              )}
              <Button 
                onClick={() => router.push('/notification-center/custom?mode=create')} 
                className="bg-[#E54B4B] hover:bg-[#d03b3b] text-white w-full sm:w-auto "
              >
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

