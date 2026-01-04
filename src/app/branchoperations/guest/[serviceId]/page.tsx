"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { ArrowLeft, Send, Upload } from "lucide-react"

// Map service IDs to readable titles (fallback if API data isn't easily accessible here)
const SERVICE_TITLES: Record<string, { en: string; ar: string }> = {
  "ReportWaterLeakBranchOperation": { en: "Report Water Leakage", ar: "الإبلاغ عن تسرب المياه" },
  "GenericComplaintsBranch": { en: "General Complaint", ar: "شكوى عامة" },
  "VehicleComplaintsBranch": { en: "Report Company Vehicle", ar: "الإبلاغ عن مركبة الشركة" },
  "ReportQualityBop": { en: "Report Water Quality", ar: "الإبلاغ عن جودة المياه" },
  "ContractorWorkComplaintBranch": { en: "Report Contractor Work", ar: "الإبلاغ عن أعمال المقاول" },
  "WaterOverflowBranch": { en: "Report Water Overflow", ar: "الإبلاغ عن فيضان المياه" },
  "ReportHighPressure": { en: "Report Low/High Pressure", ar: "الإبلاغ عن ضغط منخفض/مرتفع" },
  "SewerOdorComplaintBranch": { en: "Sewer Odor Complaint", ar: "شكوى رائحة الصرف الصحي" }
}

export default function GuestServicePage() {
  const params = useParams()
  const router = useRouter()
  const { language } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const serviceId = params?.serviceId as string
  const serviceInfo = SERVICE_TITLES[serviceId] || { en: "Service Request", ar: "طلب خدمة" }
  const title = language === "AR" ? serviceInfo.ar : serviceInfo.en

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    alert(language === "EN" ? "Request submitted successfully!" : "تم تقديم الطلب بنجاح!")
    router.back()
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="mb-6 hover:bg-slate-100"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {language === "EN" ? "Back to Services" : "عودة للخدمات"}
      </Button>

      <Card className="shadow-lg border-t-4 border-t-[#D92D20]">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-2xl text-[#1F4E58]">{title}</CardTitle>
          <CardDescription>
            {language === "EN" 
              ? "Please fill in the details below to submit your request." 
              : "يرجى تعبئة التفاصيل أدناه لتقديم طلبك."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">{language === "EN" ? "Full Name" : "الاسم الكامل"}</Label>
                <Input id="fullName" required placeholder={language === "EN" ? "Enter your name" : "أدخل اسمك"} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">{language === "EN" ? "Phone Number" : "رقم الهاتف"}</Label>
                <Input id="phone" required type="tel" placeholder="968xxxxxxxx" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="civilId">{language === "EN" ? "Civil ID (Optional)" : "الرقم المدني (اختياري)"}</Label>
                <Input id="civilId" placeholder="xxxxxxxx" />
              </div>

               <div className="space-y-2">
                <Label htmlFor="email">{language === "EN" ? "Email (Optional)" : "البريد الإلكتروني (اختياري)"}</Label>
                <Input id="email" type="email" placeholder="name@example.com" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{language === "EN" ? "Location / Landmark" : "الموقع / معلم بارز"}</Label>
              <Input id="location" required placeholder={language === "EN" ? "Near..." : "بالقرب من..."} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{language === "EN" ? "Description" : "الوصف"}</Label>
              <Textarea 
                id="description" 
                required 
                className="min-h-[100px]"
                placeholder={language === "EN" ? "Please describe the issue..." : "يرجى وصف المشكلة..."}
              />
            </div>

            <div className="space-y-2">
              <Label>{language === "EN" ? "Attachment" : "مرفق"}</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm">{language === "EN" ? "Click to upload photo" : "انقر لتحميل صورة"}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="bg-[#1F4E58] hover:bg-[#163a42] text-white min-w-[150px]">
                {isSubmitting ? (
                  <span className="animate-pulse">Submitting...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {language === "EN" ? "Submit Request" : "تقديم الطلب"}
                  </>
                )}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
