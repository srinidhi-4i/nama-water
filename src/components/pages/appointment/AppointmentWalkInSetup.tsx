"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { appointmentService } from "@/services/appointment.service"
import { authService } from "@/services/auth.service"
import { encryptString } from "@/lib/crypto"
import type { WalkInEmployeeDetails } from "@/types/appointment.types"
import { DataTable } from "@/components/ui/data-table"
import { columns, type WalkInStatistic } from "@/app/(dashboard)/appointment-booking/walk-in-setup/columns"

export default function AppointmentWalkInSetup() {
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState("today")
  const [empDetails, setEmpDetails] = useState<WalkInEmployeeDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [walkInStats, setWalkInStats] = useState<any>(null)

  useEffect(() => {
    loadEmployeeDetails()
  }, [])

  useEffect(() => {
    if (empDetails?.BranchId) {
      loadWalkInStats()
    }
  }, [empDetails?.BranchId])

  const loadEmployeeDetails = async () => {
    try {
      setIsLoading(true)
      
      // Get logged in user from auth service
      const currentUser = authService.getCurrentUser()
      console.log('Current User Data:', currentUser)

      let userName = ""
      
      // Extract username from stored user data
      // Structure matches AuthProvider logic
      if (currentUser?.BranchUserDetails?.[0]) {
        const details = currentUser.BranchUserDetails[0]
        // Try common username properties + BranchuserADID which was found in logs
        userName = details.BranchuserADID || details.UserADId || details.UserName || details.username || details.LoginName || details.Name || ""
      } 
      // Fallback if top level has username
      if (!userName && currentUser?.username) {
        userName = currentUser.username
      }

      if (!userName) {
        console.warn('No username found in auth data')
        // If no user is logged in, we can't fetch details
        // user might need to login again
        return 
      }
      
      const encryptedUser = encodeURIComponent(encryptString(userName))
      
      console.log('Fetching employee details for:', userName)
      const data = await appointmentService.getLoginEmpDetails(encryptedUser)
      console.log('GetLoginEmpDetails response:', data)

      if (data && Array.isArray(data) && data.length > 0) {
        setEmpDetails(data[0])
      } else if (data && data.BranchId) {
        // Handle case where it returns a single object
        setEmpDetails(data) 
      } else {
        console.warn('No valid employee details found in response')
      }
    } catch (error) {
      console.error("Error loading employee details:", error)
      toast.error(language === "EN" ? "Failed to load walk-in details" : "فشل تحميل تفاصيل الدخول المباشر")
    } finally {
      setIsLoading(false)
    }
  }

  const loadWalkInStats = async () => {
    try {
      console.log('loadWalkInStats called, empDetails:', empDetails)
      if (!empDetails?.BranchId) {
        console.log('No BranchId found, skipping loadWalkInStats')
        return
      }
      
      const today = new Date().toISOString().split('T')[0]
      console.log('Calling GetPreBookWalkinDetails with:', { BranchId: empDetails.BranchId, date: today })
      
      const data = await appointmentService.getPreBookWalkinDetails(empDetails.BranchId, today)
      console.log('GetPreBookWalkinDetails response:', data)
      
      if (data?.Table) {
        console.log('Setting walkInStats:', data.Table)
        setWalkInStats(data.Table)
      } else {
        console.log('No Table data in response')
      }
    } catch (error) {
      console.error("Error loading walk-in stats:", error)
    }
  }

  const handleStopWalkIn = () => {
    toast.success(language === "EN" ? "Walk-in stopped" : "تم إيقاف الدخول المباشر")
  }

  const handleAutoRestart = () => {
    toast.success(language === "EN" ? "Auto restart enabled" : "تم تمكين إعادة التشغيل التلقائي")
  }

  const handleRestart = () => {
    toast.success(language === "EN" ? "Walk-in restarted" : "تم إعادة تشغيل الدخول المباشر")
  }

  const handleEditWalkIn = (newValue: number) => {
    // Update the value locally (frontend only as requested)
    if (walkInStats && walkInStats[0]) {
      const updatedStats = [...walkInStats]
      updatedStats[0] = { ...updatedStats[0], Walk_In: newValue }
      setWalkInStats(updatedStats)
    }
    toast.success(language === "EN" ? `Walk-In allowed updated to ${newValue}` : `تم تحديث الدخول المباشر المسموح به إلى ${newValue}`)
  }

  // Prepare data for DataTable from API response
  const tableData: WalkInStatistic[] = walkInStats ? walkInStats.map((item: any, index: number) => ({
    category: language === "EN" ? item.Appointments : item.Appointments, // API returns English labels
    categoryAr: item.Appointments,
    online: item.Pre_Book || 0,
    walkIn: item.Walk_In || 0,
    showEdit: index === 0, // Only first row (Allowed Today) is editable
    onEdit: index === 0 ? handleEditWalkIn : undefined,
  })) : []

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden">
      <PageHeader
        language={language}
        titleEn="Walk-In Token"
        titleAr="رمز الدخول المباشر"
        breadcrumbEn="Walk-In Token"
        breadcrumbAr="رمز الدخول المباشر"
      />

      <div className="container mx-auto px-3 sm:px-4 py-3 max-w-6xl">
        {/* Branch Details Card - Compact */}
        <Card className="mb-3 border shadow-sm">
          <CardContent className="p-3">
            <h3 className="text-red-600 font-semibold mb-2 text-xs">
              {language === "EN" ? "Branch Details :" : "تفاصيل الفرع :"}
            </h3>
            
            {isLoading ? (
              <div className="space-y-1.5">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
              </div>
            ) : empDetails ? (
              <div className="space-y-0.5 text-xs">
                <div className="text-gray-700">
                  <span className="font-medium">{language === "EN" ? "Governorate" : "المحافظة"}:</span>{" "}
                  <span>{empDetails.Governorate}</span>
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">{language === "EN" ? "Willayat" : "الولاية"}:</span>{" "}
                  <span>{empDetails.Willayat}</span>
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">{language === "EN" ? "Branch Name" : "اسم الفرع"}:</span>{" "}
                  <span>{empDetails.BranchName}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-xs">{language === "EN" ? "No branch details available" : "لا توجد تفاصيل فرع متاحة"}</p>
            )}
          </CardContent>
        </Card>

        {/* Tabs - Compact */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-3 h-9 p-0.5 bg-white border shadow-sm">
            <TabsTrigger 
              value="today"
              className="data-[state=active]:bg-teal-700 data-[state=active]:text-white h-8 text-xs font-medium"
            >
              {language === "EN" ? "Today" : "اليوم"}
            </TabsTrigger>
            <TabsTrigger 
              value="setup"
              className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 h-8 text-xs font-medium"
            >
              {language === "EN" ? "Walk-in Setup" : "إعداد الدخول المباشر"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-0">
            
                {/* DataTable - Compact */}
                <div className="rounded-lg overflow-hidden border-0">
                  <DataTable 
                    columns={columns} 
                    data={tableData}
                   
                  />
                </div>

                {/* Action Buttons - Compact */}
                <div className="p-3 space-y-2 bg-gray-50 border-t">
                  <Button
                    onClick={handleStopWalkIn}
                    className="w-full bg-teal-700 hover:bg-teal-800 text-white h-9 text-xs font-medium"
                  >
                    {language === "EN" ? "Stop Walk-in" : "إيقاف الدخول المباشر"}
                  </Button>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      onClick={handleAutoRestart}
                      variant="outline"
                      className="w-full border-teal-700 text-teal-700 hover:bg-teal-50 h-9 text-xs font-medium"
                    >
                      {language === "EN" ? "Auto Restart Walk-In" : "إعادة تشغيل تلقائي"}
                    </Button>
                    <Button
                      onClick={handleRestart}
                      variant="outline"
                      className="w-full border-teal-700 text-teal-700 hover:bg-teal-50 h-9 text-xs font-medium"
                    >
                      {language === "EN" ? "Restart Walk-In" : "إعادة تشغيل الدخول المباشر"}
                    </Button>
                  </div>
                </div>
              
          </TabsContent>

          <TabsContent value="setup" className="mt-0">
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <p className="text-gray-500 text-center py-8 text-xs">
                  {language === "EN" ? "Walk-in setup configuration will be displayed here" : "سيتم عرض تكوين إعداد الدخول المباشر هنا"}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
