"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { notificationService } from "@/services/notification.service"
import { NotificationTemplate, EventType } from "@/types/notification.types"
import { useAuth } from "@/components/providers/AuthProvider"
import { toast } from "sonner"

interface TemplateViewEditProps {
  template: NotificationTemplate
  mode: "view" | "edit"
  onBack: () => void
  language: "EN" | "AR"
}

export function TemplateViewEdit({ template, mode, onBack, language }: TemplateViewEditProps) {
  const { userDetails } = useAuth()
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [arabicText, setArabicText] = useState(template.TemplateAr || "")
  const [englishText, setEnglishText] = useState(template.TemplateEn || "")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadEventTypes()
  }, [])

  const loadEventTypes = async () => {
    try {
      const response = await notificationService.getTemplates()
      setEventTypes(response.EventType || [])
    } catch (error) {
      console.error('Error loading event types:', error)
    }
  }

  const handleSave = async () => {
    if (!englishText.trim() || !arabicText.trim()) {
      toast.error("Please fill in both English and Arabic text")
      return
    }

    setIsSaving(true)
    try {
      await notificationService.saveTemplate({
        ...template,
        NotificationId: template.NotificationId!,
        TemplateEn: englishText,
        TemplateAr: arabicText,
        ModifiedBy: userDetails?.EmpID?.toString() || userDetails?.userId?.toString() || "1"
      } as any)
      toast.success("Template saved successfully")
      // Increase delay to ensure DB sync before back
      setTimeout(() => {
        onBack()
      }, 2000)
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error("Failed to save template")
    } finally {
      setIsSaving(false)
    }
  }

  const isReadOnly = mode === "view"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "view" ? "View" : "Edit"} Notification Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eventType" className="mb-2">Event Type</Label>
              <Select value={template.EventCode} disabled>
                <SelectTrigger id="eventType">
                  <SelectValue placeholder="Select event type" />
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

            {/* Notification Name */}
            <div>
              <Label htmlFor="notificationName" className="mb-2">Notification Name</Label>
              <Select value={template.NotificationCategory} disabled>
                <SelectTrigger id="notificationName">
                  <SelectValue placeholder="Select notification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={template.NotificationCategory}>
                    {template.NotificationTitleEn}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Arabic Text */}
          {language === "AR" ? (
            <div>
              <Label htmlFor="arabicText" className="mb-2">Write your arabic text here:</Label>
              <Textarea
                id="arabicText"
                value={arabicText}
                onChange={(e) => setArabicText(e.target.value)}
                disabled={isReadOnly}
                className="min-h-[200px] text-right"
                dir="rtl"
                placeholder="اكتب النص العربي هنا..."
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="englishText" className="mb-2">Write your english text here:</Label>
              <Textarea
                id="englishText"
                value={englishText}
                onChange={(e) => setEnglishText(e.target.value)}
                disabled={isReadOnly}
                className="min-h-[200px]"
                placeholder="Write English text here..."
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              ← Back
            </Button>
            {mode === "edit" && (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
