"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { waterShutdownService } from "@/services/watershutdown.service"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FloatingLabelInput, FloatingLabel } from "@/components/ui/floating-label"
import { 
  WaterShutdownNotification, 
  WaterShutdownFilters,
  Region,
  EventType,
  RegionItem,
  EventTypeItem
} from "@/types/watershutdown.types"
import { format } from "date-fns"
import Link from "next/link"
import { getWaterShutdownColumns } from "@/app/(dashboard)/watershutdown/list/columns"
import { NotificationView } from "@/components/watershutdown/notification-view-edit"
import { NotificationEditor } from "@/components/watershutdown/NotificationEditor"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"
import { IntermediateSMSModal } from "@/components/watershutdown/IntermediateSMSModal"
import { CompletionModal } from "@/components/watershutdown/CompletionModal"
import { WaterShutdownTemplate } from "@/types/watershutdown.types"
import jsPDF from "jspdf"
import { toast } from "sonner"

export default function WaterShutdownList() {

  const router = useRouter()

  const { language } = useLanguage()

  const [notifications, setNotifications] = useState<WaterShutdownNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false) // Added for PDF download

  // Master Data
  const [regionMaster, setRegionMaster] = useState<RegionItem[]>([])
  const [eventMaster, setEventMaster] = useState<EventTypeItem[]>([])

  // Filter states
  const [selectedRegion, setSelectedRegion] = useState<Region | "ALL">("ALL")
  const [selectedEventType, setSelectedEventType] = useState<EventType | "ALL">("ALL")
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()
  const [searchQuery, setSearchQuery] = useState("")

  // View/Edit State
  const [showViewEdit, setShowViewEdit] = useState(false)
  const [viewMode, setViewMode] = useState<"view" | "edit" | "create">("view")
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)

  // Action Modals State
  const [showSMSModal, setShowSMSModal] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [templates, setTemplates] = useState<WaterShutdownTemplate[]>([])
  const [smsTemplateEn, setSmsTemplateEn] = useState("")
  const [smsTemplateAr, setSmsTemplateAr] = useState("")
  const [smsDefaultTab, setSmsDefaultTab] = useState<"send" | "history">("send")
  const [smsCanSend, setSmsCanSend] = useState(true)

  useEffect(() => {
    loadMasterData()
    loadNotifications()
  }, [])

  const loadMasterData = async () => {
    try {
        const data = await waterShutdownService.getWaterShutdownMasterData();
        setRegionMaster(data.regions);
        setEventMaster(data.eventTypes);

        // Load templates for SMS
        const templateList = await waterShutdownService.getTemplates();
        setTemplates(templateList);
    } catch (error) {
        console.error('Error loading master data', error)
    }
  }

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const filters: WaterShutdownFilters = {
        region: selectedRegion !== "ALL" ? selectedRegion : undefined,
        eventType: selectedEventType !== "ALL" ? selectedEventType : undefined,
        fromDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
        toDate: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
        searchQuery: searchQuery || undefined,
      }

      const response = await waterShutdownService.getNotifications(filters)
      setNotifications(response.data)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendSMS = async () => {
      setIsLoading(true)
      try {
        await waterShutdownService.resendIntermediateNotifications(selectedNotificationId)
        toast.success("SMS resent successfully")
      } catch (error) {
        toast.error("Failed to resend SMS")
      } finally {
        setIsLoading(false)
      }
  }

  const handleSearch = () => {
    loadNotifications()
  }

  const handleClearFilters = () => {
    setSelectedRegion("ALL")
    setSelectedEventType("ALL")
    setFromDate(undefined)
    setToDate(undefined)
    setSearchQuery("")
  }

  const handleExport = () => {
    try {
      // Define headers
      const headers = [
        "Event ID",
        "Event Name",
        "Status",
        "Region",
        "Start Date & Time",
        "End Date & Time",
        "Initiated By"
      ];

      // Map data to CSV rows
      const rows = notifications.map(item => [
        item.eventId,
        item.eventType,
        item.status,
        item.region,
        format(new Date(item.startDateTime), 'dd/MM/yyyy HH:mm'),
        format(new Date(item.endDateTime), 'dd/MM/yyyy HH:mm'),
        item.createdBy || ''
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Create blob with BOM for Excel compatibility (UTF-8)
      const blob = new Blob(["\uFEFF", csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `water-shutdown-notifications-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting to CSV:', error)
      alert('Failed to export CSV')
    }
  }

  const handleView = (id: string) => {
    setSelectedNotificationId(id)
    setViewMode("view")
    setShowViewEdit(true)
  }

  const handleCreate = () => {
    setSelectedNotificationId(null)
    setViewMode("create")
    setShowViewEdit(true)
  }

  const handleDownload = async (id: string) => {
    setIsDetailLoading(true)
    try {
      const data = await waterShutdownService.getNotificationById(id)
      const pdf = new jsPDF("p", "mm", "a4")
      const pageHeight = pdf.internal.pageSize.height
      const pageWidth = pdf.internal.pageSize.width

      const primaryColor = [18, 55, 86]
      const accentColor = [66, 119, 124]
      const redColor = [208, 0, 0]
      const lightBg = [246, 250, 253]
      const grayColor = [100, 100, 100]
      const borderColor = [226, 232, 240]

      let currentY = 15

      const checkPageBreak = (neededHeight: number) => {
        if (currentY + neededHeight > pageHeight - 20) {
          pdf.addPage()
          currentY = 20
          return true
        }
        return false
      }

      const drawHeader = () => {
        pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        pdf.rect(10, currentY, 190, 12, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(12)
        pdf.setFont("helvetica", "bold")
        pdf.text("WATER OPERATION SHUTDOWN NOTIFICATION", 105, currentY + 7.5, { align: "center" })
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(8)
        pdf.text(data.eventId || "", 195, currentY + 7.5, { align: "right" })
        currentY += 18
      }

      drawHeader()

      // Type Banner
      pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2])
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text(data.eventType?.toUpperCase() || "", pageWidth / 2, currentY, { align: "center" })
      currentY += 8

      // Date Time Section
      pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2])
      pdf.rect(10, currentY, 190, 25, 'F')

      const formatDatePDF = (dateStr: string | undefined) => {
        if (!dateStr) return { day: "--", rest: "--", time: "--" }
        const d = new Date(dateStr)
        return {
          day: format(d, "d"),
          rest: format(d, "EEEE") + ", " + format(d, "MMMM yyyy"),
          time: format(d, "hh:mm a")
        }
      }

      const fromDate = formatDatePDF(data.startDateTime)
      const toDate = formatDatePDF(data.endDateTime)

      // From Box
      pdf.setDrawColor(accentColor[0], accentColor[1], accentColor[2])
      pdf.setLineWidth(0.4)
      pdf.rect(15, currentY + 3.5, 75, 18)
      pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2])
      pdf.rect(15, currentY + 3.5, 12, 18, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(8)
      pdf.text("From", 21, currentY + 12.5, { align: "center", angle: 90 })
      pdf.setTextColor(redColor[0], redColor[1], redColor[2])
      pdf.setFontSize(22)
      pdf.text(fromDate.day, 30, currentY + 16.5)
      pdf.setTextColor(51, 51, 51)
      pdf.setFontSize(7)
      pdf.text(fromDate.rest, 48, currentY + 10.5)
      pdf.setTextColor(redColor[0], redColor[1], redColor[2])
      pdf.setFontSize(10)
      pdf.text(fromDate.time, 48, currentY + 17.5)

      // To Box
      pdf.rect(115, currentY + 3.5, 75, 18)
      pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2])
      pdf.rect(115, currentY + 3.5, 12, 18, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(8)
      pdf.text("To", 121, currentY + 12.5, { align: "center", angle: 90 })
      pdf.setTextColor(redColor[0], redColor[1], redColor[2])
      pdf.setFontSize(22)
      pdf.text(toDate.day, 130, currentY + 16.5)
      pdf.setTextColor(51, 51, 51)
      pdf.setFontSize(7)
      pdf.text(toDate.rest, 148, currentY + 10.5)
      pdf.setTextColor(redColor[0], redColor[1], redColor[2])
      pdf.setFontSize(10)
      pdf.text(toDate.time, 148, currentY + 17.5)

      currentY += 35

      const renderSection = (title: string, content: string | string[], x: number, width: number, minH: number = 30) => {
        pdf.setFillColor(241, 245, 249)
        pdf.rect(x, currentY, width, 8, 'F')
        pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2])
        pdf.setFontSize(9)
        pdf.setFont("helvetica", "bold")
        pdf.text(title.toUpperCase(), x + 2, currentY + 5.5)

        pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
        pdf.setTextColor(51, 51, 51)
        pdf.setFontSize(8)
        pdf.setFont("helvetica", "normal")

        let textY = currentY + 13
        let startY = currentY
        if (Array.isArray(content)) {
          content.forEach(item => {
            if (textY > pageHeight - 15) {
              // Finish current box
              pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
              pdf.rect(x, startY, width, pageHeight - startY - 10)

              pdf.addPage()
              currentY = 20
              startY = currentY
              textY = currentY + 5

              // Draw "Continued" header or just background
              pdf.setFillColor(241, 245, 249)
              pdf.rect(x, currentY - 5, width, 5, 'F')
              pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2])
              pdf.setFontSize(7)
              pdf.text(`${title} (continued)`, x + 2, currentY - 1.5)
            }
            pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2])
            pdf.circle(x + 5, textY - 1, 0.4, 'F')
            pdf.setTextColor(51, 51, 51)
            pdf.setFontSize(8)
            pdf.text(String(item), x + 8, textY)
            textY += 4.5
          })
        } else {
          const lines = pdf.splitTextToSize(String(content || "--"), width - 10)
          lines.forEach((line: string) => {
             if (textY > pageHeight - 15) {
                pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
                pdf.rect(x, startY, width, pageHeight - startY - 10)
                pdf.addPage()
                currentY = 20
                startY = currentY
                textY = currentY + 5
             }
             pdf.text(line, x + 5, textY)
             textY += 4.5
          })
        }

        const h = textY - startY + 2
        pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
        pdf.rect(x, startY, width, h)
        currentY = startY + h
        return h
      }

      // Willayats & Map Section
      const startYForGrid = currentY
      const hWillayat = renderSection("Affected Willayat", data.affectedWillayats || [], 10, 92)

      // Draw stylized Map Box starting from the same initial Y
      pdf.setFillColor(233, 251, 252)
      pdf.rect(108, startYForGrid, 92, hWillayat, 'F')
      pdf.setDrawColor(accentColor[0], accentColor[1], accentColor[2])
      pdf.rect(108, startYForGrid, 92, hWillayat)
      pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2])
      pdf.setFontSize(8)
      pdf.text("Oman Regional Map", 154, startYForGrid + 10, { align: "center" })
      // Draw a simple Oman outline in the map box
      pdf.setLineWidth(0.4)
      pdf.moveTo(145, startYForGrid + (hWillayat * 0.4))
      pdf.lineTo(165, startYForGrid + (hWillayat * 0.2))
      pdf.lineTo(175, startYForGrid + (hWillayat * 0.3))
      pdf.lineTo(170, startYForGrid + (hWillayat * 0.6))
      pdf.lineTo(145, startYForGrid + (hWillayat * 0.4))
      pdf.stroke()
      pdf.setFontSize(6)
      pdf.text("Affected regions highlighted", 154, startYForGrid + hWillayat - 5, { align: "center" })

      currentY = startYForGrid + hWillayat + 8

      // DMAs Section - could be long
      checkPageBreak(40)
      const hDMA = renderSection("Affected DMA'S", data.affectedDMAs || [], 10, 190, 40)
      currentY += hDMA + 8

      // Notification Details & Reason
      checkPageBreak(30)
      const startYForDetails = currentY
      const hDetails = renderSection("Notification Details", data.notificationDetails || "", 10, 92, 25)
      const endYDetails = currentY
      currentY = startYForDetails
      const hReason = renderSection("Reason for Shutdown", data.reasonForShutdown || "", 108, 92, 25)
      currentY = Math.max(endYDetails, currentY) + 8

      // Contractor & Actions
      checkPageBreak(30)
      const startYForContractor = currentY
      const hContractor = renderSection("Contractor Information", (data.contractors || []).map((c: any) => c.contractorName), 10, 92, 25)
      const endYContractor = currentY

      // Action Requested - manually draw because it's custom
      currentY = startYForContractor
      pdf.setFillColor(241, 245, 249)
      pdf.rect(108, currentY, 92, 8, 'F')
      pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2])
      pdf.setFont("helvetica", "bold")
      pdf.text("ACTION REQUESTED", 110, currentY + 5.5)

      let badgeX = 112
      let badgeY = currentY + 13
      data.actionsRequired?.forEach((action: string) => {
        const actionWidth = pdf.getTextWidth(action) + 6
        if (badgeX + actionWidth > 195) {
          badgeX = 112
          badgeY += 6
        }
        pdf.setDrawColor(accentColor[0], accentColor[1], accentColor[2])
        pdf.setFillColor(233, 251, 252)
        pdf.roundedRect(badgeX, badgeY - 3, actionWidth, 4.5, 1, 1, 'FD')
        pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2])
        pdf.setFontSize(6.5)
        pdf.text(action, badgeX + 3, badgeY + 0.5)
        badgeX += actionWidth + 2
      })
      const hActions = Math.max(25, badgeY - currentY + 5)
      pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
      pdf.rect(108, currentY, 92, hActions)

      currentY = Math.max(endYContractor, currentY + hActions) + 8

      // Technical Info Table
      checkPageBreak(25)
      pdf.setFillColor(241, 245, 249)
      pdf.rect(10, currentY, 190, 8, 'F')
      pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
      pdf.rect(10, currentY, 190, 16)
      pdf.line(10, currentY + 8, 200, currentY + 8)

      pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2])
      pdf.setFontSize(8)
      pdf.setFont("helvetica", "bold")
      pdf.text("VALVE LOCK", 15, currentY + 5.5)
      pdf.text("SIZE OF PIPELINE", 75, currentY + 5.5)
      pdf.text("TYPE OF PIPELINE", 140, currentY + 5.5)

      pdf.setTextColor(51, 51, 51)
      pdf.setFont("helvetica", "normal")
      pdf.text(data.valveLock || "--", 15, currentY + 12.5)
      pdf.text(data.sizeOfPipeline || "--", 75, currentY + 12.5)
      pdf.text(data.typeOfPipeline || "--", 140, currentY + 12.5)
      currentY += 24

      // Focal Points Section
      checkPageBreak(30)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      pdf.text("FOCAL POINTS", 10, currentY)
      currentY += 3

      const fHeaders = ["Name", "Email ID", "Contact Number"]
      pdf.setFillColor(241, 245, 249)
      pdf.rect(10, currentY, 190, 8, 'F')
      pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2])
      pdf.text(fHeaders[0], 15, currentY + 5.5)
      pdf.text(fHeaders[1], 75, currentY + 5.5)
      pdf.text(fHeaders[2], 150, currentY + 5.5)

      pdf.setTextColor(51, 51, 51)
      pdf.setFont("helvetica", "normal")
      data.focalPoint?.forEach((f: any) => {
        currentY += 8
        checkPageBreak(8)
        pdf.text(String(f.Name || "--"), 15, currentY + 5.5)
        pdf.text(String(f.Email || "--"), 75, currentY + 5.5)
        pdf.text(String(f["Contact Number"] || "--"), 150, currentY + 5.5)
        pdf.setDrawColor(245, 245, 245)
        pdf.line(10, currentY + 8, 200, currentY + 8)
      })
      pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
      pdf.rect(10, currentY - (data.focalPoint?.length || 0) * 8, 190, (data.focalPoint?.length || 0) * 8 + 8)
      currentY += 15

      // Footer Info
      checkPageBreak(30)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      pdf.text("LOCATION DETAILS", 10, currentY)
      pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2])
      pdf.setFont("helvetica", "normal")
      pdf.text(data.locationDetails || "--", 10, currentY + 5)

      currentY += 12
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      pdf.text("INITIATED BY", 10, currentY)
      pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2])
      pdf.setFont("helvetica", "normal")
      pdf.text(data.initiatedBy || "--", 10, currentY + 5)

      pdf.save(`Water_Shutdown_${data.eventId}.pdf`)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setIsDetailLoading(false)
    }
  }


  const handleEdit = (id: string) => {
      setSelectedNotificationId(id)
      setViewMode("edit")
      setShowViewEdit(true)
  }

  const handleBack = () => {
    setShowViewEdit(false)
    setSelectedNotificationId(null)
    loadNotifications() // Refresh list
  }

  const handleSMS = (id: string) => {
      setSelectedNotificationId(id)

      const item = notifications.find(n => n.internalId?.toString() === id || n.eventId === id)
      if (item) {
          const now = new Date();
          const startDate = new Date(item.startDateTime);
          const isStarted = now >= startDate;
          const isEnded = ['COMPLETED', 'CANCELLED', 'COMPLETION TRIGGERED'].includes(item.status);

          const sendEnabled = isStarted && !isEnded
          setSmsCanSend(sendEnabled)
          setSmsDefaultTab(sendEnabled ? "send" : "history")
      } else {
          setSmsCanSend(false)
          setSmsDefaultTab("history")
      }

      // Find default template (INMC code from legacy)
      const defaultTemplate = templates.find(t => t.TemplateTypeCode === "INMC")
      setSmsTemplateEn(defaultTemplate?.body || "")
      setSmsTemplateAr(defaultTemplate?.bodyAr || "")
      setShowSMSModal(true)
  }

  const handleComplete = (id: string) => {
      setSelectedNotificationId(id)
      setShowCompletionModal(true)
  }

  const tableColumns = getWaterShutdownColumns({
      onView: handleView,
      onDownload: handleDownload,
      onEdit: handleEdit,
      onSMS: handleSMS,
      onComplete: handleComplete,
  }); // In a real app, wrap in useMemo

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden">
      <PageHeader
        language={language}
        titleEn="Water Shutdown Notification"
        titleAr="إشعارات إغلاق المياه"
        breadcrumbEn="Water Shutdown Notification"
        breadcrumbAr="إشعارات إغلاق المياه"
      />

      <div className="px-6">
        {showViewEdit ? (
          viewMode === "view" ? (
            <NotificationView
              notificationId={selectedNotificationId!}
              onBack={handleBack}
              language={language}
            />
          ) : (
            <NotificationEditor
              notificationId={selectedNotificationId || undefined}
              onBack={handleBack}
              onSaveSuccess={handleBack}
            />
          )
        ) : (
          <>
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                  <Select value={selectedRegion} onValueChange={(value) => setSelectedRegion(value as Region | "ALL")}>
                    <SelectTrigger id="region" className="bg-white w-full h-[50px] pt-4">
                      <SelectValue placeholder=" " />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {regionMaster.map((region, index) => (
                         <SelectItem key={`${region.RegionID}-${index}`} value={region.RegionCode?.trim()}>
                            {region.RegionName || region.RegionCode}
                         </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FloatingLabel htmlFor="region">{language === "EN" ? `Region` : `المنطقة`}</FloatingLabel>
                </div>

                <div className="relative">
                  <FloatingLabelInput
                      type="date"
                      id="fromDate"
                      label={language === "EN" ? `From Date` : `تاريخ البدء`}
                      value={fromDate ? format(fromDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setFromDate(e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full bg-white"
                  />
                </div>

                <div className="relative">
                  <FloatingLabelInput
                      type="date"
                      id="toDate"
                      label={language === "EN" ? `To Date` : `تاريخ الانتهاء`}
                      value={toDate ? format(toDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setToDate(e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full bg-white"
                  />
                </div>

                <div className="flex items-end gap-2 pb-[1px]">
                  <Button onClick={handleSearch} className="bg-[#1F4E58] hover:bg-[#163a42] text-white px-6">
                    {language === "EN" ? `Search` : `بحث`}
                  </Button>
                  <Button variant="outline" onClick={handleClearFilters} className="text-[#1F4E58] border-[#1F4E58] hover:bg-teal-50 px-6">
                    {language === "EN" ? `Clear Filter` : `مسح الفلاتر`}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative lg:col-span-1">
                  <Select value={selectedEventType} onValueChange={(value) => setSelectedEventType(value as EventType | "ALL")}>
                    <SelectTrigger id="eventType" className="bg-white w-full h-[50px] pt-4">
                      <SelectValue placeholder=" " />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {eventMaster?.map((event) => (
                          <SelectItem key={event?.EventTypeID || Math.random()} value={event?.EventTypeCode || event?.EventTypeID?.toString() || ""}>
                            {event?.EventTypeName}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FloatingLabel htmlFor="eventType">{language === "EN" ? `Event Type` : `نوع الحدث`}</FloatingLabel>
                </div>

                <div className="relative lg:col-span-1">
                  <FloatingLabelInput
                      id="search"
                      label={language === "EN" ? `Search` : `بحث`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="bg-white w-full"
                  />
                </div>

                <div className="flex items-end gap-2 md:col-span-2 lg:col-span-2 pb-[1px]">
                  <Button variant="default" onClick={handleExport} className="bg-[#1F4E58] hover:bg-[#163a42] text-white">
                    {language === "EN" ? `Export Excel` : `تصدير إلى Excel`}
                  </Button>
                  <Button 
                    onClick={async () => {
                      setIsDetailLoading(true);
                      await loadMasterData();
                      setIsDetailLoading(false);
                      setViewMode("create");
                      setSelectedNotificationId(null);
                      setShowViewEdit(true);
                    }} 
                    className="bg-[#E54B4B] hover:bg-[#d03b3b] text-white"
                  >
                    {language === "EN" ? `Create New Notification` : `إنشاء إشعار جديد`}
                  </Button>
                </div>
              </div>
            </div>
            
            <div >
              <DataTable
                data={notifications}
                columns={tableColumns}
                isLoading={isLoading || isDetailLoading}
                emptyMessage={language === "EN" ? `No water shutdown notifications found` : `لا يوجد إشعارات إغلاق المياه`}
              />
            </div>
          </>
        )}

        
        <IntermediateSMSModal 
            open={showSMSModal}
            onOpenChange={setShowSMSModal}
            eventId={selectedNotificationId || ""}
            initialTemplateEn={smsTemplateEn}
            initialTemplateAr={smsTemplateAr}
            defaultTab={smsDefaultTab}
            canSend={smsCanSend}
            onSuccess={() => {
                loadNotifications()
            }}
        />

        <CompletionModal 
            open={showCompletionModal}
            onOpenChange={setShowCompletionModal}
            eventId={selectedNotificationId || ""}
            onSuccess={() => {
                loadNotifications() // Refresh list as status changes
            }}
        />
      </div>
    </div>
  )
}
