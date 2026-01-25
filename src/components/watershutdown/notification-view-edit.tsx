"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { waterShutdownService } from "@/services/watershutdown.service"
import { toast } from "sonner"
import { WaterShutdownNotification } from "@/types/watershutdown.types"
import { OmanMap } from "./OmanMap"
import { format } from "date-fns"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft } from "lucide-react"

interface NotificationViewProps {
  notificationId: string
  onBack: () => void
  language: "EN" | "AR"
}

export function NotificationView({ notificationId, onBack, language }: NotificationViewProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<WaterShutdownNotification | null>(null)

  useEffect(() => {
    loadData()
  }, [notificationId])

  const loadData = async () => {
    setLoading(true)
    try {
      const details = await waterShutdownService.getNotificationById(notificationId)
      setData(details)
    } catch (error) {
      console.error('Error loading notification data:', error)
      toast.error("Failed to load notification details")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-[#123756] animate-pulse">Loading notification details...</div>
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load data.</div>

  const formatDatePart = (dateStr: string | undefined, type: 'day' | 'text' | 'time') => {
    if (!dateStr) return "--"
    try {
      const date = new Date(dateStr)
      if (type === 'day') return format(date, "d")
      if (type === 'text') return format(date, "EEEE") + "\n" + format(date, "MMMM - yyyy")
      if (type === 'time') return format(date, "hh:mm a")
    } catch (e) {
      return "--"
    }
    return "--"
  }

  return (
    <div className="bg-white min-h-screen px-2 sm:px-4">
      <div className="max-w-[900px] mx-auto shadow-xl border rounded-lg overflow-hidden font-sans bg-white">
        {/* Header */}
        <div className="bg-[#123756] text-white p-4 flex items-center justify-between relative">
          <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/10 px-2 h-9" 
              onClick={onBack}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <span className="font-bold text-xs sm:text-sm tracking-tight text-center flex-1 mx-2 uppercase">
            Water Operation Shutdown Notification
          </span>
          <span className="font-bold text-[10px] sm:text-xs bg-white/20 px-2 py-1 rounded border border-white/30 truncate max-w-[100px] sm:max-w-none">
            {data.eventId}
          </span>
        </div>
        
        {/* Type Banner */}
        <div className="text-center py-3 text-[#42777c] text-base sm:text-lg font-black uppercase bg-slate-50/80 border-b tracking-wide">
          {data.eventType}
        </div>

        {/* Date Time Section */}
        <div className="bg-[#f6fafd] p-4 flex flex-col sm:flex-row items-center justify-center gap-4 border-b">
          {/* From Box */}
          <div className="flex border-2 border-[#42777c] bg-white rounded-md overflow-hidden w-full sm:w-[46%] shadow-sm">
            <div className="bg-[#42777c] text-white px-2 py-2 font-black w-12 flex items-center justify-center text-[10px] uppercase [writing-mode:vertical-lr] sm:[writing-mode:vertical-lr] rotate-180">From</div>
            <div className="flex-1 flex items-center px-4 py-3 gap-3">
              <span className="text-3xl font-black text-[#d00] leading-none">{formatDatePart(data.startDateTime, 'day')}</span>
              <div className="flex flex-col flex-1">
                <span className="text-[10px] leading-tight text-gray-800 font-bold whitespace-pre-line">
                  {formatDatePart(data.startDateTime, 'text')}
                </span>
                <span className="text-sm font-black text-[#d00] mt-1">{formatDatePart(data.startDateTime, 'time')}</span>
              </div>
            </div>
          </div>
          
          <div className="hidden sm:block w-8 h-[2px] bg-[#42777c]/30" />
          <div className="sm:hidden w-[2px] h-4 bg-[#42777c]/30" />

          {/* To Box */}
          <div className="flex border-2 border-[#42777c] bg-white rounded-md overflow-hidden w-full sm:w-[46%] shadow-sm">
            <div className="bg-[#42777c] text-white px-2 py-2 font-black w-12 flex items-center justify-center text-[10px] uppercase [writing-mode:vertical-lr] rotate-180">To</div>
            <div className="flex-1 flex items-center px-4 py-3 gap-3">
              <span className="text-3xl font-black text-[#d00] leading-none">{formatDatePart(data.endDateTime, 'day')}</span>
              <div className="flex flex-col flex-1">
                <span className="text-[10px] leading-tight text-gray-800 font-bold whitespace-pre-line">
                  {formatDatePart(data.endDateTime, 'text')}
                </span>
                <span className="text-sm font-black text-[#d00] mt-1">{formatDatePart(data.endDateTime, 'time')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map and Willayat Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <Card className="rounded-lg border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="bg-slate-50 py-3 px-4 border-b">
              <CardTitle className="text-[#42777c] text-sm font-extrabold uppercase tracking-wider">Affected Willayat</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-y-auto min-h-[120px] max-h-[220px]">
              <div className="space-y-2">
                {data.affectedWillayats?.map((w: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-[#42777c] font-bold py-1 border-b border-slate-50 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#42777c]" />
                    {w}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-slate-200 shadow-sm flex items-center justify-center p-4 bg-slate-50/30">
             <OmanMap selectedPlaces={data.mapLocations} height={200} className="w-full h-auto max-w-[300px]" />
          </Card>
        </div>

        {/* DMAs Section */}
        <div className="px-4 pb-4">
          <Card className="rounded-lg border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 py-3 px-4 border-b">
              <CardTitle className="text-[#42777c] text-sm font-extrabold uppercase tracking-wider">Affected DMA&apos;S</CardTitle>
            </CardHeader>
            <CardContent className="p-4 overflow-y-auto max-h-[200px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6">
                {data.affectedDMAs?.map((d: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-[#42777c] font-bold py-1 border-b border-slate-50 sm:border-0 hover:bg-slate-50 transition-colors rounded px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#42777c]" />
                    {d}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notification Details & Reason */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4">
          <Card className="rounded-lg border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 py-2 px-4 border-b">
              <CardTitle className="text-[#42777c] text-[11px] font-black uppercase tracking-wider">Notification Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs text-[#42777c] font-bold leading-relaxed min-h-[70px]">
              {data.notificationDetails}
            </CardContent>
          </Card>
          <Card className="rounded-lg border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 py-2 px-4 border-b">
              <CardTitle className="text-[#42777c] text-[11px] font-black uppercase tracking-wider">Reason for Shutdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs text-[#42777c] font-bold leading-relaxed min-h-[70px]">
              {data.reasonForShutdown}
            </CardContent>
          </Card>
        </div>

        {/* Contractor & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4">
          <Card className="rounded-lg border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 py-2 px-4 border-b">
              <CardTitle className="text-[#42777c] text-[11px] font-black uppercase tracking-wider">Contractor Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4 min-h-[70px] space-y-2">
              {data.contractors?.map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-xs text-[#42777c] font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#42777c]" />
                  {c.contractorName}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-lg border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 py-2 px-4 border-b">
              <CardTitle className="text-[#42777c] text-[11px] font-black uppercase tracking-wider">Action Requested</CardTitle>
            </CardHeader>
            <CardContent className="p-4 min-h-[70px] flex flex-wrap gap-2">
              {data.actionsRequired?.map((a: string, i: number) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="border-dashed border-[#42777c] bg-[#e9fbfc] text-[#42777c] text-[10px] font-black px-3 py-1 rounded-full uppercase"
                >
                  {a}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Technical Info Table */}
        <div className="px-4 pb-6 overflow-x-auto">
          <Table className="border rounded-lg text-xs min-w-[500px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="text-[#42777c] font-black border-r uppercase tracking-tighter text-[10px]">Valve Lock</TableHead>
                <TableHead className="text-[#42777c] font-black border-r uppercase tracking-tighter text-[10px]">Size of Pipeline</TableHead>
                <TableHead className="text-[#42777c] font-black uppercase tracking-tighter text-[10px]">Type of Pipeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-transparent">
                <TableCell className="text-[#42777c] font-black border-r py-3">{data.valveLock || "--"}</TableCell>
                <TableCell className="text-[#42777c] font-black border-r py-3">{data.sizeOfPipeline || "--"}</TableCell>
                <TableCell className="text-[#42777c] font-black py-3">{data.typeOfPipeline || "--"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Focal Points Section */}
        <div className="px-4 pb-6">
          <h4 className="text-[11px] font-black mb-3 text-slate-500 uppercase tracking-widest px-1">Focal Points</h4>
          <div className="overflow-x-auto rounded-lg border">
            <Table className="text-[11px] min-w-[600px]">
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="text-[#42777c] font-extrabold border-r uppercase h-9">Name</TableHead>
                  <TableHead className="text-[#42777c] font-extrabold border-r uppercase h-9">Email ID</TableHead>
                  <TableHead className="text-[#42777c] font-extrabold uppercase h-9">Contact Number</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.focalPoint && data.focalPoint.length > 0 ? (
                  data.focalPoint.map((f: any, i: number) => (
                    <TableRow key={i} className="hover:bg-slate-50/30 border-b last:border-0">
                        <TableCell className="border-r py-2.5 font-bold text-gray-700">{f.Name}</TableCell>
                        <TableCell className="border-r py-2.5 font-bold text-gray-700">{f.Email}</TableCell>
                        <TableCell className="py-2.5 font-bold text-gray-700">{f["Contact Number"]}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                     <TableCell colSpan={3} className="text-center text-gray-400 py-6 italic">No focal points found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer Metadata */}
        <div className="bg-slate-50 p-6 border-t grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location Details</p>
              <p className="text-xs font-bold text-[#42777c] leading-relaxed">{data.locationDetails}</p>
           </div>
           <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initiated By</p>
              <p className="text-xs font-bold text-[#42777c] leading-relaxed italic">{data.initiatedBy}</p>
           </div>
        </div>
      </div>
    </div>
  )
}
