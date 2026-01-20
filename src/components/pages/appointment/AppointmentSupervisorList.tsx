"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { appointmentService } from "@/services/appointment.service"
import { 
  Search, 
  Filter, 
  UserPlus, 
  XCircle, 
  Calendar, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Clock,
  User,
  Hash
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export default function AppointmentSupervisorList() {
  const { language } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  
  // Filters
  const [governorates, setGovernorates] = useState<any[]>([])
  const [wilayats, setWilayats] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [statusList, setStatusList] = useState<any[]>([])
  
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>("")
  const [selectedWilayat, setSelectedWilayat] = useState<string>("")
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [searchDate, setSearchDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      const masterData = await appointmentService.getMasterData()
      setGovernorates(masterData.Governorates || [])
      setWilayats(masterData.Wilayats || [])
      setBranches(masterData.Table || [])
      
      const statusData = await appointmentService.getMasterData('Status')
      setStatusList(Array.isArray(statusData) ? statusData : [])
      
      // Default to first branch if possible to load data
      if (masterData.Table?.length > 0) {
        setSelectedBranch(masterData.Table[0].BranchID?.toString())
      }
    } catch (error) {
      toast.error("Failed to load search criteria")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedBranch) {
        fetchAppointments()
    }
  }, [selectedBranch, searchDate, selectedStatus])

  const fetchAppointments = async () => {
    setIsLoading(true)
    try {
      const params = {
        typeOfFilter: "BRANCH",
        param1: selectedBranch,
        param2: searchDate,
        param3: selectedStatus || ""
      }
      const data = await appointmentService.getBookingData(params)
      setAppointments(data)
    } catch (error) {
      toast.error("Failed to fetch appointments")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'attended': case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'pending': case 'booked': return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-100'
      case 'no show': return 'bg-amber-50 text-amber-700 border-amber-100'
      default: return 'bg-slate-50 text-slate-700 border-slate-100'
    }
  }

  return (
    <div className="flex-1 bg-[#F8FAFC] overflow-x-hidden min-h-screen pb-12">
      <PageHeader
        language={language}
        titleEn="Appointment Supervisor"
        titleAr="مشرف المواعيد"
        breadcrumbEn="Appointment List"
        breadcrumbAr="قائمة المواعيد"
      />

      <div className="max-w-[1600px] mx-auto p-4 space-y-4">
        {/* Filters Panel */}
        <Card className="border-none shadow-sm shadow-teal-900/5 bg-white">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === "EN" ? "Governorate" : "المحافظة"}</label>
                <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                   <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                   <SelectContent>
                      {governorates.map(g => (
                        <SelectItem key={g.GovernorateID || g.ID} value={String(g.GovernorateID || g.ID)}>
                          {language === "EN" ? g.GovernorateNameEN : g.GovernorateNameAR}
                        </SelectItem>
                      ))}
                   </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === "EN" ? "Wilayat" : "الولاية"}</label>
                <Select value={selectedWilayat} onValueChange={setSelectedWilayat}>
                   <SelectTrigger className="h-9 text-xs" disabled={!selectedGovernorate}><SelectValue placeholder="All" /></SelectTrigger>
                   <SelectContent>
                      {wilayats.filter(w => w.GovernorateID?.toString() === selectedGovernorate).map(w => (
                        <SelectItem key={w.WilayatID} value={String(w.WilayatID)}>
                          {language === "EN" ? w.WilayatNameEN : w.WilayatNameAR}
                        </SelectItem>
                      ))}
                   </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === "EN" ? "Branch" : "الفرع"}</label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                   <SelectTrigger className="h-9 text-xs" disabled={!selectedWilayat}><SelectValue placeholder="All" /></SelectTrigger>
                   <SelectContent>
                      {branches.filter(b => b.WilayatID?.toString() === selectedWilayat).map(b => (
                        <SelectItem key={b.BranchID} value={String(b.BranchID)}>
                          {language === "EN" ? b.BranchNameEN : b.BranchNameAR}
                        </SelectItem>
                      ))}
                   </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === "EN" ? "Date" : "التاريخ"}</label>
                <Input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} className="h-9 text-xs" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === "EN" ? "Status" : "الحالة"}</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                   <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      {statusList.map(s => (
                        <SelectItem key={s.StatusID || s.ID} value={String(s.Status || s.NameEN)}>
                          {language === "EN" ? (s.Status || s.NameEN) : (s.StatusAR || s.NameAR)}
                        </SelectItem>
                      ))}
                   </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Quick Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder={language === "EN" ? "Search by Number, GSM, Civil ID..." : "بحث برقم الموعد، الجوال..."} 
                className="pl-10 h-10 bg-white border-none shadow-sm shadow-teal-900/5 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           
           <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchAppointments} className="bg-white hover:bg-slate-50 border-none shadow-sm shadow-teal-900/5">
                 <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                 {language === "EN" ? "Refresh" : "تحديث"}
              </Button>
              <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-900/20 border-none">
                 <XCircle className="h-4 w-4 mr-2" />
                 {language === "EN" ? "Bulk Cancel" : "إلغاء جماعي"}
              </Button>
           </div>
        </div>

        {/* Appointments Table */}
        <Card className="border-none shadow-sm shadow-teal-900/5 bg-white overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "Appointment" : "الموعد"}</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "Customer" : "العميل"}</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "Time Slot" : "الفترة"}</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "Status" : "الحالة"}</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "Agent" : "الموظف"}</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">{language === "EN" ? "Actions" : "الإجراءات"}</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {isLoading ? (
                       <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                             <div className="flex flex-col items-center gap-2 text-slate-400">
                                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                                <span className="text-xs font-bold uppercase tracking-widest">Loading Records...</span>
                             </div>
                          </td>
                       </tr>
                    ) : appointments.length === 0 ? (
                       <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                             <div className="flex flex-col items-center gap-2 text-slate-300">
                                <Hash className="h-12 w-12 opacity-20" />
                                <span className="text-xs font-bold uppercase tracking-widest">No Appointments Found</span>
                             </div>
                          </td>
                       </tr>
                    ) : (
                       appointments
                         .filter(apt => 
                            !searchQuery || 
                            apt.AppointmentUniqueNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            apt.CustomerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            apt.GsmNumber?.includes(searchQuery) ||
                            apt.CivilId?.includes(searchQuery)
                         )
                         .map((apt, idx) => (
                           <tr key={apt.AppointmentID || idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                 <div className="flex flex-col">
                                    <span className="font-bold text-slate-700 text-sm">#{apt.AppointmentUniqueNumber}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">{apt.ServiceType || "Standard Visit"}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                      <User className="h-3 w-3 text-slate-400" />
                                      {apt.CustomerName}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium ml-4.5">{apt.CivilId} • {apt.GsmNumber}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col">
                                    <span className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                                      <Clock className="h-3 w-3 text-teal-600" />
                                      {apt.SlotStartTime} - {apt.SlotEndTime}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium ml-4.5">{format(new Date(apt.AppointmentDate), "PP")}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <Badge variant="outline" className={`font-bold text-[10px] px-2 py-0.5 uppercase tracking-wider ${getStatusColor(apt.Status)}`}>
                                    {apt.Status}
                                 </Badge>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-2">
                                    {apt.AssignedAgent ? (
                                      <>
                                        <div className="h-8 w-8 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-bold text-[10px]">
                                          {apt.AssignedAgent.charAt(0)}
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">{apt.AssignedAgent}</span>
                                      </>
                                    ) : (
                                      <span className="text-[10px] font-bold text-slate-300 uppercase italic">Unassigned</span>
                                    )}
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50">
                                       <UserPlus className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50">
                                       <XCircle className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 border-none">
                                       <MoreVertical className="h-4 w-4" />
                                    </Button>
                                 </div>
                              </td>
                           </tr>
                         ))
                    )}
                 </tbody>
              </table>
           </div>
           
           {/* Pagination */}
           <div className="p-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing {appointments.length} Records</span>
              <div className="flex items-center gap-1">
                 <Button variant="outline" size="icon" disabled className="h-8 w-8 rounded-lg bg-white shadow-sm border-none"><ChevronLeft className="h-4 w-4" /></Button>
                 <Button variant="outline" size="icon" disabled className="h-8 w-8 rounded-lg bg-white shadow-sm border-none"><ChevronRight className="h-4 w-4" /></Button>
              </div>
           </div>
        </Card>
      </div>
    </div>
  )
}
