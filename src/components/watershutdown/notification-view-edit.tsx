"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { waterShutdownService } from "@/services/watershutdown.service"
import { toast } from "sonner"
import { ArrowLeft, Save, User, MapPin, Calendar, Clock, Phone, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface NotificationViewEditProps {
  notificationId: string
  mode: "view" | "edit"
  onBack: () => void
  language: "EN" | "AR"
}

export function NotificationViewEdit({ notificationId, mode, onBack, language }: NotificationViewEditProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [masterData, setMasterData] = useState<any>(null)
  
  const isReadOnly = mode === "view"

  useEffect(() => {
    loadData()
  }, [notificationId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [details, master] = await Promise.all([
        waterShutdownService.getNotificationById(notificationId),
        waterShutdownService.getWaterShutdownMasterData()
      ])
      setData(details.Table[0])
      setMasterData(master)
    } catch (error) {
      console.error('Error loading notification data:', error)
      toast.error("Failed to load notification details")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-[#006A72]">Loading notification details...</div>
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load data.</div>

  const focalPoints = data.FocalPointDetails ? JSON.parse(data.FocalPointDetails) : []
  const contractors = data.ContractorName ? JSON.parse(data.ContractorName) : []

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-[#006A72] flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to List
        </Button>
        <h2 className="text-xl font-bold text-[#006A72]">
          {mode === "view" ? "View" : "Edit"} Water Shutdown Notification
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-gray-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#006A72]" />
                Event Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Notification Title</Label>
                  <Input value={data.NotificationTitle} readOnly={isReadOnly} />
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={data.EventTypeID?.toString()} disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {masterData?.eventTypes.map((t: any) => (
                        <SelectItem key={t.EventTypeID} value={t.EventTypeID.toString()}>
                          {t.EventTypeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                   <Input value={data.RegionCode} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Location details</Label>
                  <Input value={data.LocationDetails} readOnly={isReadOnly} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-gray-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#006A72]" />
                Schedule & Timing
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date & Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={data.StartDateAndTime?.split('.')[0]} 
                    readOnly={isReadOnly} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date & Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={data.EndDateAndTime?.split('.')[0]} 
                    readOnly={isReadOnly} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Schedule Notification Date</Label>
                  <Input 
                    type="datetime-local" 
                    value={data.ScheduleNotificationDate?.split('.')[0]} 
                    readOnly={isReadOnly} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Remainder Notification Date</Label>
                  <Input 
                    type="datetime-local" 
                    value={data.RemainderNotificationDat?.split('.')[0]} 
                    readOnly={isReadOnly} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-gray-50/50">
              <CardTitle className="text-lg">Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Reason for Shutdown</Label>
                <Textarea value={data.ReasonForShutDown} readOnly={isReadOnly} />
              </div>
              <div className="space-y-2">
                <Label>Notification Details</Label>
                <Textarea value={data.NotificationDetails} readOnly={isReadOnly} className="min-h-[100px]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stakeholders */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-gray-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-[#006A72]" />
                Focal Points
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
               {focalPoints.map((fp: any, i: number) => (
                 <div key={i} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                    <div className="font-semibold flex items-center gap-2">
                      <User className="h-3 w-3" /> {fp.Name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <Mail className="h-3 w-3" /> {fp.Email}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <Phone className="h-3 w-3" /> {fp["Contact Number"]}
                    </div>
                 </div>
               ))}
               {focalPoints.length === 0 && <p className="text-gray-400 text-sm">No focal points added.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-gray-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#006A72]" />
                Contractors
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
               {contractors.map((c: any, i: number) => (
                 <div key={i} className="p-2 border rounded bg-slate-50 text-sm">
                   {c.contractorName}
                 </div>
               ))}
               {contractors.length === 0 && <p className="text-gray-400 text-sm">No contractors assigned.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {!isReadOnly && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t shadow-lg flex justify-center gap-4 z-50">
           <Button variant="outline" onClick={onBack} className="w-32 border-[#006A72] text-[#006A72]">
             Cancel
           </Button>
           <Button className="w-48 bg-[#004A50] hover:bg-[#003A40]">
             <Save className="h-4 w-4 mr-2" /> Save Changes
           </Button>
        </div>
      )}
    </div>
  )
}
