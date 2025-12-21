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

const DEFAULT_EMAIL_HTML = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #003A5D; color: white; padding: 20px; text-align: center; font-weight: bold; font-size: 18px;">
    WATER OPERATION SHUTDOWN NOTIFICATION
  </div>
  
  <div style="padding: 20px;">
    <p style="margin-bottom: 15px;">Dear Recipients,</p>
    <p style="margin-bottom: 20px;">Please find the attached Notification for <span style="color: red; font-weight: bold;">[EventType]</span> - <span style="color: red; font-weight: bold;">[EventShutDownDate]</span></p>
    
    <div style="margin-top: 20px; border: 1px solid #006A72; border-radius: 4px;">
      <div style="background-color: #f8f8f8; padding: 10px; border-bottom: 1px solid #006A72; color: #006A72; font-weight: bold;">
        Notification Details
      </div>
      <div style="padding: 15px; min-height: 80px; color: #333;">
        [NotificationDetails]
      </div>
    </div>
    
    <div style="margin-top: 20px; border: 1px solid #006A72; border-radius: 4px; margin-bottom: 20px;">
      <div style="background-color: #f8f8f8; padding: 10px; border-bottom: 1px solid #006A72; color: #006A72; font-weight: bold;">
        Date and Time
      </div>
      <div style="padding: 15px;">
        <p style="margin: 5px 0;"><strong>From :</strong> [EventStartDateTimeEn]</p>
        <p style="margin: 5px 0;"><strong>To :</strong> [EventEndDateTimeEn]</p>
      </div>
    </div>
    
    <p style="margin-top: 20px; font-size: 14px; color: #666;">For more details please refer the attached file</p>
  </div>
  
  <div style="background-color: #333; color: white; padding: 25px; font-size: 14px; line-height: 1.6;">
    <p style="margin: 0;">Thank you for using our services.</p>
    <p style="margin: 5px 0;">Best regards,<br>Operations Directorate</p>
    <p style="margin: 10px 0 0 0;"><a href="http://www.eservices.nws.nama.om" style="color: #006A72; text-decoration: underline;">www.eservices.nws.nama.om</a></p>
  </div>
</div>
`;


export function CreateTemplate({ onBack }: CreateTemplateProps) {
  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([])
  const [templateTypes, setTemplateTypes] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("sms")
  
  // Form State
  const [formData, setFormData] = useState({
    eventType: "Select All",
    templateName: "Select All",
    smsArabic: "",
    smsEnglish: "",
    emailArabic: "",
    emailEnglish: DEFAULT_EMAIL_HTML,
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

  const handleInsertPlaceholder = (placeholder: string, field: "smsArabic" | "smsEnglish" | "emailArabic" | "emailEnglish") => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] + ` [${placeholder}] `
    }))
  }

  const handleSave = async () => {
    if (formData.eventType === "Select All") {
      toast.error("Please select a specific Event Type")
      return
    }

    setIsSaving(true)
    try {
      await waterShutdownService.createTemplate({
        eventType: formData.eventType,
        templateType: formData.templateName as any,
        subject: activeTab === "sms" ? "SMS Template" : formData.emailSubject,
        body: activeTab === "sms" ? formData.smsEnglish : formData.emailEnglish,
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
      onClick={() => handleInsertPlaceholder(label, target)}
      className="flex items-center gap-2 border-dashed border-[#006A72] text-[#006A72] hover:bg-teal-50 h-10 px-3"
    >
      <Calendar className="h-4 w-4" />
      {label}
    </Button>
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
                 <PlaceholderButton label="EventStartDateTime" target="smsArabic" />
              </div>

              {/* Main Editors */}
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[#006A72] font-semibold">Write your arabic text here :</Label>
                  <Textarea 
                    value={formData.smsArabic}
                    onChange={(e) => setFormData({...formData, smsArabic: e.target.value})}
                    placeholder="...Write your arabic sms template here"
                    className="min-h-[150px] text-right dir-rtl border-gray-200"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#006A72] font-semibold">Write your english text here :</Label>
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
              <div className="w-full lg:w-56 flex flex-col gap-2">
                 <Label className="text-xs font-bold text-gray-400 uppercase">Placeholders</Label>
                 <PlaceholderButton label="EventType" target="emailEnglish" />
                 <PlaceholderButton label="EventShutDownDate" target="emailEnglish" />
                 <PlaceholderButton label="NotificationDetails" target="emailEnglish" />
                 <PlaceholderButton label="EventStartDateTimeEn" target="emailEnglish" />
                 <PlaceholderButton label="EventEndDateTimeEn" target="emailEnglish" />
                 <PlaceholderButton label="Region" target="emailEnglish" />
              </div>

              {/* Email Content Frame */}
              <div className="flex-1 border rounded-md overflow-hidden bg-gray-50 flex flex-col">
                <div className="bg-[#003A5D] text-white p-4 text-center font-bold text-lg">
                  {formData.emailSubject}
                </div>
                <div className="flex-1 bg-white overflow-auto min-h-[600px] border-t">
                    <div 
                      className="p-4 email-preview-container"
                      dangerouslySetInnerHTML={{ __html: formData.emailEnglish }} 
                    />
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
