"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { notificationService } from "@/services/notification.service"
import { EventType, NotificationTemplate } from "@/types/notification.types"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/AuthProvider"
import PageHeader from "@/components/layout/PageHeader"
import { useLanguage } from "@/components/providers/LanguageProvider"

interface CreateNotificationProps {
  onBack: () => void
}

export function CreateNotification({ onBack }: CreateNotificationProps) {
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<NotificationTemplate[]>([])
  
  const [selectedEventType, setSelectedEventType] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [userType, setUserType] = useState<"REGISTERED" | "ALL">("REGISTERED")
  const [scheduledDate, setScheduledDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const [scheduledTime, setScheduledTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [messageEn, setMessageEn] = useState("")
  const [messageAr, setMessageAr] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const { userDetails } = useAuth()
  const { language } = useLanguage()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedEventType) {
      const filtered = templates.filter(t => t.EventCode === selectedEventType)
      setFilteredTemplates(filtered)
      setSelectedTemplate("")
      setMessageEn("")
      setMessageAr("")
    } else {
      setFilteredTemplates([])
    }
  }, [selectedEventType, templates])

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value)
    const template = filteredTemplates.find(t => t.NotificationCategory === value)
    if (template) {
      setMessageEn(template.TemplateEn || "")
      setMessageAr(template.TemplateAr || "")
    } else {
      setMessageEn("")
      setMessageAr("")
    }
  }

  // Auto-fill date and time when user type is selected
  const handleUserTypeChange = (value: string) => {
    setUserType(value as "REGISTERED" | "ALL")
    
    // Auto-fetch current local date and time
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    
    setScheduledDate(`${year}-${month}-${day}`)
    setScheduledTime(`${hours}:${minutes}`)
  }

  const loadData = async () => {
    try {
      const response = await notificationService.getTemplates()
      setEventTypes(response.EventType || [])
      setTemplates(response.Notifications || [])
    } catch (error) {
      console.error('CreateNotification: Error loading data:', error)
    }
  }

  const handleCreate = async () => {
    if (!selectedEventType) {
      toast.error("Please select an event type")
      return
    }
    if (!selectedTemplate) {
      toast.error("Please select a template")
      return
    }
    if (!scheduledDate || !scheduledTime) {
      toast.error("Please select scheduled date and time")
      return
    }

    setIsCreating(true)
    try {
      const template = templates.find(t => t.NotificationCategory === selectedTemplate)
      if (!template) throw new Error("Template not found")

      // Match the payload structure from the successful UAT sample
      const payload = {
        NotificationEn: messageEn,
        NotificationAr: messageAr,
        NotificationCategory: selectedTemplate,
        UserID: userDetails?.EmpID?.toString() || userDetails?.userId?.toString() || "1",
        NotificationSubject: template.NotificationTitleEn,
        NotificationSubjectAr: template.NotificationTitleAr || "",
        NotificationScheduledDatetime: `${scheduledDate} ${scheduledTime}:00`, // Use space instead of T
        UserType: userType as 'REGISTERED' | 'ALL',
        IsDataMandatory: template.IsActive === true // Adjust based on template property
      }

      await notificationService.createNotification(payload)
      toast.success("Notification created successfully")
      onBack()
    } catch (error: any) {
      console.error('Error creating notification:', error)
      toast.error(error.message || "Failed to create notification")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
       <div className="flex-1 bg-slate-100 overflow-x-hidden">
        <PageHeader
          language={language}
          titleEn="Create Custom Notification"
          titleAr="إنشاء إشعار مخصص"
          breadcrumbItems={[
            { labelEn: "Home", labelAr: "الرئيسية", href: "/branchhome" },
            { labelEn: "Custom Notification", labelAr: "إشعار مخصص", href: "/notification-center/custom" },
            { labelEn: "Create Notification", labelAr: "إنشاء إشعار" }
          ]}
        
        />
      </div>
      <div className="my-4 ">
      <div className="bg-white rounded-lg  p-4 ">
      <div >
        {/* Notification Details Section */}
        <div>
          <h2 className="text-xl font-bold text-[#1F4E58]  pb-2">Notification Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            {/* Event Type */}
            <div className="space-y-2">
              <Label htmlFor="eventType" className="text-sm font-semibold text-gray-700">
                Event Types <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger id="eventType" className="h-11 bg-white border-gray-300 focus:ring-[#006A72]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.EventTypeCode} value={type.EventTypeCode}>
                      {type.EventTypeEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Name */}
            <div className="space-y-2 pt-2">
              <Label htmlFor="templateName" className="text-sm font-semibold text-gray-700">
                Template Name <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={selectedTemplate} 
                onValueChange={handleTemplateChange}
                disabled={!selectedEventType}
              >
                <SelectTrigger id="templateName" className="h-11 bg-white border-gray-300 focus:ring-[#006A72]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.map((template) => (
                    <SelectItem key={template.NotificationCategory} value={template.NotificationCategory}>
                      {template.NotificationTitleEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* User Type */}
          <div className="space-y-2 py-2">
            <Label className="text-sm font-semibold text-gray-700">
              User Type <span className="text-red-500">*</span>
            </Label>
            <RadioGroup value={userType} onValueChange={handleUserTypeChange}>
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="REGISTERED" id="registered" className="text-[#006A72] border-gray-300" />
                  <Label htmlFor="registered" className="font-medium text-gray-700 cursor-pointer">
                    Registered Users
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ALL" id="all" className="text-[#006A72] border-gray-300" />
                  <Label htmlFor="all" className="font-medium text-gray-700 cursor-pointer">
                    All Users
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Notification Messages - Only show when template is selected */}
          {selectedTemplate && (
            <div className="grid grid-cols-1 md:grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div >
                <Label className="text-sm font-semibold pb-2 text-gray-700">
                  Notification Message (English):
                </Label>
                <Textarea 
                  value={messageEn}
                  readOnly
                  className="min-h-[120px] bg-gray-50 border-gray-200 text-gray-600 resize-none focus-visible:ring-0 leading-relaxed"
                  placeholder="Message will appear here"
                />
              </div>
              <div className="space-y-2 pt-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Notification Message (Arabic):
                </Label>
                <Textarea 
                  value={messageAr}
                  readOnly
                  dir="rtl"
                  className="min-h-[120px] bg-gray-50 border-gray-200 text-gray-600 resize-none focus-visible:ring-0 leading-relaxed"
                  placeholder="ستظهر الرسالة هنا"
                />
              </div>
            </div>
          )}
        </div>

        {/* Event Details Section */}
        <div className="space-y-2 pt-2">
          <h2 className="text-xl font-bold text-[#1F4E58]">Event Details</h2>
          
          <div className="space-y-2">
            <Label htmlFor="scheduledDate" className="text-sm font-semibold text-gray-700">
              Scheduled Date and time <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="h-11 border-gray-300 focus:ring-[#006A72] flex-1"
              />
              <Input
                id="scheduledTime"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="h-11 border-gray-300 focus:ring-[#006A72] flex-1 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="px-8 h-11 border-[#1F4E58] text-[#1F4E58] hover:bg-teal-50"
          >
            Previous
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={isCreating}
            className="px-8 h-11 bg-[#1F4E58] hover:bg-[#163a42] text-white min-w-[120px]"
          >
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>
      </div>
    </div>
    </>
  )
}
