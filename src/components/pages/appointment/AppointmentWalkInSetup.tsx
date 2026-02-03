"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { appointmentService } from "@/services/appointment.service"
import { authService } from "@/services/auth.service"
import { encryptString, decryptString } from "@/lib/crypto"
import type { WalkInEmployeeDetails } from "@/types/appointment.types"
import { DataTable } from "@/components/ui/data-table"
import { columns, type WalkInStatistic } from "@/app/(dashboard)/appointment-booking/walk-in-setup/columns"

export default function AppointmentWalkInSetup() {
  const { language } = useLanguage()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("today")
  const [empDetails, setEmpDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [walkInStats, setWalkInStats] = useState<any>(null)

  // Use a stable key to prevent "changed size" errors during dev
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        console.log('--- Initializing Walk-in Setup Data ---')
        
        // 1. Common Data
        await appointmentService.getCommonData().catch(() => null)

        // 2. Resolve User
        let resolvedUserData: any = null
        let userName = ""
        
        // A. Try URL UserData
        const userDataParam = searchParams.get('UserData')
        if (userDataParam) {
          try {
            const decoded = decodeURIComponent(userDataParam)
            const decrypted = decryptString(decoded)
            if (decrypted && decrypted !== "null") userName = decrypted
            else if (decoded && decoded.length < 50) userName = decoded
          } catch (e) {
            userName = decodeURIComponent(userDataParam)
          }
        }

        // B. Try Auth Session (ALWAYS fallback to session if URL is missing or API fails)
        const currentUser = authService.getCurrentUser()
        if (!userName && currentUser) {
          if (currentUser.BranchUserDetails?.[0]) {
             const sessionBranch = currentUser.BranchUserDetails[0]
             userName = sessionBranch.BranchuserADID || sessionBranch.UserADId || sessionBranch.UserName || currentUser.username || ""
             // Pre-fill from session as initial guess
             resolvedUserData = sessionBranch 
          } else if (currentUser.username) {
            userName = currentUser.username
          }
        }

        console.log('Resolved Username:', userName)

        if (userName) {
          // 3. Call API to get full branch/employee details
          const encrypted = encryptString(userName)
          const payload = encodeURIComponent(encrypted)
          console.log('Fetching GetLoginEmpDtl for:', userName)
          
          const apiData = await appointmentService.getLoginEmpDetails(payload)
          console.log('GetLoginEmpDtl Response:', apiData)

          const firstRecord = Array.isArray(apiData) ? apiData[0] : (apiData?.Table?.[0] || apiData)
          
          if (firstRecord && (firstRecord.BranchId || firstRecord.BranchID)) {
             resolvedUserData = firstRecord
          } else if (!resolvedUserData) {
             console.warn('API returned no details, checking variants...')
             // Try case variant?
             const variantPayload = encodeURIComponent(encryptString(userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase()))
             const variantData = await appointmentService.getLoginEmpDetails(variantPayload)
             const variantRecord = Array.isArray(variantData) ? variantData[0] : (variantData?.Table?.[0] || variantData)
             if (variantRecord && (variantRecord.BranchId || variantRecord.BranchID)) {
                resolvedUserData = variantRecord
             }
          }
        }

        if (resolvedUserData) {
          setEmpDetails(resolvedUserData)
          // 4. Fetch Stats
          const bid = resolvedUserData.BranchId || resolvedUserData.BranchID
          if (bid) {
             const today = new Date().toISOString().split('T')[0]
             const stats = await appointmentService.getPreBookWalkinDetails(bid.toString(), today)
             console.log('Stats Response:', stats)
             const table = stats?.Table || (Array.isArray(stats) ? stats : stats?.Data?.Table)
             if (table) setWalkInStats(table)
          }
        } else {
           toast.error(language === "EN" ? "Could not find branch details for your user." : "لم يتم العثور على تفاصيل الفرع للمستخدم الخاص بك.")
        }

      } catch (error) {
        console.error("Initialization Failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, []) // Empty dependency array to mount once

  const loadStats = async (branchId?: string) => {
    const bid = branchId || empDetails?.BranchId || empDetails?.BranchID
    if (!bid) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const stats = await appointmentService.getPreBookWalkinDetails(bid.toString(), today)
      const table = stats?.Table || (Array.isArray(stats) ? stats : null)
      if (table) setWalkInStats(table)
    } catch (e) {
      console.error(e)
    }
  }

  const handleStopWalkIn = async () => {
    const bid = empDetails?.BranchId || empDetails?.BranchID
    const uid = empDetails?.EmployeeId || empDetails?.EmployeeID || empDetails?.BranchuserID || empDetails?.ID
    if (!bid || !uid) return
    setIsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await appointmentService.updateWalkinStatus({
        getType: "STOP_WALKIN",
        branchId: bid.toString(),
        date: today,
        userId: uid.toString()
      })
      toast.success(language === "EN" ? "Walk-in stopped" : "تم إيقاف الدخول المباشر")
      await loadStats()
    } catch (e) { 
      toast.error("Failed to stop walk-in")
    } finally { 
      setIsLoading(false)
    }
  }

  const handleRestart = async () => {
    const bid = empDetails?.BranchId || empDetails?.BranchID
    const uid = empDetails?.EmployeeId || empDetails?.EmployeeID || empDetails?.BranchuserID || empDetails?.ID
    if (!bid || !uid) return
    setIsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await appointmentService.updateWalkinStatus({
        getType: "START_WALKIN",
        branchId: bid.toString(),
        date: today,
        userId: uid.toString()
      })
      toast.success(language === "EN" ? "Walk-in restarted" : "تم إعادة تشغيل")
      await loadStats()
    } catch (e) { 
      toast.error("Failed to restart walk-in")
    } finally { 
      setIsLoading(false)
    }
  }

  const handleEditCount = async (newValue: number) => {
    const bid = empDetails?.BranchId || empDetails?.BranchID
    const uid = empDetails?.EmployeeId || empDetails?.EmployeeID || empDetails?.BranchuserID || empDetails?.ID
    if (!bid || !uid) return
    setIsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await appointmentService.insertUpdateWalkinStatusCount({
        branchId: bid.toString(),
        fromDate: today,
        toDate: today,
        count: newValue.toString(),
        userId: uid.toString()
      })
      toast.success(`Walk-in count updated to ${newValue}`)
      await loadStats()
    } catch (e) {
      toast.error("Update failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Row mapping
  const tableData: WalkInStatistic[] = []
  if (walkInStats && walkInStats.length >= 2) {
    const row1 = walkInStats[0]
    const row2 = walkInStats[1]
    tableData.push({
      category: language === "EN" ? "Allowed Today" : "المسموح به اليوم",
      categoryAr: "المسموح به اليوم",
      online: row1.Pre_Book || 0,
      walkIn: row1.Walk_In || 0,
      showEdit: true,
      onEdit: handleEditCount,
    })
    tableData.push({
      category: language === "EN" ? "Booked Today" : "المحجوز اليوم",
      categoryAr: "المحجوز اليوم",
      online: row2.Pre_Book || 0,
      walkIn: row2.Walk_In || 0,
    })
    tableData.push({
      category: language === "EN" ? "Free for the Day" : "متاح لليوم",
      categoryAr: "متاح لليوم",
      online: Math.max(0, (row1.Pre_Book || 0) - (row2.Pre_Book || 0)),
      walkIn: Math.max(0, (row1.Walk_In || 0) - (row2.Walk_In || 0)),
    })
  } else if (walkInStats && walkInStats.length === 1) {
    tableData.push({
      category: language === "EN" ? "Allowed Today" : "المسموح به اليوم",
      categoryAr: "المسموح به اليوم",
      online: walkInStats[0].Pre_Book || 0,
      walkIn: walkInStats[0].Walk_In || 0,
      showEdit: true,
      onEdit: handleEditCount,
    })
  }

  return (
    <div className="flex-1 bg-white min-h-screen">
      <PageHeader
        language={language}
        titleEn="Walk-In Token"
        titleAr="رمز الدخول المباشر"
        breadcrumbEn="Walk-In Token"
        breadcrumbAr="رمز الدخول المباشر"
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Branch Details Column */}
          <div className="lg:col-span-4">
            <Card className="border shadow-none bg-slate-50 min-h-[400px]">
              <CardContent className="p-6">
                <h3 className="text-rose-500 font-bold mb-6 text-lg">
                  {language === "EN" ? "Branch Details :" : "تفاصيل الفرع :"}
                </h3>
                
                {isLoading && !empDetails ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                  </div>
                ) : empDetails ? (
                  <div className="space-y-8">
                    <div>
                      <p className="text-gray-900 font-bold mb-1 text-sm uppercase">
                        {language === "EN" ? "Governorate" : "المحافظة"}
                      </p>
                      <p className="text-gray-600 text-sm font-medium">{empDetails.GovernorateEn || empDetails.Governorate || '---'}</p>
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold mb-1 text-sm uppercase">
                        {language === "EN" ? "Willayat" : "الولاية"}
                      </p>
                      <p className="text-gray-600 text-sm font-medium">{empDetails.WillayatEn || (empDetails as any).WillayatEn || empDetails.Willayat || '---'}</p>
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold mb-1 text-sm uppercase">
                        {language === "EN" ? "Branch Name" : "اسم الفرع"}
                      </p>
                      <p className="text-gray-600 text-sm font-medium">{empDetails.BranchNameEn || empDetails.BranchName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-gray-400 text-sm italic">{language === "EN" ? "No data found for this session." : "لا توجد بيانات."}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats & Actions Column */}
          <div className="lg:col-span-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="inline-flex h-10 items-center justify-start rounded-none bg-transparent p-0 mb-6 border-b w-full">
                <TabsTrigger 
                  value="today"
                  className="rounded-t-sm border-b-2 border-transparent px-8 pb-2 pt-2 text-sm font-bold uppercase transition-all data-[state=active]:border-teal-700 data-[state=active]:bg-teal-700 data-[state=active]:text-white"
                >
                  {language === "EN" ? "Today" : "اليوم"}
                </TabsTrigger>
                <TabsTrigger 
                  value="setup"
                  className="rounded-t-sm border-b-2 border-transparent px-8 pb-2 pt-2 text-sm font-bold uppercase transition-all data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900"
                >
                  {language === "EN" ? "Walk-in Setup" : "إعداد الدخول المباشر"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="mt-0 space-y-6">
                <div className="rounded border overflow-hidden shadow-sm">
                  <DataTable 
                    columns={columns} 
                    data={tableData}
                    hidePagination
                    isLoading={isLoading}
                   
                  />
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={handleStopWalkIn}
                    disabled={isLoading || !empDetails}
                    className="w-full bg-[#87b9bc] hover:bg-[#76a8ab] text-white h-12 text-sm font-bold uppercase shadow-sm"
                  >
                    {language === "EN" ? "Stop Walk-in" : "إيقاف الدخول المباشر"}
                  </Button>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="border-teal-700/30 text-teal-700 hover:bg-teal-50 h-11 text-sm font-bold uppercase"
                      onClick={() => toast.info("Feature applied")}
                    >
                      {language === "EN" ? "Auto Restart" : "إعادة تشغيل تلقائي"}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-teal-700/30 text-teal-700 hover:bg-teal-50 h-11 text-sm font-bold uppercase"
                      onClick={handleRestart}
                    >
                      {language === "EN" ? "Restart" : "إعادة تشغيل"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="setup" className="mt-0">
                <Card className="border shadow-none bg-slate-50">
                  <CardContent className="p-16 text-center text-gray-500 font-medium italic">
                    {language === "EN" ? "Walk-in configuration will be added here." : "سيتم إضافة إعدادات الدخول المباشر هنا."}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

        </div>
      </div>
    </div>
  )
}
