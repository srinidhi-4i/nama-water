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
import { getColumns } from "@/app/customnotification/columns"

export default function CustomNotificationList() {
  const router = useRouter()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [userDetails, setUserDetails] = useState<any>(null)
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

    try {
      const userData = authService.getCurrentUser()
      if (userData && userData.BranchUserDetails && userData.BranchUserDetails.length > 0) {
        setUserDetails(userData.BranchUserDetails[0])
      }
    } catch (error) {
      console.error('Error loading user details:', error)
    }

    loadMenuData()
    loadEventTypes()
    loadNotifications()
  }, [router, currentPage]) // added currentPage dependency to trigger reload on page change? Or loadNotifications uses currentPage state.

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

  const columns = getColumns(handleEdit, handleView);

  if (showCreate) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header language={language} onLanguageChange={handleLanguageChange} userDetails={userDetails} />
        <div className="flex flex-1">
          <Sidebar menuItems={menuItems} language={language} />
          <div className="flex-1 flex flex-col">
            <LogoSection />
            <main className="flex-1 bg-gray-50 p-6">
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
        <Header language={language} onLanguageChange={handleLanguageChange} userDetails={userDetails} />
        <div className="flex flex-1">
          <Sidebar menuItems={menuItems} language={language} />
          <div className="flex-1 flex flex-col">
            <LogoSection />
            <main className="flex-1 bg-gray-50 p-6">
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
      <Header language={language} onLanguageChange={handleLanguageChange} userDetails={userDetails} />
       <LogoSection />
      <div className="flex flex-1">
        <Sidebar menuItems={menuItems} language={language} />

          <main className="flex-1 bg-gray-50 p-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 text-teal-900 hover:text-teal-800 hover:bg-teal-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <h1 className="text-2xl font-semibold text-teal-900 mb-6">
              Custom Notification
            </h1>

            <Card className="mb-6">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {/* Date Inputs replaced with FloatingLabelInput */}
                   <div className="flex gap-2">
                       <FloatingLabelInput 
                          type="date"
                          label="From Date"
                          id="fromDate"
                          value={fromDate ? format(fromDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => setFromDate(e.target.value ? new Date(e.target.value) : undefined)}
                          className="w-full bg-white"
                       />
                       <FloatingLabelInput 
                          type="date"
                          label="To Date"
                          id="toDate"
                          value={toDate ? format(toDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => setToDate(e.target.value ? new Date(e.target.value) : undefined)}
                          className="w-full bg-white"
                       />
                   </div>

                  <div className="relative">
                    <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                      <SelectTrigger id="eventType" className="bg-white h-[50px] pt-4">
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
                  
                  <div>
                    <FloatingLabelInput
                        id="search"
                        label="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="bg-white"
                    />
                  </div>

                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSearch} className="bg-[#1F4E58] hover:bg-[#163a42] text-white">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline" onClick={handleClearFilters} className="text-[#1F4E58] border-[#1F4E58]">
                    Clear Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

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
          </main>
      </div>

      <Footer />
    </div>
  )
}
