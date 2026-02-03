"use client"
import React, { useMemo } from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, FileText, CreditCard, Bell } from "lucide-react"
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts'
import { format, subMonths, subWeeks, startOfDay } from "date-fns"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/app/(dashboard)/branch-operations/account-dashboard/[accountNumber]/column"

interface DashboardOverviewProps {
    accountNumber: string
    legacyAccountNumber?: string
    metrics: {
        outstanding: string
        requests: number
        transactions: number
        alarms: number
    }
    outstandingByGroup: any[]
    consumptionData: any[]
    recentTransactions: any[]
    myRequests: any[]
    changeServiceDetails: any[]
    ccbStatus?: any
    menuData?: any[]
    onSwitchTab?: (tab: string) => void
    activeInterval?: 'Monthly' | 'Daily' | 'Hourly'
    requestSummary?: {
        Pending: number
        Completed: number
        Cancelled: number
        TotalCount: number
    }
    smrData?: any[]
    onIntervalChange?: (interval: 'Monthly' | 'Daily' | 'Hourly') => void
    onRequestIntervalChange?: (interval: 'all' | 'month' | 'week') => void
}

export default React.memo(function DashboardOverview({ 
    accountNumber,
    legacyAccountNumber,
    metrics, 
    outstandingByGroup, 
    consumptionData,
    recentTransactions,
    myRequests,
    changeServiceDetails,
    ccbStatus,
    menuData,
    onSwitchTab,
    onIntervalChange,
    activeInterval = 'Monthly',
    requestSummary,
    smrData = [],
    onRequestIntervalChange
}: DashboardOverviewProps) {
    
    const [requestActiveInterval, setRequestActiveInterval] = React.useState<'all' | 'month' | 'week'>('all')

    // Process data for charts
    const dueAmountData = useMemo(() => {
        if (!outstandingByGroup || outstandingByGroup.length === 0) return []
        
        const groupMapping: {[key: string]: string} = {
            'demo1': 'Refund',
            'demo2 group': 'My Accounts',
            'demo3 groups': 'Testing',
            'demo4 groups': 'Miscellaneous',
            'demo5 groups': 'Arrears'
        }

        return outstandingByGroup.map((item: any) => ({
            name: groupMapping[item.GroupName] || item.GroupName,
            value: parseFloat(item.GroupOutstandingAmount || item.Amount || "0")
        })).filter(item => item.value > 0)
    }, [outstandingByGroup])

    const totalDueFromGroups = useMemo(() => {
        return dueAmountData.reduce((sum, item) => sum + item.value, 0).toFixed(3)
    }, [dueAmountData])

    const requestStatusData = useMemo(() => {
        if (requestSummary) {
            return [
            ]
        }
        return [
            { name: 'Pending', value: myRequests.filter(r => (r.RequestStatus || r.Status || '').toLowerCase().includes('pending') || (r.RequestStatus || r.Status || '').toLowerCase().includes('progress')).length, color: '#f43f5e' },
            { name: 'Completed', value: myRequests.filter(r => (r.RequestStatus || r.Status || '').toLowerCase().includes('completed')).length, color: '#0f766e' },
            { name: 'Cancelled', value: myRequests.filter(r => (r.RequestStatus || r.Status || '').toLowerCase().includes('cancelled')).length, color: '#94a3b8' },
        ]
    }, [myRequests, requestSummary])

    const totalRequestsSafe = useMemo(() => {
        if (requestSummary) return requestSummary.TotalCount || 0
        return requestStatusData.reduce((sum, item) => sum + item.value, 0)
    }, [requestSummary, requestStatusData])

    const consumptionSubtitle = useMemo(() => {
        const now = new Date()
        if (activeInterval === 'Monthly') {
            const start = subMonths(now, 11)
            return `${format(start, 'dd-MM-yyyy')} - ${format(now, 'dd-MM-yyyy')}`
        }
        if (activeInterval === 'Daily') {
            const start = subWeeks(now, 4)
            return `${format(start, 'dd-MM-yyyy')} - ${format(now, 'dd-MM-yyyy')}`
        }
        // Hourly
        const start = startOfDay(now)
        return `${format(start, 'dd-MM-yyyy')} - ${format(now, 'dd-MM-yyyy')}`
    }, [activeInterval])

    const smrChartData = useMemo(() => {
        if (!smrData || smrData.length === 0) return []
        return smrData.slice(-12).map(item => {
            const date = item.LastReadingDate ? new Date(item.LastReadingDate) : null
            const isValidDate = date && !isNaN(date.getTime())
            return {
                name: isValidDate ? format(date!, 'MMM yy') : '--',
                value: parseFloat(item.SMR || item.Reading || "0")
            }
        })
    }, [smrData])

    const consumptionChartData = useMemo(() => {
        return consumptionData.map(item => {
            const date = item.Date ? new Date(item.Date) : null
            const isValidDate = date && !isNaN(date.getTime())
            return {
                name: isValidDate ? format(date!, 'dd/MM') : '--',
                value: parseFloat(item.Value || "0")
            }
        })
    }, [consumptionData])

    return (
        <div className="space-y-6 pb-10">
            
            {/* Row 1: Metrics Cards - UAT Style (Icon Left, Value Right) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Total Outstanding */}
                <Card className="p-4 bg-white border border-slate-100 shadow-sm rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                            <Wallet className="h-6 w-6 text-red-500" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-medium text-slate-400 leading-tight mb-1">Total Outstanding Amount</div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-slate-800">{metrics.outstanding}</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase">OMR</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Total Requests */}
                <Card className="p-4 bg-white border border-slate-100 shadow-sm rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <FileText className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-medium text-slate-400 leading-tight mb-1">Total Requests</div>
                            <div className="text-xl font-black text-blue-600">{metrics.requests}</div>
                        </div>
                    </div>
                </Card>

                {/* Transaction */}
                <Card className="p-4 bg-white border border-slate-100 shadow-sm rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                            <CreditCard className="h-6 w-6 text-teal-500" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-medium text-slate-400 leading-tight mb-1">Transactions</div>
                            <div className="text-xl font-black text-teal-600">{metrics.transactions}</div>
                        </div>
                    </div>
                </Card>

                {/* Alarms */}
                <Card className="p-4 bg-white border border-slate-100 shadow-sm rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                            <Bell className="h-6 w-6 text-orange-500" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-medium text-slate-400 leading-tight mb-1">Alarms</div>
                            <div className="text-xl font-black text-orange-600">{metrics.alarms}</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Row 2: Due Amount & Unit Consumed */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Due Amount */}
                <Card className="lg:col-span-2 p-6 shadow-sm border-none bg-white rounded-2xl">
                    <h3 className="text-base font-black text-slate-800 mb-6 uppercase tracking-tight">Due Amount</h3>
                    <div className="flex flex-col gap-6">
                        <div className="relative h-48 w-full flex items-center justify-center min-h-[192px] min-w-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <PieChart>
                                    <Pie
                                        data={dueAmountData.length > 0 ? dueAmountData : [{value: 1}]}
                                        innerRadius={65}
                                        outerRadius={80}
                                        dataKey="value"
                                        stroke="none"
                                        paddingAngle={2}
                                    >
                                        {dueAmountData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#6366f1" : "#a5b4fc"} />
                                        ))}
                                        {dueAmountData.length === 0 && <Cell fill="#F1F5F9" />}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="h-28 w-28 rounded-full bg-white border border-slate-100 flex flex-col items-center justify-center">
                                    <span className="text-xl font-black text-red-500 leading-tight">{totalDueFromGroups !== "0.000" ? totalDueFromGroups : metrics.outstanding}</span>
                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">OMR</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-32 w-full mt-4 min-h-[150px]">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Group wise due amount</p>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dueAmountData} layout="vertical" margin={{ left: -20, right: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} width={80} />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                        {dueAmountData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#6366f1" : "#a5b4fc"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Card>

                {/* Unit Consumed */}
                <Card className="lg:col-span-3 p-5 shadow-sm border-none bg-white rounded-2xl overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div className="space-y-1">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex flex-wrap items-center gap-2">
                                Unit Consumed <span className="text-[10px] text-gray-400 font-medium lowercase tracking-normal">{consumptionSubtitle}</span>
                            </h3>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <Button 
                                variant={activeInterval === 'Monthly' ? "secondary" : "ghost"} 
                                size="sm" 
                                onClick={() => onIntervalChange?.('Monthly')}
                                className={`h-6 text-[9px] font-black px-3 ${activeInterval === 'Monthly' ? "bg-white shadow-sm" : "hover:bg-white hover:shadow-sm transition-all"}`}
                            >
                                Monthly
                            </Button>
                            <Button 
                                variant={activeInterval === 'Daily' ? "secondary" : "ghost"} 
                                size="sm" 
                                onClick={() => onIntervalChange?.('Daily')}
                                className={`h-6 text-[9px] font-black px-3 ${activeInterval === 'Daily' ? "bg-white shadow-sm" : "hover:bg-white hover:shadow-sm transition-all"}`}
                            >
                                Daily
                            </Button>
                            <Button 
                                variant={activeInterval === 'Hourly' ? "secondary" : "ghost"} 
                                size="sm" 
                                onClick={() => onIntervalChange?.('Hourly')}
                                className={`h-6 text-[9px] font-black px-3 ${activeInterval === 'Hourly' ? "bg-white shadow-sm" : "hover:bg-white hover:shadow-sm transition-all"}`}
                            >
                                Hourly
                            </Button>
                        </div>
                    </div>
                    <div className="h-72 w-full min-h-[288px] min-w-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={consumptionChartData} margin={{ top: 10, right: 0, left: -25, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" fontSize={9} fontWeight={700} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                                <YAxis axisLine={false} tickLine={false} fontSize={9} />
                                <Bar dataKey="value" fill="#EF4444" radius={[2, 2, 0, 0]} barSize={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="flex justify-center mt-2">
                          <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                  <span className="text-[9px] font-black text-slate-500 uppercase">{legacyAccountNumber || "--"}</span>
                              </div>
                          </div>
                     </div>
                </Card>
            </div>

            {/* Row 3: Recent Transactions & My Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transactions */}
                <Card className="p-5 shadow-sm border-none bg-white rounded-2xl overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Recent Transactions</h3>
                        <Button 
                            variant="link" 
                            onClick={() => onSwitchTab?.('paybill')}
                            className="text-teal-600 text-[10px] font-black uppercase p-0 h-auto"
                        >
                            View All
                        </Button>
                    </div>
                    <div className="w-full">
                        <div className="overflow-x-auto custom-scrollbar pb-2">
                            <div className="min-w-max">
                                <DataTable 
                                    columns={columns} 
                                    data={recentTransactions.slice(0, 5)} 
                                    hidePagination={true}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* My Requests */}
                <Card className="p-5 shadow-sm border-none bg-white rounded-2xl overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">My Requests</h3>
                        <Button 
                            variant="link" 
                            onClick={() => onSwitchTab?.('requests')}
                            className="text-teal-600 text-[10px] font-black uppercase p-0 h-auto"
                        >
                            View All
                        </Button>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="flex bg-slate-100 p-1 rounded-lg mb-8 w-full sm:w-auto overflow-x-auto no-scrollbar">
                            <Button 
                                variant={requestActiveInterval === 'all' ? "secondary" : "ghost"} 
                                size="sm" 
                                onClick={() => { setRequestActiveInterval('all'); onRequestIntervalChange?.('all'); }}
                                className={`flex-1 sm:flex-none h-8 text-[10px] font-black px-6 ${requestActiveInterval === 'all' ? "bg-slate-800 text-white shadow-sm" : "text-slate-400"}`}
                            >
                                All Time
                            </Button>
                            <Button 
                                variant={requestActiveInterval === 'month' ? "secondary" : "ghost"} 
                                size="sm" 
                                onClick={() => { setRequestActiveInterval('month'); onRequestIntervalChange?.('month'); }}
                                className={`flex-1 sm:flex-none h-8 text-[10px] font-black px-6 ${requestActiveInterval === 'month' ? "bg-slate-800 text-white shadow-sm" : "text-slate-400"}`}
                            >
                                This month
                            </Button>
                            <Button 
                                variant={requestActiveInterval === 'week' ? "secondary" : "ghost"} 
                                size="sm" 
                                onClick={() => { setRequestActiveInterval('week'); onRequestIntervalChange?.('week'); }}
                                className={`flex-1 sm:flex-none h-8 text-[10px] font-black px-6 ${requestActiveInterval === 'week' ? "bg-slate-800 text-white shadow-sm" : "text-slate-400"}`}
                            >
                                This week
                            </Button>
                        </div>
                        
                        <div className="flex flex-col items-center w-full gap-8">
                            <div className="relative h-48 sm:h-56 w-48 sm:w-56 shrink-0 min-h-[192px] min-w-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <PieChart>
                                        <Pie
                                            data={requestStatusData}
                                            innerRadius={65}
                                            outerRadius={85}
                                            dataKey="value"
                                            stroke="none"
                                            paddingAngle={0}
                                            startAngle={90}
                                            endAngle={450}
                                        >
                                            {requestStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl sm:text-4xl font-black text-slate-800 leading-none">{totalRequestsSafe}</span>
                                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{totalRequestsSafe === 0 ? "No Requests" : "Total Requests"}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 sm:gap-10 w-full pt-4">
                                {requestStatusData.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-[2px]" style={{backgroundColor: s.color}}></div>
                                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 tracking-tight">{s.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Row 4: Change Service Type Details & Last Meter Reading */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                {/* Change Service Type Details */}
                <Card className="p-5 shadow-sm border-none bg-white rounded-2xl overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                         <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Change Service Type Details</h3>
                         <Button variant="link" className="text-teal-600 text-[10px] font-black uppercase p-0 h-auto">View All</Button>
                    </div>
                    <div className="min-h-[160px] w-full">
                        <div className="overflow-x-auto custom-scrollbar pb-2">
                            <div className="min-w-max">
                                <DataTable
                                    columns={[
                                        { id: "srNo", header: "Sr No", cell: ({ row }) => <span className="text-gray-500 font-bold">{row.index + 1}</span> },
                                        { accessorKey: "AccountNo", header: "Account No", cell: ({ row }) => <span className="font-bold">{row.original.AccountNo || row.original.AccountNumber || row.original.accountNumber || row.original.AccNo}</span> },
                                        { accessorKey: "Status", header: "Status", cell: ({ row }) => <span className="text-blue-600 font-bold uppercase text-[10px]">{row.original.Status || row.original.ServiceStatus || row.original.RequestStatus || row.original.StatusDesc}</span> },
                                        { accessorKey: "Date", header: "Date", cell: ({ row }) => <span>{row.original.Date || row.original.RequestDate || row.original.ReqDate || row.original.DateTime}</span> },
                                        { accessorKey: "BillAmount", header: "Bill Amount", cell: ({ row }) => <span className="font-black text-teal-700">{row.original.BillAmount || row.original.Amount || row.original.RequestedAmount || row.original.Total}</span> },
                                        { 
                                            id: "actions", 
                                            header: "Action", 
                                            cell: () => <Button className="h-7 px-3 bg-[#5F8D92] hover:bg-[#4D767A] text-white text-[9px] font-bold rounded">Pay Now</Button> 
                                        }
                                    ]}
                                    data={changeServiceDetails}
                                    hidePagination={true}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Last Meter Reading */}
                <Card className="p-5 shadow-sm border-none bg-white rounded-2xl overflow-hidden">
                    <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-tight">Last Meter Reading</h3>
                    <div className="h-64 w-full min-h-[256px] min-w-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart 
                                data={smrChartData.length > 0 ? smrChartData : [{name: 'Jan', value: 0}, {name: 'Feb', value: 0}]} 
                                margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis 
                                    dataKey="name" 
                                    fontSize={8} 
                                    fontWeight={600}
                                    axisLine={false} 
                                    tickLine={false} 
                                    angle={-45} 
                                    textAnchor="end"
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    fontSize={9}
                                    label={{ value: 'Reading', angle: -90, position: 'insideLeft', fontSize: 10 }}
                                />
                                <Tooltip 
                                    cursor={{fill: 'rgba(6, 78, 59, 0.05)'}}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-slate-900 text-white p-2 rounded shadow-lg text-[10px] font-black uppercase">
                                                    {payload[0].value} M3
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Bar dataKey="value" fill="#064E3B" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center mt-4">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-8 bg-[#064E3B] rounded-sm"></div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reading</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
})
