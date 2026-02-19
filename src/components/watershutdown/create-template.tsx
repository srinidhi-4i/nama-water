"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { waterShutdownService } from "@/services/watershutdown.service"
import { EventTypeItem } from "@/types/watershutdown.types"
import { toast } from "sonner"
import { MessageSquare, Mail, Calendar } from "lucide-react"

interface CreateTemplateProps {
  onBack: () => void
}

export function CreateTemplate({ onBack }: CreateTemplateProps) {
  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([])
  const [templateTypes, setTemplateTypes] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("sms")

  // State for Visual Editor Fields
  const [editorState, setEditorState] = useState({
    eventType: "",
    eventShutdownDate: "",
    notificationDetails: "",
    region: "",
    startTime: "",
    endTime: ""
  })
  
  // Form State
  const [formData, setFormData] = useState({
    eventType: "Select All",
    templateName: "Select All",
    smsArabic: "",
    smsEnglish: "",
    emailArabic: "",
    emailEnglish: "",
    emailSubject: "WATER OPERATION SHUTDOWN NOTIFICATION"
  })

  useEffect(() => {
    loadMasterData()
  }, [])

  const loadMasterData = async () => {
    try {
      const data = await waterShutdownService.getWaterShutdownMasterData()
      setEventTypes(data.eventTypes || [])
      setTemplateTypes(data.templateTypes || [])
    } catch (error) {
      console.error('Error loading master data:', error)
    }
  }

  const handleDragStart = (e: React.DragEvent, value: string) => {
    e.dataTransfer.setData("text/plain", value)
  }

  const handleDrop = (e: React.DragEvent, field: keyof typeof editorState) => {
    e.preventDefault()
    const value = e.dataTransfer.getData("text/plain")
    setEditorState(prev => ({ ...prev, [field]: value }))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const generateHtml = () => {
    return `
    <div style="width:700px;margin:auto;font-family:Arial,sans-serif;">
        <div style="background:#003366;color:#fff;padding:25px 15px;text-align:center;height:70px;">
            <h3 style="font-size:16px;margin:0;">WATER OPERATION SHUTDOWN NOTIFICATION</h3>
        </div> 
        <div class="content" style="padding:25px;border:1px solid #000;">
            <p style="font-size:16px;">Dear Recipients,</p>
            <p style="font-size:16px;">Please find the attached Notification for</p>
            <h3 style="margin-bottom:20px;">
                <input style="border:0px;width:180px;color:#ff0000;font-size:18px;font-weight:bold;" value="${editorState.eventType}" name="EventType" readonly /> 
                <span style="color:#ff0000;">-</span> 
                <input style="border:0px;color:#ff0000;font-size:18px;font-weight:bold;" value="${editorState.eventShutdownDate}" name="EventShutDownDate" readonly />
            </h3>
            <div style="border:1px solid #9f9e9e;">
                <div class="details">
                    <p style="background:#f9f9f9;padding:15px;border-bottom:1px solid #9f9e9e;margin:0;"><strong style="color:#01474d;">Notification Details</strong></p>
                    <div style="padding:15px;">
                       <p name="NotificationDetails" style="margin:0;min-height:20px;">${editorState.notificationDetails}</p>
                    </div>       
                    <div style="padding:0 15px 15px 15px;">
                        <strong style="color:#01474d;">Affected Regions:</strong>
                        <p name="Region" style="margin:5px 0 0 0;min-height:20px;">${editorState.region}</p> 
                    </div>
                </div> 
                <div class="datetime">
                    <p style="background:#f9f9f9;padding:15px;border-bottom:1px solid #9f9e9e;border-top:1px solid #9f9e9e;margin:0;"><strong style="color:#01474d;">Date and Time</strong></p>
                    <div style="padding:15px;">
                        <p style="margin:0 0 10px 0;">From : <input style="border:0px;width:250px;" value="${editorState.startTime}" name="EventStartDateTimeEn" readonly /></p> 
                        <p style="margin:0;">To :  <input style="border:0px;width:250px;" value="${editorState.endTime}" name="EventEndDateTimeEn" readonly /></p>
                    </div>
                </div>
            </div>
            <p style="margin-top:30px;line-height:22px;">For more details please refer the attached file</p>
        </div>
       
        <div style="background:#333;color:#fff;padding:20px;padding-bottom:10px;">
            <p style="font-size:16px;color:#dfdfdf;margin:5px 0;">Thank you for using our services.</p>
            <p style="font-size:16px;color:#dfdfdf;margin:5px 0;">Best regards,</p>
            <p style="font-size:16px;color:#dfdfdf;margin:5px 0;">Operations Directorate</p>
            <p><a href="http://www.eservices.nws.nama.om" target="_blank" style="color:#fff;text-decoration:underline;">www.eservices.nws.nama.om</a></p>
        </div>
    </div>`
  }

  const handleSave = async () => {
    if (formData.eventType === "Select All") {
      toast.error("Please select a specific Event Type")
      return
    }

    setIsSaving(true)
    try {
      const finalHtml = generateHtml()
      await waterShutdownService.createTemplate({
        eventType: formData.eventType,
        templateType: formData.templateName as any,
        subject: activeTab === "sms" ? "SMS Template" : formData.emailSubject,
        body: activeTab === "sms" ? formData.smsEnglish : finalHtml,
        bodyAr: activeTab === "sms" ? formData.smsArabic : formData.emailArabic,
      })
      toast.success("Template created successfully")
      onBack()
    } catch (error: any) {
      console.error('Error creating template:', error)
      toast.error(error.message || "Failed to create template")
    } finally {
      setIsSaving(false)
    }
  }

  const PlaceholderButton = ({ label, target }: { label: string, target: any }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        // For SMS, we just append to the text area
        if (target === "smsArabic" || target === "smsEnglish") {
            setFormData(prev => ({
                ...prev,
                [target]: prev[target as keyof typeof prev] + ` [${label}] `
            }))
        }
      }}
      className="flex items-center gap-2 border-dashed border-[#006A72] text-[#006A72] hover:bg-teal-50 h-10 px-3 cursor-pointer"
    >
      <Calendar className="h-4 w-4" />
      {label}
    </Button>
  )
  
  const SidebarItem = ({ label, value }: { label: string, value: string }) => (
    <div 
      draggable
      onDragStart={(e) => handleDragStart(e, `[${value}]`)}
      className="flex items-center gap-2 border border-[#006A72] text-[#006A72] bg-white hover:bg-teal-50 h-10 px-3 cursor-grab active:cursor-grabbing rounded-md"
    >
      <Calendar className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Configuration Header */}
      <div className="p-6 border-b bg-gray-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Event Type</Label>
            <Select 
              value={formData.eventType} 
              onValueChange={(val) => setFormData({...formData, eventType: val})}
            >
              <SelectTrigger className="h-11 bg-white border-gray-300">
                <SelectValue placeholder="Select Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Select All">Select All</SelectItem>
                {eventTypes.map(type => (
                  <SelectItem key={type.EventTypeID} value={type.EventTypeID?.toString()}>
                    {type.EventTypeName || (type as any).EventTypeNameEn || (type as any).Event_Type_Name || "N/A"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Template Name</Label>
            <Select 
              value={formData.templateName} 
              onValueChange={(val) => setFormData({...formData, templateName: val})}
            >
              <SelectTrigger className="h-11 bg-white border-gray-300">
                <SelectValue placeholder="Select Template Name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Select All">Select All</SelectItem>
                {templateTypes.map(type => (
                  <SelectItem key={type.TemplateTypeID} value={type.TemplateTypeID?.toString()}>
                    {type.TemplateTypeNameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 border-b">
          <TabsList className="h-14 bg-transparent gap-8">
            <TabsTrigger 
              value="sms" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#006A72] data-[state=active]:text-[#006A72] rounded-none px-4 h-14 bg-transparent shadow-none"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Sms
            </TabsTrigger>
            <TabsTrigger 
              value="email"
              className="data-[state=active]:border-b-2 data-[state=active]:border-[#006A72] data-[state=active]:text-[#006A72] rounded-none px-4 h-14 bg-transparent shadow-none"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6">
          <TabsContent value="sms" className="mt-0 space-y-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Placeholders */}
              <div className="w-full lg:w-48 flex flex-col gap-3">
                 <Label className="text-xs font-bold text-gray-400 uppercase mb-2">Click to Insert</Label>
                 <PlaceholderButton label="EventStartDateTime" target="smsArabic" />
              </div>

              {/* Main Editors */}
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[#006A72] font-semibold">Arabic text :</Label>
                  <Textarea 
                    value={formData.smsArabic}
                    onChange={(e) => setFormData({...formData, smsArabic: e.target.value})}
                    placeholder="...Write your arabic sms template here"
                    className="min-h-[150px] text-right dir-rtl border-gray-200"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#006A72] font-semibold">English text :</Label>
                  <Textarea 
                    value={formData.smsEnglish}
                    onChange={(e) => setFormData({...formData, smsEnglish: e.target.value})}
                    placeholder="Write your english sms template here..."
                    className="min-h-[150px] border-gray-200"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="email" className="mt-0 space-y-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Placeholders */}
              <div className="w-full lg:w-56 flex flex-col gap-3">
                 <Label className="text-xs font-bold text-gray-400 uppercase">Drag to Insert</Label>
                 <SidebarItem label="Event Type" value="EventType" />
                 <SidebarItem label="Shut Down Date" value="EventShutDownDate" />
                 <SidebarItem label="Notification Details" value="NotificationDetails" />
                 <SidebarItem label="Start Date Time" value="EventStartDateTimeEn" />
                 <SidebarItem label="End Date Time" value="EventEndDateTimeEn" />
                 <SidebarItem label="Region" value="Region" />
              </div>

              {/* Visual Email Editor */}
              <div className="flex-1 border rounded-md overflow-hidden bg-gray-50 flex flex-col min-h-[600px] shadow-sm">
                
                {/* Visual Editor Content matching Reference */}
                <div className="w-full max-w-[700px] mx-auto bg-white my-8 shadow-md border border-gray-200">
                    {/* Header */}
                    <div className="bg-[#003366] text-white p-6 text-center h-[70px] flex items-center justify-center">
                        <h3 className="text-base font-bold m-0 uppercase">WATER OPERATION SHUTDOWN NOTIFICATION</h3>
                    </div>

                    {/* Body */}
                    <div className="p-6 border border-black border-t-0 text-black">
                        <p className="text-base mb-1">Dear Recipients,</p>
                        <p className="text-base mb-6">Please find the attached Notification for</p>
                        
                        <div className="flex items-center gap-2 mb-5">
                             <input 
                                value={editorState.eventType}
                                onChange={(e) => setEditorState({...editorState, eventType: e.target.value})}
                                onDrop={(e) => handleDrop(e, 'eventType')}
                                onDragOver={handleDragOver}
                                className="border-0 w-[180px] text-[#ff0000] text-lg font-bold outline-none placeholder:text-red-200"
                                placeholder="[EventType]"
                             />
                             <span className="text-[#ff0000] font-bold">-</span>
                             <input 
                                value={editorState.eventShutdownDate}
                                onChange={(e) => setEditorState({...editorState, eventShutdownDate: e.target.value})}
                                onDrop={(e) => handleDrop(e, 'eventShutdownDate')}
                                onDragOver={handleDragOver}
                                className="border-0 w-[200px] text-[#ff0000] text-lg font-bold outline-none placeholder:text-red-200"
                                placeholder="[EventShutDownDate]"
                             />
                        </div>

                        {/* Details Sections */}
                        <div className="border border-[#9f9e9e]">
                            {/* Notification Details */}
                            <div className="bg-[#f9f9f9] p-4 border-b border-[#9f9e9e]">
                                <strong className="text-[#01474d]">Notification Details</strong>
                            </div>
                            <div className="p-4">
                                <textarea
                                    value={editorState.notificationDetails}
                                    onChange={(e) => setEditorState({...editorState, notificationDetails: e.target.value})}
                                    onDrop={(e) => handleDrop(e, 'notificationDetails')}
                                    onDragOver={handleDragOver}
                                    className="w-full border-0 outline-none resize-none min-h-[20px] bg-transparent"
                                    placeholder="[NotificationDetails]"
                                />
                            </div>

                             {/* Region */}
                             <div className="px-4 pb-4">
                                <strong className="text-[#01474d] block mb-1">Affected Regions:</strong>
                                <textarea
                                    value={editorState.region}
                                    onChange={(e) => setEditorState({...editorState, region: e.target.value})}
                                    onDrop={(e) => handleDrop(e, 'region')}
                                    onDragOver={handleDragOver}
                                    className="w-full border-0 outline-none resize-none min-h-[20px] bg-transparent"
                                    placeholder="[Region]"
                                />
                            </div>

                            {/* Date and Time */}
                            <div className="bg-[#f9f9f9] p-4 border-y border-[#9f9e9e]">
                                <strong className="text-[#01474d]">Date and Time</strong>
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="flex items-center">
                                    <span className="w-16">From :</span>
                                    <input 
                                        value={editorState.startTime}
                                        onChange={(e) => setEditorState({...editorState, startTime: e.target.value})}
                                        onDrop={(e) => handleDrop(e, 'startTime')}
                                        onDragOver={handleDragOver}
                                        className="border-0 flex-1 outline-none"
                                        placeholder="[EventStartDateTimeEn]"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <span className="w-16">To :</span>
                                    <input 
                                        value={editorState.endTime}
                                        onChange={(e) => setEditorState({...editorState, endTime: e.target.value})}
                                        onDrop={(e) => handleDrop(e, 'endTime')}
                                        onDragOver={handleDragOver}
                                        className="border-0 flex-1 outline-none"
                                        placeholder="[EventEndDateTimeEn]"
                                    />
                                </div>
                            </div>
                        </div>

                        <p className="mt-8 leading-relaxed">For more details please refer the attached file</p>
                    </div>

                    {/* Footer */}
                    <div className="bg-[#333] text-white p-5 pb-3">
                        <p className="text-base text-[#dfdfdf] mb-1">Thank you for using our services.</p>
                        <p className="text-base text-[#dfdfdf] mb-1">Best regards,</p>
                        <p className="text-base text-[#dfdfdf] mb-1">Operations Directorate</p>
                        <a href="http://www.eservices.nws.nama.om" target="_blank" className="text-white underline">www.eservices.nws.nama.om</a>
                    </div>
                </div>

              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer Actions */}
      <div className="p-6 bg-gray-50 border-t flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="px-8 h-10 border-[#006A72] text-[#006A72] hover:bg-teal-50"
        >
          Back
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="px-10 h-10 bg-[#004A50] hover:bg-[#003A40] text-white"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}
