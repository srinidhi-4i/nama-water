"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  BarChart3,
  TrendingUp,
  MapPin,
  Filter
} from "lucide-react"

import AppointmentSupervisorList from "./AppointmentSupervisorList"

export default function AppointmentSupervisorActions() {
  const { language } = useLanguage()
  const [view, setView] = useState<'DASHBOARD' | 'LIST'>('DASHBOARD')
  const [stats, setStats] = useState({
    total: 0,
    attended: 0,
    noShow: 0,
    pending: 0
  })

  useEffect(() => {
    // Mocking stats for flow completion
    setStats({
        total: 128,
        attended: 94,
        noShow: 12,
        pending: 22
    })
  }, [])

  if (view === 'LIST') {
    return (
      <div className="relative">
        <div className="absolute top-4 right-8 z-50">
           <Button 
             variant="outline" 
             onClick={() => setView('DASHBOARD')}
             className="bg-white hover:bg-slate-50 border-none shadow-sm shadow-teal-900/5 text-xs font-bold"
           >
             <TrendingUp className="h-4 w-4 mr-2 text-teal-600" />
             {language === "EN" ? "View Dashboard" : "عرض لوحة التحكم"}
           </Button>
        </div>
        <AppointmentSupervisorList />
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#F8FAFC] overflow-x-hidden pb-8 min-h-screen">
      <PageHeader
        language={language}
        titleEn="Supervisor Dashboard"
        titleAr="لوحة تحكم المشرف"
        breadcrumbEn="Supervisor Actions"
        breadcrumbAr="إجراءات المشرف"
      />

      <div className="max-w-[1400px] mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-between items-center">
           <h2 className="text-2xl font-black text-slate-800 tracking-tight">
             {language === "EN" ? "Overview" : "نظرة عامة"}
           </h2>
           <Button 
             onClick={() => setView('LIST')}
             className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-900/20 border-none px-6 rounded-xl font-bold"
           >
             <Filter className="h-4 w-4 mr-2" />
             {language === "EN" ? "Manage Appointments" : "إدارة المواعيد"}
           </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard 
             label={language === "EN" ? "Total Appointments" : "إجمالي المواعيد"}
             value={stats.total}
             icon={<Users className="h-6 w-6 text-teal-600" />}
             trend="+12%"
             className="bg-white border-none shadow-xl shadow-teal-900/5"
           />
           <StatCard 
             label={language === "EN" ? "Attended" : "تم الحضور"}
             value={stats.attended}
             icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
             trend="+8%"
             className="bg-white border-none shadow-xl shadow-teal-900/5"
           />
           <StatCard 
             label={language === "EN" ? "No Show" : "لم يحضر"}
             value={stats.noShow}
             icon={<AlertCircle className="h-6 w-6 text-red-600" />}
             trend="-2%"
             className="bg-white border-none shadow-xl shadow-teal-900/5"
           />
           <StatCard 
             label={language === "EN" ? "Pending" : "قيد الانتظار"}
             value={stats.pending}
             icon={<Clock className="h-6 w-6 text-amber-600" />}
             trend="+5%"
             className="bg-white border-none shadow-xl shadow-teal-900/5"
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Branch Performance */}
           <Card className="lg:col-span-2 border-none shadow-xl shadow-teal-900/5 bg-white overflow-hidden rounded-[2rem]">
              <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                 <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                       <BarChart3 className="h-5 w-5 text-teal-600" />
                       {language === "EN" ? "Branch Wise Performance" : "الأداء حسب الفرع"}
                    </CardTitle>
                    <p className="text-sm text-slate-400">Monthly overview of appointment traffic</p>
                 </div>
                 <Button variant="ghost" className="text-teal-600 font-bold hover:bg-teal-50">View Detailed Report</Button>
              </CardHeader>
              <CardContent className="p-8">
                 <div className="space-y-6">
                    {[
                        { name: "Muscat Central Branch", count: 450, color: "bg-teal-600" },
                        { name: "Salalah Main Office", count: 380, color: "bg-teal-500" },
                        { name: "Sohar Branch", count: 310, color: "bg-teal-400" },
                        { name: "Nizwa Regional Branch", count: 240, color: "bg-teal-300" }
                    ].map((branch, i) => (
                        <div key={i} className="space-y-2">
                           <div className="flex justify-between items-center text-sm font-bold">
                              <span className="text-slate-600">{branch.name}</span>
                              <span className="text-slate-900">{branch.count} Appointments</span>
                           </div>
                           <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                              <div className={`h-full ${branch.color} rounded-full transition-all duration-1000`} style={{ width: `${(branch.count / 500) * 100}%` }} />
                           </div>
                        </div>
                    ))}
                 </div>
              </CardContent>
           </Card>

           {/* Quick Settings */}
           <div className="space-y-6">
              <Card className="border-none shadow-xl shadow-teal-900/5 bg-[#1F4E58] text-white rounded-[2rem] overflow-hidden">
                 <CardContent className="p-10 space-y-6">
                    <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center">
                       <TrendingUp className="h-7 w-7 text-teal-300" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-2xl font-black">{language === "EN" ? "System Status" : "حالة النظام"}</h3>
                       <p className="text-teal-50/60 font-medium leading-relaxed">The appointment booking engine is performing optimally with 99.9% uptime today.</p>
                    </div>
                    <div className="pt-4 flex flex-col gap-3">
                       <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-sm font-bold opacity-80">API Gateway: Online</span>
                       </div>
                       <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-sm font-bold opacity-80">Slot Processor: Online</span>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-none shadow-xl shadow-teal-900/5 bg-white rounded-[2rem] overflow-hidden border-teal-100 border">
                 <CardContent className="p-8 space-y-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{language === "EN" ? "Top Category" : "الفئة الأعلى"}</h3>
                    <div className="flex items-center gap-6">
                       <div className="h-20 w-20 bg-teal-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                          <span className="text-2xl font-black text-teal-700">65%</span>
                       </div>
                       <div>
                          <p className="font-bold text-slate-800 text-lg">Billing & Meters</p>
                          <p className="text-xs text-slate-400">Most requested category this week</p>
                       </div>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, trend, className }: any) {
    return (
        <Card className={className}>
            <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                        {icon}
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                        {trend}
                    </span>
                </div>
                <div className="space-y-1">
                    <div className="text-3xl font-black text-slate-800 tabular-nums">{value}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
                </div>
            </CardContent>
        </Card>
    )
}
