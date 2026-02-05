"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { notificationService } from "@/services/notification.service"
import { CustomNotification } from "@/types/notification.types"
import { toast } from "sonner"
import { format } from "date-fns"
import PageHeader from "@/components/layout/PageHeader"
import { useLanguage } from "@/components/providers/LanguageProvider"

interface EditNotificationProps {
  notification: CustomNotification
  onBack: () => void
}

export function EditNotification({ notification, onBack }: EditNotificationProps) {
  const [scheduledDate, setScheduledDate] = useState(
    format(new Date(notification.ScheduledDateTime), 'yyyy-MM-dd')
  )
  const [scheduledTime, setScheduledTime] = useState(
    format(new Date(notification.ScheduledDateTime), 'HH:mm')
  )
  const [isUpdating, setIsUpdating] = useState(false)
  const { language } = useLanguage()

  const handleUpdate = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error("Please select scheduled date and time")
      return
    }

    setIsUpdating(true)
    try {
      const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`
      
      await notificationService.updateNotification({
        NotificationId: notification.NotificationId,
        ScheduledDateTime: scheduledDateTime,
        ModifiedBy: "current_user" // TODO: Get from auth context
      })
      
      toast.success("Notification updated successfully")
      onBack()
    } catch (error) {
      console.error('Error updating notification:', error)
      toast.error("Failed to update notification")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <div className="-mx-6 border-b mb-6">
        <PageHeader
          language={language}
          titleEn="Edit Custom Notification"
          titleAr="تعديل إشعار مخصص"
          breadcrumbEn="Edit Notification"
          breadcrumbAr="تعديل إشعار"
          showShadow={false}
        />
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="space-y-8">
        {/* Notification Details Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[#1F4E58] border-b pb-2">Notification Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Event Type (Disabled) */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Event Type</Label>
              <Input 
                value={notification.EventTypeEn} 
                disabled 
                className="h-11 bg-gray-50 border-gray-300 text-gray-600"
              />
            </div>

            {/* Template Name (Disabled) */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Template Name</Label>
              <Input 
                value={notification.NotificationTitleEn} 
                disabled 
                className="h-11 bg-gray-50 border-gray-300 text-gray-600"
              />
            </div>

            {/* Status (Disabled) */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Status</Label>
              <Input 
                value={notification.Status} 
                disabled 
                className="h-11 bg-gray-50 border-gray-300 text-gray-600"
              />
            </div>

            {/* User Type (Disabled) */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">User Type</Label>
              <Input 
                value={notification.UserType === 'REGISTERED' ? 'Registered Users' : 'All Users'} 
                disabled 
                className="h-11 bg-gray-50 border-gray-300 text-gray-600"
              />
            </div>
          </div>
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
            onClick={handleUpdate} 
            disabled={isUpdating}
            className="px-8 h-11 bg-[#1F4E58] hover:bg-[#163a42] text-white min-w-[120px]"
          >
            {isUpdating ? "Updating..." : "Update"}
          </Button>
        </div>
      </div>
    </div>
    </>
  )
}
