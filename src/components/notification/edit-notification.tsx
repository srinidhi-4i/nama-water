"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { notificationService } from "@/services/notification.service"
import { CustomNotification, NotificationTemplate } from "@/types/notification.types"
import { toast } from "sonner"
import { format } from "date-fns"
import PageHeader from "@/components/layout/PageHeader"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { useAuth } from "@/components/providers/AuthProvider"

interface EditNotificationProps {
  notification: CustomNotification
  onBack: () => void
  isViewOnly?: boolean
}

export function EditNotification({ notification, onBack, isViewOnly = false }: EditNotificationProps) {
  const [scheduledDate, setScheduledDate] = useState(() => {
    const val = notification.ScheduledDateTime || 
                (notification as any).NotificationScheduledDatetime || 
                (notification as any).NotificationScheduledDate ||
                (notification as any).ScheduledDate ||
                (notification as any).EventId ||
                (notification as any).EventID ||
                (notification as any).NotificationUniqueId;
    if (!val) return ""
    const d = new Date(val)
    return isNaN(d.getTime()) ? "" : format(d, 'yyyy-MM-dd')
  })
  const [scheduledTime, setScheduledTime] = useState(() => {
    const val = notification.ScheduledDateTime || 
                (notification as any).NotificationScheduledDatetime || 
                (notification as any).NotificationScheduledDate ||
                (notification as any).ScheduledDate ||
                (notification as any).EventId ||
                (notification as any).EventID ||
                (notification as any).NotificationUniqueId;
    if (!val) return ""
    const d = new Date(val)
    return isNaN(d.getTime()) ? "" : format(d, 'HH:mm')
  })
  
  const [templateEn, setTemplateEn] = useState(notification.NotificationTitleEn || (notification as any).NotificationSubject || "")
  const [messageEn, setMessageEn] = useState((notification as any).NotificationEn || (notification as any).NotificationMessageEn || notification.NotificationTitleEn || (notification as any).NotificationSubject || "")
  const [messageAr, setMessageAr] = useState((notification as any).NotificationAr || (notification as any).NotificationMessageAr || notification.NotificationTitleAr || (notification as any).NotificationSubjectAr || "")
  const [userType, setUserType] = useState<"REGISTERED" | "ALL">(
    notification.UserType === 'REGISTERED' || (notification as any).UserType === 'RGUSR' ? "REGISTERED" : "ALL"
  )
  const [selectedTemplate, setSelectedTemplate] = useState(notification.NotificationCategory || "")
  
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<NotificationTemplate[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  
  const { language } = useLanguage()
  const { userDetails } = useAuth()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoadingData(true)
    try {
      const response = await notificationService.getTemplates()
      const allTemplates = response.Notifications || []
      setTemplates(allTemplates)
      
      // Filter templates based on current event type
      const filtered = allTemplates.filter(t => t.EventTypeEn === notification.EventTypeEn || t.EventCode === notification.EventTypeCode)
      setFilteredTemplates(filtered)
    } catch (error) {
      console.error('EditNotification: Error loading templates:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value)
    const template = filteredTemplates.find(t => t.NotificationCategory === value)
    if (template) {
      setMessageEn(template.TemplateEn || "")
      setMessageAr(template.TemplateAr || "")
    }
  }

  const handleUpdate = async () => {
    if (isViewOnly) return
    
    if (!scheduledDate || !scheduledTime) {
      toast.error("Please select scheduled date and time")
      return
    }

    setIsUpdating(true)
    try {
      const scheduledDateTime = `${scheduledDate} ${scheduledTime}:00`
      
      // Find current template metadata for subjects
      const currentTemplate = filteredTemplates.find(t => t.NotificationCategory === selectedTemplate)

      let resolvedId: any = notification.NotificationId ?? 
                             (notification as any).NotificationID ?? 
                             (notification as any).NotificationRquestID ??
                             (notification as any).id ??
                             (notification as any).ID ??
                             (notification as any).EventId ??
                             (notification as any).EventID ??
                             (notification as any).NotificationUniqueId;

      // Emergency Finder: If still undefined, find ANY key that looks like an ID
      if (!resolvedId) {
        const idKey = Object.keys(notification).find(k => k.toLowerCase().includes('id'));
        if (idKey) resolvedId = (notification as any)[idKey];
      }

      // Final URL Fallback: Check if we have it in the URL
      if (!resolvedId) {
        const urlParams = new URLSearchParams(window.location.search);
        resolvedId = urlParams.get('id');
      }

      const idStr = resolvedId?.toString();
      if (!resolvedId || idStr === 'undefined' || idStr === '$undefined') {
        toast.error("Could not determine notification ID. Please try again from the list.")
        setIsUpdating(false)
        return
      }

      await notificationService.updateNotification({
        NotificationId: resolvedId,
        NotificationEn: messageEn,
        NotificationAr: messageAr,
        NotificationCategory: selectedTemplate,
        NotificationSubject: currentTemplate?.NotificationTitleEn || notification.NotificationTitleEn,
        NotificationSubjectAr: currentTemplate?.NotificationTitleAr || (notification as any).NotificationTitleAr || "",
        ScheduledDateTime: scheduledDateTime,
        UserType: userType,
        ModifiedBy: userDetails?.EmpID?.toString() || userDetails?.userId?.toString() || "1",
        IsDataMandatory: currentTemplate?.IsActive ?? true
      } as any)
      
      toast.success("Notification updated successfully")
      // Small delay to ensure DB sync before refresh
      setTimeout(() => {
        onBack()
      }, 1000)
    } catch (error) {
      console.error('Error updating notification:', error)
      toast.error("Failed to update notification")
    } finally {
      setIsUpdating(false)
    }
  }

  const titleEn = isViewOnly ? "View Custom Notification" : "Edit Custom Notification"
  const titleAr = isViewOnly ? "عرض إشعار مخصص" : "تعديل إشعار مخصص"

  return (
    <>
      <div className="-mx-6 border-b mb-6">
        <PageHeader
          language={language}
          titleEn={titleEn}
          titleAr={titleAr}
          breadcrumbItems={[
            { labelEn: "Home", labelAr: "الرئيسية", href: "/branchhome" },
            { labelEn: "Custom Notification", labelAr: "إشعار مخصص", href: "/notification-center/custom" },
            { labelEn: isViewOnly ? "View Notification" : "Edit Notification", labelAr: isViewOnly ? "عرض الإشعار" : "تعديل الإشعار" }
          ]}
          showShadow={false}
        />
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="space-y-8">
        {/* Notification Details Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[#1F4E58] border-b pb-2">Notification Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Event Type</Label>
              <Input 
                value={notification.EventTypeEn} 
                disabled 
                className="h-11 bg-gray-50 border-gray-300 text-gray-500 font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Template Name</Label>
              <Select 
                value={selectedTemplate} 
                onValueChange={handleTemplateChange}
                disabled={isViewOnly || isLoadingData}
              >
                <SelectTrigger className="h-11 border-gray-300">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.map(t => (
                    <SelectItem key={t.NotificationCategory} value={t.NotificationCategory}>
                      {t.NotificationTitleEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">User Type</Label>
              <Select 
                value={userType} 
                onValueChange={(v: any) => setUserType(v)}
                disabled={isViewOnly}
              >
                <SelectTrigger className="h-11 border-gray-300">
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Users</SelectItem>
                  <SelectItem value="REGISTERED">Registered Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Status</Label>
              <Input 
                value={notification.Status} 
                disabled 
                className="h-11 bg-gray-50 border-gray-300 text-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[#1F4E58] border-b pb-2">Notification Messages</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Message (English) <span className="text-red-500">*</span></Label>
              <Textarea 
                value={messageEn}
                onChange={(e) => setMessageEn(e.target.value)}
                disabled={isViewOnly}
                className="min-h-[120px] focus:ring-[#006A72] border-gray-300"
                placeholder="Enter notification message in English"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Message (Arabic)</Label>
              <Textarea 
                value={messageAr}
                onChange={(e) => setMessageAr(e.target.value)}
                disabled={isViewOnly}
                className="min-h-[120px] focus:ring-[#006A72] border-gray-300 text-right"
                dir="rtl"
                placeholder="أدخل رسالة الإشعار بالعربية"
              />
            </div>
          </div>
        </div>

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
                disabled={isViewOnly}
                className="h-11 border-gray-300 focus:ring-[#006A72] flex-1"
              />
              <Input
                id="scheduledTime"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={isViewOnly}
                className="h-11 border-gray-300 focus:ring-[#006A72] flex-1 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 mt-8 border-t">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="px-8 h-11 border-[#1F4E58] text-[#1F4E58] hover:bg-teal-50"
          >
            {isViewOnly ? "Back" : "Previous"}
          </Button>
          {!isViewOnly && (
            <Button 
              onClick={handleUpdate} 
              disabled={isUpdating}
              className="px-8 h-11 bg-[#1F4E58] hover:bg-[#163a42] text-white min-w-[120px]"
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
