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

  const handleUpdate = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error("Please select scheduled date and time")
      return
    }

    setIsUpdating(true)
    try {
      const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`
      
      await notificationService.updateNotification({
        NotificationID: notification.NotificationID,
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Details (Read-only) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notification Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Event Type (Disabled) */}
              <div>
                <Label>Event Type</Label>
                <Input value={notification.EventTypeEn} disabled />
              </div>

              {/* Template Name (Disabled) */}
              <div>
                <Label>Template Name</Label>
                <Input value={notification.NotificationTitleEn} disabled />
              </div>
            </div>

            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Input value={notification.Status} disabled />
              </div>
              <div>
                <Label>User Type</Label>
                <Input value={notification.UserType === 'REGISTERED' ? 'Registered Users' : 'All Users'} disabled />
              </div>
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
              ← Back
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
