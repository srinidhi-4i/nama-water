"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { notificationService } from "@/services/notification.service"
import { EventType, NotificationTemplate } from "@/types/notification.types"
import { toast } from "sonner"

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
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedEventType) {
      const filtered = templates.filter(t => t.EventCode === selectedEventType)
      setFilteredTemplates(filtered)
      setSelectedTemplate("")
    } else {
      setFilteredTemplates([])
    }
  }, [selectedEventType, templates])

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
      const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`
      
      await notificationService.createNotification({
        EventTypeCode: selectedEventType,
        NotificationCategory: selectedTemplate,
        UserType: userType,
        ScheduledDateTime: scheduledDateTime,
        CreatedBy: "current_user" // TODO: Get from auth context
      })
      
      toast.success("Notification created successfully")
      onBack()
    } catch (error) {
      console.error('Error creating notification:', error)
      toast.error("Failed to create notification")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notification Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Event Type */}
              <div>
                <Label htmlFor="eventType">Event Types *</Label>
                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                  <SelectTrigger id="eventType">
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
              <div>
                <Label htmlFor="templateName">Template Name *</Label>
                <Select 
                  value={selectedTemplate} 
                  onValueChange={setSelectedTemplate}
                  disabled={!selectedEventType}
                >
                  <SelectTrigger id="templateName">
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
            <div>
              <Label>User Type *</Label>
              <RadioGroup value={userType} onValueChange={(value) => setUserType(value as "REGISTERED" | "ALL")}>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="REGISTERED" id="registered" />
                    <Label htmlFor="registered" className="font-normal cursor-pointer">
                      Registered Users
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ALL" id="all" />
                    <Label htmlFor="all" className="font-normal cursor-pointer">
                      All Users
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Event Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scheduled Date */}
              <div>
                <Label htmlFor="scheduledDate">Scheduled Date and time *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>

              {/* Scheduled Time */}
              <div>
                <Label htmlFor="scheduledTime">&nbsp;</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              Previous
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
