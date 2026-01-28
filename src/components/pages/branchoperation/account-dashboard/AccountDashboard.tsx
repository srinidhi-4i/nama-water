"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, User, FileText, Calendar, AlertCircle, CreditCard, LogOut, ChevronRight } from "lucide-react"
import { branchOpsService } from "@/services/branchops.service"
import { decryptString } from "@/lib/crypto"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import PageHeader from "@/components/layout/PageHeader"
import { useLanguage } from "@/components/providers/LanguageProvider"

import DashboardSidebar from "./DashboardSidebar"

const DashboardOverview = dynamic(() => import("./DashboardOverview"), {
  loading: () => <div className="p-20 text-center font-bold text-slate-400">Loading Overview Charts...</div>,
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initDashboard = async () => {
      setIsLoading(true)
      try {
        const customerInfo = await branchOpsService.getCustomerInfo(accountNumber, false)
        const serviceType = await branchOpsService.getServiceType(accountNumber)

        const initialData = {
          ...customerInfo,
          AccountNumber: accountNumber,
          ServiceType: serviceType?.ServiceType,
          LegacyId: serviceType?.LegacyId || serviceType?.CCBAccountNumber || "",
          CCBAccountNumber: serviceType?.CCBAccountNumber,
          AccountHolderName: customerInfo ? (decryptString(customerInfo.personNameEn) || decryptString(customerInfo.personName) || "Ahmad Abdullah") : "Ahmad Abdullah"
        }
        
        setAccountData(initialData)
        
        const accNumForData = serviceType?.CCBAccountNumber || accountNumber
        await loadDashboardData(accNumForData)
      } catch (error) {
        console.error("Failed to initialize dashboard", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (accountNumber) {
      initDashboard()
    }
  }, [accountNumber])

  const loadDashboardData = async (accNum: string) => {
      try {
          // Load Metrics in parallel
          const [outstanding, requests, payments, alarms] = await Promise.all([
              branchOpsService.getTotalOutstandingAmount(accNum),
              branchOpsService.getMyRequestDashboard(accNum),
              branchOpsService.getPaymentHistory(accNum),
              branchOpsService.getAMRAlertHistory(accNum)
          ])

          setMetrics({
              outstanding: outstanding || "0.000",
              requests: requests && requests.length > 0 ? requests[0].TotalCount : 0,
              transactions: payments.length,
              alarms: alarms.length
          })

          setPaymentHistory(payments)
          setAlarmList(alarms)

          const [byGroup, consData, reqList, apptList, changeSvc] = await Promise.all([
              branchOpsService.getOutstandingByGroup(accNum),
              branchOpsService.getConsumptionData(accNum),
              branchOpsService.getMyRequestList(accNum),
              branchOpsService.getAppointmentList(accNum),
              branchOpsService.getChangeServiceTypeDet(accNum)
          ])

          // Flatten outstanding by group
          const flattenedByGroup = (byGroup || []).map((g: any) => ({
              GroupName: g.GroupName,
              Amount: g.Accounts?.[0]?.GroupOutstandingAmount || g.GroupOutstandingAmount || "0"
          }))
          setOutstandingByGroup(flattenedByGroup)

          // Flatten consumption data
          const flattenedConsumption = (consData?.[0]?.readings || []).map((r: any) => ({
              Date: r.readingDate,
              Value: r.consumption
          }))
          setConsumptionData(flattenedConsumption)

          setRequestList(reqList || [])
          setAppointmentList(apptList || [])
          setChangeServiceDetails(changeSvc || [])
          
      } catch (err) {
          console.warn("Failed to load dashboard data", err)
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
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* SIDEBAR - Collapsible (1/4 width expanded) */}
      <aside 
        className={`relative h-full bg-white shadow-2xl transition-all duration-500 ease-in-out z-30 ${
            isSidebarOpen ? 'w-[400px]' : 'w-0 overflow-hidden'
        }`}
      >
        <DashboardSidebar accountData={accountData} />
      </aside>

      {/* SIDEBAR TOGGLE BUTTON */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`absolute top-1/2 -translate-y-1/2 z-40 h-10 w-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
            isSidebarOpen ? 'left-[380px]' : 'left-8'
        } transform hover:scale-110 active:scale-95`}
      >
        <ChevronRight className={`h-6 w-6 transition-transform duration-500 ${isSidebarOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto w-full relative">
        <div className="p-6 md:p-10 space-y-8">
            
            {/* Professional Breadcrumb & Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                     <nav className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        <Link href="/branchhome" className="hover:text-teal-900 transition-colors">Home</Link>
                        <ChevronRight className="h-3 w-3" />
                        <Link href="/branch-operations/validate" className="hover:text-teal-900 transition-colors">Search Customer</Link>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-teal-900">Account Dashboard</span>
                    </nav>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        Account Dashboard <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    </h1>
                </div>
            </div>

            {/* Account Header / Tab Bar / End Session Button */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row items-stretch xl:items-center gap-4">
                {/* Tabs with Horizontal Scroll */}
                <Tabs defaultValue="overview" className="flex-1 w-full min-w-0">
                    <div className="flex items-center justify-between flex-wrap xl:flex-nowrap gap-4">
                        <div className="overflow-x-auto pb-1 -mb-1 hide-scrollbar w-full xl:w-auto">
                            <TabsList className="bg-slate-50 p-1 h-12 rounded-xl flex w-fit min-w-full xl:min-w-0">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-teal-900 data-[state=active]:shadow-sm rounded-lg px-8 text-xs font-bold uppercase tracking-widest h-10 transition-all">Overview</TabsTrigger>
                                <TabsTrigger value="details" className="data-[state=active]:bg-white data-[state=active]:text-teal-900 data-[state=active]:shadow-sm rounded-lg px-8 text-xs font-bold uppercase tracking-widest h-10 transition-all">Account details</TabsTrigger>
                                <TabsTrigger value="requests" className="data-[state=active]:bg-white data-[state=active]:text-teal-900 data-[state=active]:shadow-sm rounded-lg px-8 text-xs font-bold uppercase tracking-widest h-10 transition-all">Request/Complaints</TabsTrigger>
                                <TabsTrigger value="appointments" className="data-[state=active]:bg-white data-[state=active]:text-teal-900 data-[state=active]:shadow-sm rounded-lg px-8 text-xs font-bold uppercase tracking-widest h-10 transition-all" disabled>Appointments</TabsTrigger>
                                <TabsTrigger value="alarm" className="data-[state=active]:bg-white data-[state=active]:text-teal-900 data-[state=active]:shadow-sm rounded-lg px-8 text-xs font-bold uppercase tracking-widest h-10 transition-all" disabled>Alarm</TabsTrigger>
                                <TabsTrigger value="paybill" className="data-[state=active]:bg-white data-[state=active]:text-teal-900 data-[state=active]:shadow-sm rounded-lg px-8 text-xs font-bold uppercase tracking-widest h-10 transition-all" disabled>View & Pay Your Bill</TabsTrigger>
                            </TabsList>
                        </div>
                        
                        {/* Integrated End Session Button */}
                        <Button 
                            variant="destructive" 
                            onClick={handleEndSession} 
                            className="bg-[#EF4444] hover:bg-red-600 text-white font-black text-[10px] tracking-[0.2em] px-8 h-12 rounded-xl shrink-0 uppercase shadow-lg shadow-red-100 transition-all active:scale-95"
                        >
                            END SESSION & SEARCH NEW
                        </Button>
                    </div>

                    <div className="mt-10">
                        <TabsContent value="overview" className="focus-visible:outline-none">
                            <DashboardOverview 
                                metrics={metrics}
                                outstandingByGroup={outstandingByGroup}
                                consumptionData={consumptionData}
                                recentTransactions={paymentHistory}
                                myRequests={requestList}
                                changeServiceDetails={changeServiceDetails}
                            />
                        </TabsContent>

                        <TabsContent value="details" className="focus-visible:outline-none">
                            <Card className="p-10 shadow-sm border-none bg-white rounded-3xl">
                                <h3 className="text-2xl font-black mb-10 flex items-center gap-3 text-teal-900">
                                    <User className="h-7 w-7" /> Profile Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                                    <div className="space-y-2"><Label className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Account ID</Label><p className="form-input-val font-black text-slate-800 text-lg border-b pb-2">{accountData.AccountNumber || "-"}</p></div>
                                    <div className="space-y-2"><Label className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Legacy Reference</Label><p className="form-input-val font-black text-slate-800 text-lg border-b pb-2">{accountData.LegacyId || "-"}</p></div>
                                    <div className="space-y-2"><Label className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Billing Cycle</Label><p className="form-input-val font-black text-slate-800 text-lg border-b pb-2">{accountData.ServiceType || "POSTPAID"}</p></div>
                                    
                                    {accountData.customerInfo && (
                                        <>
                                            <div className="space-y-2"><Label className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Subscriber Name</Label><p className="form-input-val font-black text-slate-800 text-lg border-b pb-2">{accountData.customerInfo.tenantNameEn ? decryptString(accountData.customerInfo.tenantNameEn) : "--"}</p></div>
                                            <div className="space-y-2"><Label className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Electronic Mail</Label><p className="form-input-val font-black text-slate-800 text-lg border-b pb-2 lowercase">{accountData.customerInfo.emailId ? decryptString(accountData.customerInfo.emailId) : "--"}</p></div>
                                            <div className="space-y-2"><Label className="text-gray-400 text-[10px] font-black uppercase tracking-widest">GSM Protocol</Label><p className="form-input-val font-black text-slate-800 text-lg border-b pb-2">{accountData.customerInfo.gsmNumber ? decryptString(accountData.customerInfo.gsmNumber) : "--"}</p></div>
                                        </>
                                    )}
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="requests" className="focus-visible:outline-none">
                            <Card className="p-10 shadow-sm border-none bg-white rounded-3xl">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-2xl font-black flex items-center gap-3 text-teal-900 uppercase tracking-tighter">
                                        <FileText className="h-7 w-7" /> Support Tickets
                                    </h3>
                                    <Button className="bg-teal-900 hover:bg-teal-800 font-black text-[10px] tracking-widest shadow-lg shadow-teal-50 px-8 py-6 rounded-2xl">CREATE TICKET</Button>
                                </div>
                                <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-slate-900">
                                            <TableRow className="hover:bg-slate-900 border-none">
                                                <TableHead className="text-white font-black h-14 uppercase text-[10px] tracking-widest text-center">Reference</TableHead>
                                                <TableHead className="text-white font-black h-14 uppercase text-[10px] tracking-widest">Service Classification</TableHead>
                                                <TableHead className="text-white font-black h-14 uppercase text-[10px] tracking-widest">Incident Date</TableHead>
                                                <TableHead className="text-white font-black h-14 uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="bg-white">
                                            {requestList.length > 0 ? (
                                                requestList.map((req: any, index: number) => (
                                                    <TableRow key={index} className="hover:bg-slate-50 border-b-slate-50 h-16 transition-colors">
                                                        <TableCell className="font-bold text-teal-900 text-center">{req.CompletionRequestID || req["Ref.Number"]}</TableCell>
                                                        <TableCell className="font-medium text-slate-700">{req.RequestType || req["service Name"]}</TableCell>
                                                        <TableCell className="text-slate-500 text-sm font-medium">{req.RequestDate || req["Updated Date"]}</TableCell>
                                                        <TableCell className="text-center">
                                                            <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-sm ${
                                                                (req.RequestStatus || req.Status) === 'Completed' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                            }`}>
                                                                {req.RequestStatus || req.Status}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-20 text-slate-300 font-black tracking-[0.4em] bg-white border-none uppercase text-xs">NO SUPPORT TICKET HISTORY</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
      </main>

      {/* CUSTOM CSS FOR HIDE SCROLLBAR */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
