"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, FileText, CreditCard, Bell, User, Calendar, AlertTriangle } from "lucide-react"
import { branchOpsService } from "@/services/branchops.service"
import { decryptString } from "@/lib/crypto"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AccountDashboardPage() {
  const router = useRouter()
  const [accountData, setAccountData] = useState<any>(null)

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
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load data from session storage (passed from validate page)
    const storedData = sessionStorage.getItem("branchAccountData")
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        setAccountData(parsedData)
        const sessionData = JSON.parse(sessionStorage.getItem("branchAccountData") || '{}')
        // const accNum = sessionData.CCBAccountNumber || sessionData.AccountNumber
        // Reference app uses CCBAccountNumber for most dashboard calls. 
        // If CCBAccountNumber is missing, falling back to AccountNumber is reasonable, but potentially wrong if formats differ.
        const accNum = sessionData.CCBAccountNumber || sessionData.AccountNumber
        const legacyAccNum = sessionData.AccountNumber // Just in case we need the original input
        if (accNum) {
             loadDashboardData(accNum)
        }
      } catch (e) {
        console.error("Failed to parse account data", e)
      }
    }
  }, [])

  const loadDashboardData = async (accNum: string) => {
      setIsLoading(true)
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

          // Fetch additional data
          const [byGroup, consData, reqList, apptList] = await Promise.all([
              branchOpsService.getOutstandingByGroup(accNum),
              branchOpsService.getConsumptionData(accNum),
              branchOpsService.getMyRequestList(accNum),
              branchOpsService.getAppointmentList(accNum)
          ])

          // Flatten outstanding by group
          const flattenedByGroup = (byGroup || []).map((g: any) => ({
              GroupName: g.GroupName,
              Amount: g.Accounts?.[0]?.GroupOutstandingAmount || "0"
          }))
          setOutstandingByGroup(flattenedByGroup)

          // Flatten consumption data (assume first account for one search)
          const flattenedConsumption = (consData?.[0]?.readings || []).map((r: any) => ({
              Date: r.readingDate,
              Value: r.consumption
          }))
          setConsumptionData(flattenedConsumption)

          setRequestList(reqList || [])
          setAppointmentList(apptList || [])
          
      } catch (err) {
          console.warn("Failed to load dashboard data", err)
      } finally {
          setIsLoading(false)
      }
  }
  
  const handleEndSession = async () => {
    try {
      await branchOpsService.logout()
    } catch (err) {
      console.warn("Logout API failed, clearing local state anyway", err)
    }
    sessionStorage.clear()
    localStorage.clear()
    router.push('/branch-operations/validate')
  }

  if (!accountData) {
    return <div className="p-8">Loading account details...</div>
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header / Tabs */}
      <div className="flex items-center justify-between space-y-2">
        <Tabs defaultValue="overview" className="space-y-4 w-full">
            <div className="flex justify-between items-center mb-4">
                 <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="details">Account details</TabsTrigger>
                    <TabsTrigger value="requests">Request/Complaints</TabsTrigger>
                    <TabsTrigger value="appointments">Appointments</TabsTrigger>
                    <TabsTrigger value="alarm">Alarm</TabsTrigger>
                    <TabsTrigger value="paybill">View & Pay Your Bill</TabsTrigger>
                </TabsList>
                <Button variant="destructive" onClick={handleEndSession}>
                    End The Session & Search New
                </Button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow mb-6">
                 <h2 className="text-lg font-semibold mb-2">Account Number: {accountData.AccountNumber || "N/A"}</h2>
            </div>
            
          <TabsContent value="overview" className="space-y-4">
            
            {/* Profile Section */}
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3">
                    <Card className="p-6 flex flex-col items-center justify-center text-center space-y-4 h-full">
                        <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-12 w-12 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-bold">{accountData.FullNameEn || "Customer Name"}</h3>
                        
                        <div className="w-full text-left space-y-2 mt-4 pt-4 border-t">
                             <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Account Number :</span>
                                <span className="text-sm">{accountData.AccountNumber}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Account Type :</span>
                                <span className="text-sm">{accountData.AccountType || "POSTPAID"}</span>
                             </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Water Meter Number :</span>
                                <span className="text-sm">{accountData.MeterNumber || "N/A"}</span>
                             </div>
                        </div>
                    </Card>
                </div>

                <div className="col-span-9 space-y-4">
                    {/* Metrics Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-6 flex flex-col justify-between">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="text-sm font-medium text-muted-foreground">Total Outstanding Amount</div>
                        <Wallet className="h-8 w-8 text-red-500 opacity-75" />
                        </div>
                        <div>
                        <div className="text-2xl font-bold text-red-500">{metrics.outstanding} <span className="text-sm text-gray-500">OMR</span></div>
                        </div>
                    </Card>
                    <Card className="p-6 flex flex-col justify-between">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                         <div className="text-sm font-medium text-muted-foreground">Total Requests</div>
                         <FileText className="h-8 w-8 text-blue-500 opacity-75" />
                        </div>
                        <div>
                        <div className="text-2xl font-bold text-blue-500">{metrics.requests}</div>
                        </div>
                    </Card>
                    <Card className="p-6 flex flex-col justify-between">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="text-sm font-medium text-muted-foreground">Transactions</div>
                         <CreditCard className="h-8 w-8 text-green-500 opacity-75" />
                        </div>
                        <div>
                        <div className="text-2xl font-bold text-green-500">{metrics.transactions}</div>
                        </div>
                    </Card>
                    <Card className="p-6 flex flex-col justify-between">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="text-sm font-medium text-muted-foreground">Alarms</div>
                        <Bell className="h-8 w-8 text-orange-500 opacity-75" />
                        </div>
                        <div>
                        <div className="text-2xl font-bold text-orange-500">{metrics.alarms}</div>
                        </div>
                    </Card>
                    </div>
                
                     {/* Charts Section Placeholder */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-3 p-6">
                             <h3 className="text-lg font-medium mb-4">Due Amount</h3>
                             <div className="h-[250px] flex flex-col justify-end space-y-2">
                                 {outstandingByGroup.length > 0 ? (
                                    <div className="flex items-baseline justify-around h-full pt-4">
                                        {outstandingByGroup.slice(0, 5).map((item, idx) => (
                                            <div key={idx} className="flex flex-col items-center group relative h-full justify-end">
                                                <div 
                                                    className="w-12 bg-blue-500 rounded-t transition-all hover:bg-blue-600 cursor-help"
                                                    style={{ height: `${Math.min(100, (parseFloat(item.Amount) / 500) * 100)}%` }}
                                                    title={`${item.GroupName}: ${item.Amount} OMR`}
                                                ></div>
                                                <span className="text-[10px] mt-2 rotate-45 origin-left whitespace-nowrap">{item.GroupName}</span>
                                            </div>
                                        ))}
                                    </div>
                                 ) : (
                                    <div className="flex-1 flex items-center justify-center bg-gray-50 border border-dashed rounded text-gray-400">
                                        No Due Data
                                    </div>
                                 )}
                             </div>
                        </Card>
                        <Card className="col-span-4 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">Unit Consumed</h3>
                                 <div className="flex space-x-2">
                                     <Button variant="secondary" size="sm">Monthly</Button>
                                     <Button variant="ghost" size="sm" disabled>Daily</Button>
                                     <Button variant="ghost" size="sm" disabled>Hourly</Button>
                                 </div>
                            </div>
                            <div className="h-[250px] flex flex-col justify-end">
                                {consumptionData.length > 0 ? (
                                    <div className="flex items-baseline justify-around h-full pt-4">
                                        {consumptionData.slice(0, 12).map((item, idx) => (
                                            <div key={idx} className="flex flex-col items-center group relative h-full justify-end w-full">
                                                <div 
                                                    className="w-8 bg-green-500 rounded-t transition-all hover:bg-green-600 cursor-help"
                                                    style={{ height: `${Math.min(100, (parseFloat(item.Value) / 100) * 100)}%` }}
                                                    title={`${item.Date}: ${item.Value} Units`}
                                                ></div>
                                                <span className="text-[10px] mt-2 -rotate-45 origin-center">{item.Date ? new Date(item.Date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : idx+1}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center bg-gray-50 border border-dashed rounded text-gray-400">
                                        No Consumption Data
                                    </div>
                                )}
                             </div>
                        </Card>
                    </div>

                </div>
            </div>

          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card className="p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <User className="h-5 w-5" /> Account Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><Label className="text-gray-500">Account Number</Label><p className="font-medium">{accountData.AccountNumber || "-"}</p></div>
                    <div><Label className="text-gray-500">Legacy ID</Label><p className="font-medium">{accountData.LegacyId || "-"}</p></div>
                    <div><Label className="text-gray-500">Service Type</Label><p className="font-medium">{accountData.ServiceType || "-"}</p></div>
                    
                    {accountData.customerInfo && (
                        <>
                            <div><Label className="text-gray-500">Tenant Name</Label><p className="font-medium">{accountData.customerInfo.tenantNameEn ? decryptString(accountData.customerInfo.tenantNameEn) : "-"}</p></div>
                            <div><Label className="text-gray-500">Email</Label><p className="font-medium">{accountData.customerInfo.emailId ? decryptString(accountData.customerInfo.emailId) : "-"}</p></div>
                            <div><Label className="text-gray-500">GSM</Label><p className="font-medium">{accountData.customerInfo.gsmNumber ? decryptString(accountData.customerInfo.gsmNumber) : "-"}</p></div>
                            <div><Label className="text-gray-500">Civil ID</Label><p className="font-medium">{accountData.customerInfo.civilId ? decryptString(accountData.customerInfo.civilId) : "-"}</p></div>
                            <div><Label className="text-gray-500">Area</Label><p className="font-medium">{accountData.customerInfo.area || "-"}</p></div>
                             <div><Label className="text-gray-500">Meter Number</Label><p className="font-medium">{accountData.customerInfo.meterNumber || "-"}</p></div>
                        </>
                    )}
                </div>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
              <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" /> Requests & Complaints
                  </h3>
                   <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Request ID</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requestList.length > 0 ? (
                                    requestList.map((req: any, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell>{req.CompletionRequestID}</TableCell>
                                            <TableCell>{req.RequestType}</TableCell>
                                            <TableCell>{req.RequestDate}</TableCell>
                                            <TableCell>{req.RequestStatus}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">No requests found</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                   </div>
              </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
               <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5" /> Appointments
                  </h3>
                   <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Appointment ID</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appointmentList.length > 0 ? (
                                    appointmentList.map((appt: any, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell>{appt.AppointmentID}</TableCell>
                                            <TableCell>{appt.ServiceName}</TableCell>
                                            <TableCell>{appt.AppointmentDate}</TableCell>
                                            <TableCell>{appt.Status}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">No appointments found</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                   </div>
              </Card>
          </TabsContent>

          <TabsContent value="alarm" className="space-y-4">
              <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" /> Alarms
                  </h3>
                  <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sr No</TableHead>
                                    <TableHead>Device ID</TableHead>
                                    <TableHead>Notification Description</TableHead>
                                    <TableHead>Alert Date</TableHead>
                                    <TableHead>Alarm Type</TableHead>
                                    <TableHead>Mobile NO</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alarmList.length > 0 ? (
                                    alarmList.map((alarm: any, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{alarm.Device_ID}</TableCell>
                                            <TableCell>{alarm.AlarmDescription}</TableCell>
                                            <TableCell>{alarm.Alert_Date}</TableCell>
                                            <TableCell>{alarm.AlertType}</TableCell>
                                            <TableCell>{alarm.Mobile_Number}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">No alarms found</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                   </div>
              </Card>
          </TabsContent>

          <TabsContent value="paybill" className="space-y-4">
              <Card className="p-6">
                   <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <CreditCard className="h-5 w-5" /> Payment History
                        </h3>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Total Outstanding</p>
                            <p className="text-2xl font-bold text-red-500">{metrics.outstanding} OMR</p>
                        </div>
                   </div>
                   
                   <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction Date</TableHead>
                                    <TableHead>Amount (OMR)</TableHead>
                                    <TableHead>Payment Channel</TableHead>
                                    <TableHead>Transaction ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paymentHistory.length > 0 ? (
                                    paymentHistory.map((payment: any, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell>{payment.PaymentDate}</TableCell>
                                            <TableCell>{payment.Amount}</TableCell>
                                            <TableCell>{payment.PaymentChannel}</TableCell>
                                            <TableCell>{payment.TransactionID}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">No payment history found</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                   </div>
              </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
