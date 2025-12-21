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
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [messageEn, setMessageEn] = useState("")
  const [messageAr, setMessageAr] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const { userDetails } = useAuth()

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

  const loadData = async () => {
    try {
      const response = await notificationService.getTemplates()
      setEventTypes(response.EventType || [])
      setTemplates(response.Notifications || [])
    } catch (error) {
      console.error('Error loading data:', error)
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
      // Use space instead of T for better backend compatibility with FormData
      const scheduledDateTime = `${scheduledDate} ${scheduledTime}:00`
      
      const payload = {
        NotificationID: 0,
        EventTypeCode: selectedEventType,
        NotificationCategory: selectedTemplate,
        UserType: userType as 'REGISTERED' | 'ALL',
        ScheduledDateTime: scheduledDateTime,
        CreatedBy: userDetails?.EmpID?.toString() || "current_user"
      }

      console.log('Creating notification with payload:', payload)
      
      const response = await notificationService.createNotification(payload)
      console.log('Create response:', response)
      
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
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="space-y-8">
        {/* Notification Details Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[#1F4E58] border-b pb-2">Notification Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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
            <div className="space-y-2">
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
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">
              User Type <span className="text-red-500">*</span>
            </Label>
            <RadioGroup value={userType} onValueChange={(value) => setUserType(value as "REGISTERED" | "ALL")}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Notification Message (English):
                </Label>
                <Textarea 
                  value={messageEn}
                  readOnly
                  className="min-h-[120px] bg-gray-50 border-gray-200 text-gray-600 resize-none focus-visible:ring-0 leading-relaxed"
                  placeholder="Message will appear here"
                />
              </div>
              <div className="space-y-2">
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
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[#1F4E58] border-b pb-2">Event Details</h2>
          
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
        <div className="flex justify-end gap-4 pt-6 mt-8 border-t">
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
  )
}
