"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, User, FileText, Calendar, AlertCircle, CreditCard, LogOut, ChevronRight, Eye, Download, Search } from "lucide-react"
import { branchOpsService } from "@/services/branchops.service"
import { decryptString } from "@/lib/crypto"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import PageHeader from "@/components/layout/PageHeader"
import { useLanguage } from "@/components/providers/LanguageProvider"

import DashboardSidebar from "./DashboardSidebar"
import { DataTable } from "@/components/ui/data-table"
import { columns as transactionColumns, requestColumns, alarmColumns, appointmentColumns } from "@/app/(dashboard)/branch-operations/account-dashboard/[accountNumber]/column"
import { Input } from "@/components/ui/input"
import { format, subMonths, subWeeks, startOfDay } from "date-fns"

const DashboardOverview = dynamic(() => import("./DashboardOverview"), {
  loading: () => <div className="p-20 text-center font-bold text-slate-400">Loading Overview Charts...</div>,
  ssr: false
})

const AccountDetailsTable = dynamic(() => import("./AccountDetailsTable"), {
  loading: () => <div className="p-10 text-center font-bold text-slate-400">Loading Details...</div>,
  ssr: false
})

interface AccountDashboardProps {
  accountNumber: string
}

export default function AccountDashboard({ accountNumber }: AccountDashboardProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const [accountData, setAccountData] = useState<any>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const [metrics, setMetrics] = useState({
      outstanding: "0.000",
      requests: 0,
      transactions: 0,
      alarms: 0
  })
  const [requestList, setRequestList] = useState<any[]>([])
  const [appointmentList, setAppointmentList] = useState<any[]>([])
  const [alarmList, setAlarmList] = useState<any[]>([])
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [outstandingByGroup, setOutstandingByGroup] = useState<any[]>([])
  const [consumptionData, setConsumptionData] = useState<any[]>([])
  const [changeServiceDetails, setChangeServiceDetails] = useState<any[]>([])
  const [activeConsumptionInterval, setActiveConsumptionInterval] = useState<'Monthly' | 'Daily' | 'Hourly'>('Monthly')
  const [isLoading, setIsLoading] = useState(true)
  const [ccbStatus, setCcbStatus] = useState<any>(null)
  const [menuData, setMenuData] = useState<any[]>([])
  const [smrData, setSmrData] = useState<any[]>([])
  const [requestSummary, setRequestSummary] = useState<any>({
      Pending: 0,
      Completed: 0,
      Cancelled: 0,
      TotalCount: 0
  })

  // Filters
  const [paymentFilters, setPaymentFilters] = useState({ fromDate: '', toDate: '' })
  const [requestFilter, setRequestFilter] = useState<'all' | 'month' | 'week'>('all')

  const filteredRequests = useMemo(() => {
    const list = Array.isArray(requestList) ? requestList : []
    
    if (requestFilter === 'all') return list

    const now = new Date()
    const filterDuration = requestFilter === 'week' ? subWeeks(now, 1) : subMonths(now, 1)
    
    return list.filter(r => {
      const dateVal = r.RequestDate || r["Updated Date"] || r.RequestedDate || r.CreatedDate || r.SRDate || r.date
      if (!dateVal) return false
      const date = new Date(dateVal)
      return !isNaN(date.getTime()) && date >= filterDuration
    })
  }, [requestList, requestFilter])

  useEffect(() => {
    const initDashboard = async () => {
      setIsLoading(true)
      try {
        console.log('Initializing dashboard for account:', accountNumber)
        
        const customerInfo = await branchOpsService.getCustomerInfo(accountNumber, false)
        const serviceType = await branchOpsService.getServiceType(accountNumber)



 
        
        const initialData = {
          customerInfo: customerInfo,
          ...customerInfo,
          AccountNumber: accountNumber,
          ServiceType: serviceType?.ServiceType,
          LegacyId: customerInfo?.legacyId || serviceType?.LegacyId || serviceType?.CCBAccountNumber || "",
          CCBAccountNumber: serviceType?.CCBAccountNumber,
          AccountHolderName: customerInfo?.personNameEn || customerInfo?.FullNameEn || customerInfo?.personName || customerInfo?.FullName 
        }
        
        console.log('Initial Account Data:', initialData)
        setAccountData(initialData)
        
        await loadDashboardData(accountNumber, initialData.LegacyId, initialData)
      } catch (error) {
        console.error("Failed to initialize dashboard:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (accountNumber) {
      initDashboard()
    }
  }, [accountNumber])

  useEffect(() => {
    if (requestList && requestList.length > 0) {
      console.log('FINAL Request List in State:', requestList)
      console.log('Keys in first request item:', Object.keys(requestList[0]))
    }
  }, [requestList])

  // Handle unit consumed interval change
  const handleIntervalChange = async (interval: 'Monthly' | 'Daily' | 'Hourly') => {
      setActiveConsumptionInterval(interval)
      if (!accountData?.AccountNumber) return

      try {
          let data = []
          if (interval === 'Monthly') {
              data = await branchOpsService.getConsumptionData(accountData.AccountNumber)
          } else if (interval === 'Daily') {
              data = await branchOpsService.getConsumptionDataDaily(accountData.AccountNumber)
          } else if (interval === 'Hourly') {
               data = await branchOpsService.getConsumptionDataHourly(accountData.AccountNumber)
          }
          
          setConsumptionData(flattenConsumptionData(data))
      } catch (error) {
          console.error(`Failed to fetch ${interval} consumption data:`, error)
      }
  }

  // Helper to flatten consumption data regardless of API structure
  const flattenConsumptionData = (data: any[]) => {
      if (!data || !Array.isArray(data) || data.length === 0) return []
      
      // Check if data is nested in readings array (common structure)
      if (data[0]?.readings) {
          return data[0].readings.map((r: any) => ({
              Date: r.readingDate || r.Date || r.date || '',
              Value: parseFloat(r.consumption || r.Value || r.value || r.Consumption || '0')
          })).filter((item: any) => item.Date && !isNaN(item.Value))
      }
      
      // If flat array
      return data.map((r: any) => ({
          Date: r.readingDate || r.Date || r.date || '',
          Value: parseFloat(r.consumption || r.Value || r.value || r.Consumption || '0')
      })).filter((item: any) => item.Date && !isNaN(item.Value))
  }

  const loadDashboardData = async (accNum: string, knownLegacyId?: string, initialData?: any) => {
    setIsLoading(true)
    try {
        console.log('Loading dashboard data for account:', accNum)
        
        // Load all dashboard data in parallel
        const [
            outstanding, 
            dashRequests, 
            payments, 
            alarms,
            byGroup, 
            consData, 
            reqList, 
            apptList, 
            changeSvc, 
            billPayment,
            ccbResult,
            ccbStatusResult,
            menuResult
        ] = await Promise.all([
            branchOpsService.getTotalOutstandingAmount(accNum),
            branchOpsService.getMyRequestDashboard(accNum),
            branchOpsService.getPaymentHistory(accNum, '', ''), 
            branchOpsService.getAMRAlertHistory(accNum),
            branchOpsService.getOutstandingByGroup(accNum),
            branchOpsService.getConsumptionData(accNum), // Default to Monthly
            (console.log('CALLING getMyRequestList with:', { accNum, legacy: knownLegacyId || initialData?.LegacyId }), 
             branchOpsService.getMyRequestList(accNum, knownLegacyId || initialData?.LegacyId)),
            branchOpsService.getAppointmentList(accNum),
            branchOpsService.getChangeServiceTypeDet(accNum),
            branchOpsService.viewBillPayment(accNum),
            branchOpsService.getCCBConnectionStatus(accNum),
            branchOpsService.getCCBStatus(accNum),
            branchOpsService.getMenudata()
        ])

        console.log('Connection Status Results:', { ccbResult, ccbStatusResult })

          const billOutstanding = billPayment?.TotalResult;
          const billLegacy = billPayment?.LegacyAccount;
          const billName = billPayment?.AccountName?.trim();

          // Robust legacyId definition
          const legacyId = billLegacy || knownLegacyId || initialData?.LegacyId || accNum

          // Map connection status from API responses
          // Prioritize CCBStatus or AccountStatus as found in legacy code
          const rawCcbStatus = ccbStatusResult?.CCBStatus || ccbStatusResult?.Data?.CCBStatus || 
                               ccbResult?.CCBStatus || ccbResult?.Data?.CCBStatus || 
                               ccbResult?.AccountStatus || ccbResult?.Data?.AccountStatus

          let connectionStatus = "NOT CONNECTED"
          const statusStr = String(rawCcbStatus || "").toUpperCase()
          
          if (statusStr === "TRUE" || rawCcbStatus === true || statusStr === "CONNECTED" || statusStr === "ACTIVE" || statusStr === "IN SERVICE") {
              connectionStatus = "CONNECTED"
          } else if (statusStr === "FALSE" || rawCcbStatus === false || statusStr === "NOT CONNECTED" || statusStr === "INACTIVE" || statusStr === "DISCONNECTED") {
              connectionStatus = "NOT CONNECTED"
          } else {
              // Default to NOT CONNECTED if we can't determine it, to avoid "connected for all"
              connectionStatus = rawCcbStatus ? "CONNECTED" : "NOT CONNECTED" 
          }
          console.log('Resolved Connection Status:', connectionStatus)

          setAccountData((prev: any) => ({
              ...prev,
              ...billPayment,
              AccountHolderName: billName || prev.AccountHolderName,
              LegacyId: legacyId,
              ccbStatus: connectionStatus,
              connectionStatus: connectionStatus // Both for compatibility
          }))

          // Filter transactions by Legacy ID or Account Number
          const filteredPayments = (payments || []).filter((p: any) => {
              const paymentLegacyId = String(p.LegacyID || p.LegacyId || '').trim()
              const currentLegacyId = String(legacyId || '').trim()
              const isLegacyMatch = paymentLegacyId === currentLegacyId && currentLegacyId !== ''
              const isAccountNoMatch = (p.AccountNo || p.AccountNumber || p.AccountNum) === accNum
              
              return (isLegacyMatch || isAccountNoMatch) && p.PaymentAmount > 0
          })

          // Flatten outstanding by group
          const flattenedByGroup = (byGroup || []).map((g: any) => ({
              GroupName: g.GroupName ,
              Amount: g.GroupOutstandingAmount || g.Accounts?.[0]?.GroupOutstandingAmount 
          }))
          setOutstandingByGroup(flattenedByGroup)

          // 1. Calculate final outstanding as sum of groups if available, else fallback to billPayment
          const totalFromGroups = flattenedByGroup.reduce((sum, g) => sum + parseFloat(g.Amount || "0"), 0)
          const finalOutstanding = totalFromGroups > 0 ? totalFromGroups.toFixed(3) : (billOutstanding !== undefined && billOutstanding !== null ? billOutstanding : (outstanding || "0.000"))

          // 2. Fetch SMR Data using account IDs from groups, with fallback to accNum
          let accountIds = (byGroup || []).flatMap((g: any) => (g.Accounts || []).map((a: any) => a.AccountId)).filter(id => id)
          if (accountIds.length === 0 && accNum) {
              accountIds = [accNum]
          }

          if (accountIds.length > 0) {
              try {
                  const smr = await branchOpsService.getSMRHistory(accountIds)
                  
                  // fallback: if smr is empty, try to seed with initialData.customerInfo
                  if ((!smr || smr.length === 0) && initialData?.customerInfo?.meterNumber) {
                      console.log("Seeding SMR data from initialData.customerInfo fallback",initialData.customerInfo)
                      const ci = initialData.customerInfo
                      setSmrData([{
                          MeterNo: ci.meterNumber,
                          Status:  ci.Status,
                          LastReadingDate: ci.latestReadDateTime || ci.LatestReadDateTime,
                          ReadingType: ci.readType || ci.ReadType || "Current"
                      }])
                  } else {
                      setSmrData(smr)
                  }
              } catch (e) {
                  console.warn("SMR fetch failed, using fallback", e)
                  if (initialData?.customerInfo?.meterNumber) {
                       setSmrData([{
                          MeterNo: initialData.customerInfo.meterNumber,
                          Status: initialData.customerInfo.Status,
                          LastReadingDate: initialData.customerInfo.latestReadDateTime,
                          ReadingType: "Current"
                      }])
                  }
              }
          } else if (initialData?.customerInfo?.meterNumber) {
              // No account IDs but we have meter info in customerInfo
              setSmrData([{
                  MeterNo: initialData.customerInfo.meterNumber,
                  Status: "Active",
                  LastReadingDate: initialData.customerInfo.latestReadDateTime,
                  ReadingType: "Current"
              }])
          }

          // 3. Set Request Summary from dashboard API
        const reqSummaries = Array.isArray(dashRequests) ? dashRequests[0] : (dashRequests || {})
        const totalReqCount = reqSummaries?.TotalCount || (reqList && Array.isArray(reqList) ? reqList.length : 0)
        setRequestSummary({
            Pending: reqSummaries?.Pending || 0,
            Completed: reqSummaries?.Completed || 0,
            Cancelled: reqSummaries?.Cancelled || 0,
            TotalCount: totalReqCount
        })

        // Final State Updates
        setMetrics({
            outstanding: finalOutstanding,
            requests: totalReqCount,
            transactions: filteredPayments.length,
            alarms: (alarms && Array.isArray(alarms)) ? alarms.length : 0
        })

          setPaymentHistory(filteredPayments)
          setAlarmList(alarms || [])
          setConsumptionData(flattenConsumptionData(consData))
          
          if (reqList && Array.isArray(reqList) && reqList.length > 0) {
              console.log('First Request Item Structure:', Object.keys(reqList[0]))
              console.log('Sample Request Item:', reqList[0])
          }
          setRequestList(reqList || [])
          setAppointmentList(apptList || [])
          setChangeServiceDetails(changeSvc || [])
          setCcbStatus(ccbResult)
          setMenuData(menuResult)
          
      } catch (err) {
          console.error("Failed to load dashboard data:", err)
      } finally {
          setIsLoading(false)
      }
  }

  const handlePaymentFilterSearch = async () => {
    const accNum = accountData?.CCBAccountNumber || accountNumber
    setIsLoading(true)
    try {
        const payments = await branchOpsService.getPaymentHistory(accNum, paymentFilters.fromDate, paymentFilters.toDate)
        setPaymentHistory(payments)
    } catch (err) {
        console.error("Failed to filter payments", err)
    } finally {
        setIsLoading(false)
    }
  }

  const handlePaymentFilterReset = async () => {
    setPaymentFilters({ fromDate: '', toDate: '' })
    const accNum = accountData?.CCBAccountNumber || accountNumber
    setIsLoading(true)
    try {
        const payments = await branchOpsService.getPaymentHistory(accNum)
        setPaymentHistory(payments)
    } catch (err) {
        console.error("Failed to reset payments", err)
    } finally {
        setIsLoading(false)
    }
  }
  
  const handleEndSession = async () => {
    try {
      await branchOpsService.logout()
    } catch (err) { }
    sessionStorage.clear()
    localStorage.clear()
    router.push('/branch-operations/validate')
  }

  const [activeTab, setActiveTab] = useState("overview")

  if (isLoading) {
    return (
        <div className="p-8 flex items-center justify-center h-screen bg-slate-50">
            <div className="flex flex-col items-center">
                <div className="relative h-20 w-20">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-t-teal-600 animate-spin"></div>
                    <div className="absolute inset-4 rounded-full border-4 border-slate-200 border-b-blue-500 animate-[spin_1.5s_linear_infinite]"></div>
                </div>
                <p className="mt-6 text-sm font-black text-slate-800 uppercase tracking-[0.3em]">Synching Data</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Connecting to Secure Gateway</p>
            </div>
        </div>
    )
  }

  if (!accountData) {
    return <div className="p-8 text-center text-red-500 font-bold">Account not found or session expired.</div>
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen lg:overflow-hidden bg-slate-100 font-sans text-sm">
      
      {/* SIDEBAR - Desktop Only */}
      <aside className="hidden lg:block w-[25%] lg:h-full bg-white shadow-xl z-30 shrink-0 overflow-y-auto">
        <DashboardSidebar accountData={accountData} />
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 lg:overflow-y-auto">
        <div className="flex flex-col min-h-full">
            
            {/* Page Header and Tabs Integration */}
            <div className="flex-1 bg-slate-100 shadow-lg">
                <PageHeader 
                    language={language}
                    titleEn="Customer Dashboard"
                    titleAr="لوحة تحكم العميل"
                    breadcrumbItems={[
                        { labelEn: "Home", labelAr: "الرئيسية", href: "/branchhome" },
                        { labelEn: "Search Customer", labelAr: "بحث عميل", href: "/branch-operations/validate" },
                        { labelEn: "Account Dashboard", labelAr: "لوحة تحكم الحساب" }
                    ]}
                    showShadow={false}
                />
                
                <div className="px-6 pb-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex items-center justify-between gap-4">
                            {/* Horizontal Scroll Tabs */}
                            <div className="overflow-x-auto hide-scrollbar flex-1">
                                <TabsList className="bg-transparent p-0 h-10 flex w-max gap-6">
                                    <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600 data-[state=active]:text-teal-600 rounded-none px-2 text-xs font-bold uppercase tracking-wider h-full transition-all bg-transparent shadow-none">Overview</TabsTrigger>
                                    <TabsTrigger value="details" className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600 data-[state=active]:text-teal-600 rounded-none px-2 text-xs font-bold uppercase tracking-wider h-full transition-all bg-transparent shadow-none">Account details</TabsTrigger>
                                    <TabsTrigger value="requests" className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600 data-[state=active]:text-teal-600 rounded-none px-2 text-xs font-bold uppercase tracking-wider h-full transition-all bg-transparent shadow-none">Request/Complaints</TabsTrigger>
                                    <TabsTrigger value="appointments" className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600 data-[state=active]:text-teal-600 rounded-none px-2 text-xs font-bold uppercase tracking-wider h-full transition-all bg-transparent shadow-none">Appointments</TabsTrigger>
                                    <TabsTrigger value="alarm" className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600 data-[state=active]:text-teal-600 rounded-none px-2 text-xs font-bold uppercase tracking-wider h-full transition-all bg-transparent shadow-none">Alarm</TabsTrigger>
                                    <TabsTrigger value="paybill" className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600 data-[state=active]:text-teal-600 rounded-none px-2 text-xs font-bold uppercase tracking-wider h-full transition-all bg-transparent shadow-none">View & Pay Your Bill</TabsTrigger>
                                </TabsList>
                            </div>
                            
                            <Button 
                                variant="destructive" 
                                onClick={handleEndSession} 
                                className="bg-[#EF4444] hover:bg-red-600 text-white font-black text-[10px] tracking-widest px-6 h-9 rounded-lg uppercase shadow-lg shadow-red-100 transition-all active:scale-95 shrink-0"
                            >
                                END SESSION & SEARCH NEW
                            </Button>
                        </div>


                        <div className="mt-6 px-0 pb-10">
                            <TabsContent value="overview" className="focus-visible:outline-none m-0">
                                <DashboardOverview 
                                    accountNumber={accountNumber}
                                    legacyAccountNumber={accountData.LegacyId}
                                    metrics={metrics}
                                    outstandingByGroup={outstandingByGroup}
                                    consumptionData={consumptionData}
                                    recentTransactions={paymentHistory}
                                    myRequests={requestList}
                                    requestSummary={requestSummary}
                                    smrData={smrData}
                                    changeServiceDetails={changeServiceDetails}
                                    ccbStatus={ccbStatus}
                                    menuData={menuData}
                                    onSwitchTab={setActiveTab}
                                    onIntervalChange={handleIntervalChange}
                                    activeInterval={activeConsumptionInterval}
                                    onRequestIntervalChange={async (interval) => {
                                        if (!accountData?.AccountNumber) return
                                        const dash = await branchOpsService.getMyRequestDashboard(accountData.AccountNumber, interval)
                                        const summaries = Array.isArray(dash) ? dash[0] : (dash || {})
                                        setRequestSummary({
                                            Pending: summaries?.Pending || 0,
                                            Completed: summaries?.Completed || 0,
                                            Cancelled: summaries?.Cancelled || 0,
                                            TotalCount: summaries?.TotalCount || 0
                                        })
                                    }}
                                />
                            </TabsContent>
                            <TabsContent value="details" className="focus-visible:outline-none">
                                <div className="space-y-6">
                                    <AccountDetailsTable 
                                        data={[{
                                            AccountNumber: accountNumber, 
                                            LegacyNumber: accountData.LegacyId || accountNumber, 
                                            ServiceType: accountData.AccountType || accountData.ServiceType || "Water", 
                                            ServiceAgreement: accountData.connectionStatus === "CONNECTED" ? "Active" : "Inactive", 
                                            ConnectionStatus: accountData.connectionStatus || "NOT CONNECTED",
                                            DisconnectionReason: "--" 
                                          }]}
                                        meterDataMap={{
                                            [String(accountData.AccountNumber)]: smrData.map(item => {
                                                const date = item.LastReadingDate ? new Date(item.LastReadingDate) : null
                                                const isValidDate = date && !isNaN(date.getTime())
                                                
                                                return {
                                                    MeterNumber: item.MeterNo || item.SerialNo || item.DeviceNo || "--",
                                                    MeterStatus: item.Status || (item.ReadingType?.toLowerCase().includes('final') ? "Inactive" : "Active"),
                                                    MeterReplacementHistory: item.MeterReplacementHistory || (item.ReadingType || "--"),
                                                    DateTime: isValidDate ? format(date!, 'dd-MM-yyyy') : (item.LastReadingDate || "--")
                                                }
                                            })
                                        }}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="appointments" className="focus-visible:outline-none">
                                <Card className="p-8 shadow-sm border-none bg-white rounded-2xl">
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-teal-900 mb-6">Appointments</h3>
                                    <DataTable 
                                        columns={appointmentColumns} 
                                        data={appointmentList} 
                                    />
                                </Card>
                            </TabsContent>

                            <TabsContent value="alarm" className="focus-visible:outline-none">
                                <Card className="p-8 shadow-sm border-none bg-white rounded-2xl">
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-teal-900 mb-6">Alarms</h3>
                                    <DataTable 
                                        columns={alarmColumns} 
                                        data={alarmList} 
                                    />
                                </Card>
                            </TabsContent>

                            <TabsContent value="requests" className="focus-visible:outline-none">
                                <Card className="p-8 shadow-sm border-none bg-white rounded-2xl">
                                    <div className="flex justify-between items-center mb-8">
                                        <div className="flex items-center gap-6">
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-teal-900">Request & Complaints</h3>
                                        </div>
                                    </div>
                                        
                                    <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
                                        <div className="overflow-x-auto no-scrollbar pb-2">
                                            <DataTable 
                                                columns={requestColumns}
                                                data={filteredRequests}
                                                hidePagination={false}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="paybill" className="focus-visible:outline-none">
                                <Card className="p-8 shadow-sm border-none bg-white rounded-2xl">
                                    <h3 className="text-xl font-black mb-6 uppercase tracking-tighter text-teal-900">Recent Transactions</h3>
                                    
                                    {/* Date Filters as per Image 1 */}
                                    <div className="bg-slate-50 p-6 rounded-xl mb-8 border border-slate-100">
                                        <div className="flex flex-wrap gap-6 items-end">
                                            <div className="flex-1 min-w-[200px] space-y-2">
                                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Number</Label>
                                                <p className="text-sm font-black text-slate-800 bg-white border border-slate-200 h-10 flex items-center px-4 rounded-md">{accountData.AccountNumber || accountNumber}</p>
                                            </div>
                                            <div className="flex-1 min-w-[200px] space-y-2">
                                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">From Date</Label>
                                                <Input 
                                                    type="date" 
                                                    value={paymentFilters.fromDate}
                                                    onChange={(e) => setPaymentFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                                                    className="bg-white border-slate-200 h-10" 
                                                />
                                            </div>
                                            <div className="flex-1 min-w-[200px] space-y-2">
                                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">To Date</Label>
                                                <Input 
                                                    type="date" 
                                                    value={paymentFilters.toDate}
                                                    onChange={(e) => setPaymentFilters(prev => ({ ...prev, toDate: e.target.value }))}
                                                    className="bg-white border-slate-200 h-10" 
                                                />
                                            </div>
                                            <div className="flex gap-2 min-w-[200px]">
                                                <Button 
                                                    onClick={handlePaymentFilterSearch}
                                                    className="flex-1 bg-teal-900 hover:bg-teal-800 font-bold h-10"
                                                >
                                                    Search
                                                </Button>
                                                <Button 
                                                    variant="outline"
                                                    onClick={handlePaymentFilterReset}
                                                    className="flex-1 font-bold h-10"
                                                >
                                                    Reset
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <DataTable 
                                        columns={transactionColumns} 
                                        data={paymentHistory} 
                                    />
                                </Card>
                            </TabsContent>
                        </div>
                        
                        {/* MOBILE SIDEBAR - Moved to bottom as per requirement */}
                        <div className="lg:hidden px-6 pb-10">
                             <DashboardSidebar accountData={accountData} />
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
      </main>


    </div>
  )
}
