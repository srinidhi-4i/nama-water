"use client"
import React, { useMemo } from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, FileText, CreditCard, Bell, Filter, ChevronRight, LayoutDashboard, History, ClipboardList, Settings2 } from "lucide-react"
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/app/(dashboard)/branch-operations/account-dashboard/[accountNumber]/column"

interface DashboardOverviewProps {
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
}

export default React.memo(function DashboardOverview({ 
    metrics, 
    outstandingByGroup, 
    consumptionData,
    recentTransactions,
    myRequests,
    changeServiceDetails
}: DashboardOverviewProps) {

    // Process data for charts
    const dueAmountData = useMemo(() => {
        return outstandingByGroup.length > 0 ? outstandingByGroup.map(item => ({
            name: item.GroupName,
            value: parseFloat(item.Amount || "0")
        })) : []
    }, [outstandingByGroup])

    const requestStatusData = useMemo(() => {
        return [
            { name: 'Completed', value: myRequests.filter(r => (r.RequestStatus || r.Status) === 'Completed').length, color: '#10B981' },
            { name: 'Pending', value: myRequests.filter(r => (r.RequestStatus || r.Status) === 'Pending' || (r.RequestStatus || r.Status) === 'In Progress' || (r.RequestStatus || r.Status) === 'Assigned to Contractor').length, color: '#3B82F6' },
            { name: 'Cancelled', value: myRequests.filter(r => (r.RequestStatus || r.Status) === 'Cancelled').length, color: '#9CA3AF' },
        ].filter(d => d.value > 0)
    }, [myRequests])

    const consumptionChartData = useMemo(() => {
        return consumptionData.map(item => ({
            name: item.Date ? new Date(item.Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '',
            value: parseFloat(item.Value || "0")
        }))
    }, [consumptionData])

    return (
        <div className="space-y-8 pb-10">
            
            {/* Row 1: Metrics - Grid for top summary */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-6 flex flex-row items-center justify-between border-none shadow-sm bg-white hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                    <div>
                        <div className="text-3xl font-black text-red-500 mb-1">
                            {metrics.outstanding} <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">OMR</span>
                        </div>
                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Outstanding</div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center group-hover:bg-red-500 group-hover:scale-110 transition-all duration-300">
                        <Wallet className="h-6 w-6 text-red-500 group-hover:text-white" />
                    </div>
                </Card>
                 <Card className="p-6 flex flex-row items-center justify-between border-none shadow-sm bg-white hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div>
                        <div className="text-3xl font-black text-blue-500 mb-1">
                            {metrics.requests}
                        </div>
                         <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Requests</div>
                    </div>
                     <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-300">
                        <FileText className="h-6 w-6 text-blue-500 group-hover:text-white" />
                    </div>
                </Card>
                 <Card className="p-6 flex flex-row items-center justify-between border-none shadow-sm bg-white hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                    <div>
                        <div className="text-3xl font-black text-green-500 mb-1">
                             {metrics.transactions}
                        </div>
                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Transactions</div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center group-hover:bg-green-500 group-hover:scale-110 transition-all duration-300">
                        <CreditCard className="h-6 w-6 text-green-500 group-hover:text-white" />
                    </div>
                </Card>
                 <Card className="p-6 flex flex-row items-center justify-between border-none shadow-sm bg-white hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                    <div>
                        <div className="text-3xl font-black text-orange-500 mb-1">
                             {metrics.alarms}
                        </div>
                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Active Alarms</div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:scale-110 transition-all duration-300">
                        <Bell className="h-6 w-6 text-orange-500 group-hover:text-white" />
                    </div>
                </Card>
            </div>

            {/* VERTICAL STACKED COMPONENTS - One Per Row */}

            {/* Due Amount Section */}
            <Card className="p-8 shadow-sm border-none bg-white">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-8 w-8 rounded-lg bg-teal-900 flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Due Amount Breakdown</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-10">
                     <div className="relative h-[280px] w-full flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                            <Pie
                                data={[{value: 100}]}
                                innerRadius={75}
                                outerRadius={95}
                                fill="#F1F5F9"
                                dataKey="value"
                                stroke="none"
                            />
                            <Pie
                                data={dueAmountData.length > 0 ? dueAmountData : [{name: 'None', value: 0}]}
                                innerRadius={75}
                                outerRadius={95}
                                dataKey="value"
                                stroke="none"
                                animationBegin={0}
                                animationDuration={1000}
                            >
                                 {dueAmountData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill="#EF4444" />
                                ))}
                            </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-black text-red-500">{metrics.outstanding}</span>
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Total OMR</span>
                         </div>
                    </div>
                     <div className="w-full h-[280px]">
                         <div className="flex items-center justify-between mb-4">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Group wise outstanding</p>
                             <div className="h-1 px-10 bg-slate-100 rounded-full"></div>
                         </div>
                         <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={dueAmountData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tick={{fill: '#64748B'}} />
                                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94A3B8'}} />
                                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={48} label={{ position: 'top', fill: '#1E293B', fontSize: 10, fontWeight: 700 }} />
                            </BarChart>
                         </ResponsiveContainer>
                     </div>
                </div>
            </Card>

            {/* Unit Consumed Section */}
            <Card className="p-8 shadow-sm border-none bg-white">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center">
                            <LayoutDashboard className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Consumption Trends</h3>
                    </div>
                    <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                        <Button variant="default" size="sm" className="h-8 text-[11px] font-bold bg-white text-slate-800 shadow-sm border border-slate-200 px-5 hover:bg-white">MONTHLY</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-gray-500 hover:text-slate-800 px-5">DAILY</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-gray-500 hover:text-slate-800 px-5">HOURLY</Button>
                    </div>
                </div>
                <div className="h-[350px] w-full pt-4">
                    {consumptionChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={consumptionChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#F8FAFC" />
                                <XAxis dataKey="name" fontSize={10} fontWeight={600} axisLine={false} tickLine={false} stroke="#94A3B8" />
                                <YAxis fontSize={10} fontWeight={600} axisLine={false} tickLine={false} stroke="#94A3B8" />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="url(#colorRed)" radius={[4, 4, 0, 0]} barSize={12}>
                                    <defs>
                                        <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={1}/>
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0.6}/>
                                        </linearGradient>
                                    </defs>
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                         <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
                            <LayoutDashboard className="h-10 w-10 text-slate-200 mb-2" />
                            <span className="text-xs font-bold uppercase tracking-[0.2em]">No Consumption Analytics</span>
                         </div>
                    )}
                </div>
            </Card>

            {/* Recent Transactions Table */}
            <Card className="p-8 shadow-sm border-none bg-white">
                 <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
                            <History className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Transaction History</h3>
                    </div>
                    <Button variant="outline" size="sm" className="text-[11px] font-bold border-teal-800 text-teal-800 hover:bg-teal-50 px-5 gap-2">
                        VIEW FULL HISTORY <ChevronRight className="h-3 w-3" />
                    </Button>
                </div>
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <DataTable 
                        columns={columns} 
                        data={recentTransactions || []} 
                        emptyMessage="No billing records found for this period"
                    />
                </div>
            </Card>
            
            {/* My Requests Section */}
            <Card className="p-8 shadow-sm border-none bg-white">
                 <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <ClipboardList className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Support Requests</h3>
                    </div>
                    <div className="flex space-x-2 bg-slate-50 p-1 rounded-lg border">
                        <Button variant="secondary" size="sm" className="h-7 text-[10px] font-bold bg-white shadow-sm px-4">ALL TIME</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold px-4">MONTHLY</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold px-4">WEEKLY</Button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-12">
                     <div className="h-[260px] w-full md:w-1/2 relative bg-slate-50 rounded-2xl border-2 border-slate-100 p-4">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={requestStatusData.length > 0 ? requestStatusData : [{name: 'None', value: 1}]}
                                    innerRadius={75}
                                    outerRadius={95}
                                    dataKey="value"
                                    stroke="none"
                                    animationBegin={0}
                                    animationDuration={1500}
                                >
                                    {(requestStatusData.length > 0 ? requestStatusData : [{name: 'None', value: 1, color: '#F1F5F9'}]).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} wrapperStyle={{fontSize: '12px', fontWeight: 700, paddingTop: '20px'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
                             <span className="text-4xl font-black text-slate-800 leading-none">{metrics.requests}</span>
                             <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">Active Tickets</span>
                         </div>
                    </div>
                    
                    <div className="flex-1 w-full space-y-6">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-4">Status Breakdown</p>
                        <div className="space-y-4">
                            {requestStatusData.map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 active:scale-[0.98] transition-transform cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 rounded-full" style={{backgroundColor: s.color}}></div>
                                        <span className="text-sm font-bold text-slate-700">{s.name}</span>
                                    </div>
                                    <span className="text-lg font-black text-slate-800">{s.value}</span>
                                </div>
                            ))}
                            {requestStatusData.length === 0 && (
                                 <div className="text-center py-10 text-slate-300 italic text-sm">No historical data found</div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Change Service Details Table */}
            <Card className="p-8 shadow-sm border-none bg-white">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-orange-600 flex items-center justify-center">
                            <Settings2 className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Change Service Details</h3>
                    </div>
                     <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:bg-blue-50">VIEW ALL</Button>
                </div>
                 <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-slate-800">
                            <TableRow className="hover:bg-slate-800 border-none">
                                <TableHead className="text-white text-[10px] font-black uppercase tracking-widest h-12 text-center">Sr No</TableHead>
                                <TableHead className="text-white text-[10px] font-black uppercase tracking-widest h-12">Account No</TableHead>
                                <TableHead className="text-white text-[10px] font-black uppercase tracking-widest h-12">Status</TableHead>
                                <TableHead className="text-white text-[10px] font-black uppercase tracking-widest h-12">Action Date</TableHead>
                                <TableHead className="text-white text-[10px] font-black uppercase tracking-widest h-12">Bill Amount</TableHead>
                                <TableHead className="text-white text-[10px] font-black uppercase tracking-widest h-12 text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {changeServiceDetails && changeServiceDetails.length > 0 ? (
                                changeServiceDetails.map((item, idx) => (
                                    <TableRow key={idx} className="hover:bg-slate-50 transition-colors">
                                        <TableCell className="text-center font-bold text-slate-400">{idx + 1}</TableCell>
                                        <TableCell className="font-bold text-teal-900">{item.AccountNumber}</TableCell>
                                        <TableCell>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black">
                                                {item.Status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">{item.Date}</TableCell>
                                        <TableCell className="font-black text-slate-800">{item.BillAmount} <span className="text-[10px] text-gray-400">OMR</span></TableCell>
                                        <TableCell className="text-center">
                                            <Button size="sm" className="h-7 text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-none border border-slate-200">VIEW</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-slate-400 font-black tracking-[0.3em] bg-slate-50 border-none">
                                        NO ACTIVE RECORDS
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                 </div>
            </Card>

            {/* Last Meter Reading Chart */}
            <Card className="p-8 shadow-sm border-none bg-white">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Meter Reading Baseline</h3>
                </div>
                <div className="h-[250px] w-full flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 group">
                    <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 group-hover:scale-110 transition-transform">
                         <BarChart width={40} height={40} data={[{v:1}]}>
                            <Bar dataKey="v" fill="#94A3B8" opacity={0.2} radius={2} />
                        </BarChart>
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">
                        Telemetry data sync pending<br/>
                        <span className="text-[10px] font-medium lowercase tracking-normal">last checked: just now</span>
                    </p>
                </div>
            </Card>

        </div>
    )
})
