"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { waterShutdownService } from "@/services/watershutdown.service"
import { WaterShutdownTemplate, EventTypeItem } from "@/types/watershutdown.types"
import { toast } from "sonner"
import { MessageSquare, Mail, Calendar } from "lucide-react"

interface TemplateViewEditProps {
  template: WaterShutdownTemplate
  mode: "view" | "edit"
  onBack: () => void
  language: "EN" | "AR"
}

export function TemplateViewEdit({ template, mode, onBack, language }: TemplateViewEditProps) {
  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([])
  const [templateTypes, setTemplateTypes] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("sms")
  
  const isReadOnly = mode === "view"

  // Helper to decode base64
  const decodeBase64 = (str: string) => {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch (e) {
      return str || "";
    }
  }

  // Form State
  const [formData, setFormData] = useState({
    eventType: template.EventTypeID?.toString() || (template as any).eventType?.toString() || "",
    templateName: template.TemplateTypeID?.toString() || (template as any).templateType?.toString() || "",
    smsArabic: (template as any).SMSTemplateAr || template.bodyAr || "",
    smsEnglish: (template as any).SMSTemplateEn || template.body || "",
    emailArabic: (template as any).EmailTemplateAr || "",
    emailEnglish: template.emailBody || decodeBase64((template as any).EmailTemplateEn) || "",
    emailSubject: (template as any).Subject || template.subject || "WATER OPERATION SHUTDOWN NOTIFICATION"
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
    if (isReadOnly) return
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] + ` [${placeholder}] `
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await waterShutdownService.updateTemplate(template.id, {
        eventType: formData.eventType,
        templateType: formData.templateName as any,
        body: formData.smsEnglish,
        bodyAr: formData.smsArabic,
        emailBody: formData.emailEnglish,
      })
      toast.success("Template updated successfully")
      onBack()
    } catch (error: any) {
      console.error('Error updating template:', error)
      toast.error(error.message || "Failed to update template")
    } finally {
      setIsSaving(false)
    }
  }

  const PlaceholderButton = ({ label, target }: { label: string, target: any }) => (
    <Button
      variant="outline"
      size="sm"
      disabled={isReadOnly}
      onClick={() => handleInsertPlaceholder(label, target)}
      className="flex items-center gap-2 border-dashed border-[#006A72] text-[#006A72] hover:bg-teal-50 h-10 px-3 cursor-pointer disabled:cursor-default"
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
              disabled={isReadOnly}
            >
              <SelectTrigger className="h-11 bg-white border-gray-300">
                <SelectValue placeholder="Select Event Type" />
              </SelectTrigger>
              <SelectContent>
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
              disabled={isReadOnly}
            >
              <SelectTrigger className="h-11 bg-white border-gray-300">
                <SelectValue placeholder="Select Template Name" />
              </SelectTrigger>
              <SelectContent>
                {templateTypes.length > 0 ? (
                  templateTypes.map(type => (
                    <SelectItem key={type.TemplateTypeID} value={type.TemplateTypeID?.toString()}>
                      {type.TemplateTypeNameEn}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value={formData.templateName}>{formData.templateName}</SelectItem>
                )}
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
                  <Label className="text-[#006A72] font-semibold">Arabic text :</Label>
                  <Textarea 
                    value={formData.smsArabic}
                    onChange={(e) => setFormData({...formData, smsArabic: e.target.value})}
                    readOnly={isReadOnly}
                    className="min-h-[150px] text-right dir-rtl border-gray-200"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#006A72] font-semibold">English text :</Label>
                  <Textarea 
                    value={formData.smsEnglish}
                    onChange={(e) => setFormData({...formData, smsEnglish: e.target.value})}
                    readOnly={isReadOnly}
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
          {isReadOnly ? "Close" : "Cancel"}
        </Button>
        {!isReadOnly && (
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-10 h-10 bg-[#004A50] hover:bg-[#003A40] text-white"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>
    </div>
  )
}
