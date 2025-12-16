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
  EventType
} from "@/types/watershutdown.types"
import { MenuItem } from "@/types/menu"
import { format } from "date-fns"
import Link from "next/link"
import { columns } from "@/app/watershutdown/columns"

export default function WaterShutdownList() {
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header language={language} onLanguageChange={handleLanguageChange} userDetails={userDetails} />
      <LogoSection />
      <div className="flex flex-1">
        <Sidebar menuItems={menuItems} language={language} />

        <main className="flex-1 bg-gray-50 p-6 overflow-x-hidden"> 
            <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-4">
                   <Button
                      variant="ghost"
                      onClick={() => router.back()}
                      className="p-0 hover:bg-transparent"
                    >
                      {/* Back Icon if needed */}
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

            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              
              <div className="flex flex-wrap items-end gap-4 mb-6">
                <div className="w-64">
                   <div className="relative">
                      <Select value={selectedRegion} onValueChange={(value) => setSelectedRegion(value as Region | "ALL")}>
                        <SelectTrigger id="region" className="bg-white flex-1 h-[50px] pt-4">
                          <SelectValue placeholder=" " />
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
                      <FloatingLabel htmlFor="region">Region</FloatingLabel>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                    <FloatingLabelInput 
                        type="date" 
                        id="fromDate"
                        label="From Date"
                        value={fromDate ? format(fromDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setFromDate(e.target.value ? new Date(e.target.value) : undefined)}
                        className="w-[150px] bg-white"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <FloatingLabelInput 
                        type="date" 
                        id="toDate"
                        label="To Date"
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

              <div className="flex flex-wrap items-center gap-4">
                 <div className="w-auto min-w-[300px]">
                   <div className="relative">
                      <Select value={selectedEventType} onValueChange={(value) => setSelectedEventType(value as EventType | "ALL")}>
                        <SelectTrigger id="eventType" className="bg-white flex-1 min-w-[200px] h-[50px] pt-4">
                          <SelectValue placeholder=" " />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All</SelectItem>
                          <SelectItem value="Major Planned Event">Major Planned Event</SelectItem>
                          <SelectItem value="Minor Planned Event">Minor Planned Event</SelectItem>
                        </SelectContent>
                      </Select>
                      <FloatingLabel htmlFor="eventType">Event Type</FloatingLabel>
                   </div>
                 </div>

                 <div className="flex-1 min-w-[200px]">
                      <FloatingLabelInput
                          id="search"
                          label="Search"
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

            <Card>
              <CardContent className="p-0">
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
      </div>

      <Footer />
    </div>
  )
}
