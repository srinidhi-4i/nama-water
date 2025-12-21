"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Search, FileSpreadsheet } from "lucide-react"
import { authService } from "@/services/auth.service"
import { notificationService } from "@/services/notification.service"
import { menuService } from "@/services/menu.service"
import { Header } from "@/components/layout/Header"
import { LogoSection } from "@/components/layout/LogoSection"
import { Sidebar } from "@/components/layout/Sidebar"
import { Footer } from "@/components/layout/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { FloatingLabelInput, FloatingLabel } from "@/components/ui/floating-label"
// import { DateRangePicker } from "@/components/ui/date-range-picker" // Replacing with FloatingLabel inputs
import { CustomNotification, EventType } from "@/types/notification.types"
import { MenuItem } from "@/types/menu"
import { format } from "date-fns"
import { CreateNotification } from "@/components/notification/create-notification"
import { EditNotification } from "@/components/notification/edit-notification"
import { getCustomNotificationColumns } from "@/app/notifications-center/customnotification/columns"
import { useAuth } from "@/components/providers/AuthProvider"
import Link from "next/link"

export default function CustomNotificationList() {
  const router = useRouter()
  const { userDetails } = useAuth()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  // const [userDetails, setUserDetails] = useState<any>(null) // Handled by useAuth
  const [notifications, setNotifications] = useState<CustomNotification[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Filter states
  const [selectedEventType, setSelectedEventType] = useState<string>("ALL")
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // View states
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<CustomNotification | null>(null)

  useEffect(() => {
    loadMenuData()
    loadEventTypes()
    loadNotifications()
  }, [])

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

  const handleLanguageChange = (lang: "EN" | "AR") => {
    setLanguage(lang)
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
          <div className="flex-1 flex flex-col bg-slate-100 overflow-x-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 px-2 shadow-md">
                 <div className="flex items-center gap-4 text-center sm:text-left h-12">
                    <h1 className="text-2xl font-bold text-[#006A72]">
                      Custom Notification creation
                    </h1>
                 </div>
                 
                <div className="text-sm text-gray-500">
                  <Link 
                    href="/branchhome"
                    className="font-semibold text-[#006A72] hover:underline cursor-pointer"
                  >
                    Home
                  </Link>
                  <span> &gt; create new Custom Notification </span>
                </div>
            </div>
            <main className="flex-1 px-6 pb-6">
              <CreateNotification onBack={handleBack} />
            </main>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (showEdit && selectedNotification) {
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
          <div className="flex-1 flex flex-col bg-slate-100 overflow-x-hidden">
             <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 px-2 shadow-md bg-white">
                 <div className="flex items-center gap-4 text-center sm:text-left h-12">
                    <h1 className="text-2xl font-bold text-[#006A72]">
                      Custom Notification Edit
                    </h1>
                 </div>
                 
                <div className="text-sm text-gray-500">
                  <Link 
                    href="/branchhome"
                    className="font-semibold text-[#006A72] hover:underline cursor-pointer"
                  >
                    Home
                  </Link>
                  <span> &gt; Edit Custom Notification </span>
                </div>
            </div>
            <main className="flex-1 px-6 pb-6">
              <EditNotification notification={selectedNotification} onBack={handleBack} />
            </main>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

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
                 <div className="flex items-center gap-4 text-center sm:text-left h-12">
                    <h1 className="text-2xl font-bold text-[#006A72]">
                      Custom Notification
                    </h1>
                 </div>
                 
                <div className="text-sm text-gray-500">
                  <Link 
                    href="/branchhome"
                    className="font-semibold text-[#006A72] hover:underline cursor-pointer"
                  >
                    Home
                  </Link>
                  <span> &gt; Custom Notification List</span>
                </div>
            </div>

            
          <div className="px-6">
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
            
            {/* <div className="text-sm text-gray-600 mb-4">
              Total: {notifications.length} notifications
            </div> */}
          </div>

           <div className="px-6">
                <DataTable
                  data={notifications}
                  columns={columns}
                  isLoading={isLoading}
                  emptyMessage="No custom notifications found"
                />
              </div>
          </main>
      </div>

      <Footer />
    </div>
  )
}
