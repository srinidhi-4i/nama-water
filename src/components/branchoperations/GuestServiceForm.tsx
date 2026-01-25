"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { ArrowLeft, Search, Loader2, CheckCircle2 } from "lucide-react"
import { branchOpsService } from "@/services/branchops.service"
import { toast } from "sonner"

export interface FormTab {
  id: string
  labelEn: string
  labelAr: string
}

export interface GuestServiceFormProps {
  titleEn: string
  titleAr: string
  tabs: FormTab[]
  layout?: "simple" | "account-search" | "multi-step"
  serviceId?: string
}

export function GuestServiceForm({ titleEn, titleAr, tabs, layout = "simple", serviceId }: GuestServiceFormProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "contact")
  const [formData, setFormData] = useState<any>({
    LanguageCode: 'EN',
    SourceType: 'Web',
    ProcessType: 'New',
    RequestedBy: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [requestNumber, setRequestNumber] = useState<string | null>(null)
  
  const title = language === "AR" ? titleAr : titleEn

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev: any) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      let response: any;
      
      // Map serviceId to service methods
      switch (serviceId) {
        case "ContractorWorkComplaintBranch":
          response = await branchOpsService.submitContractorWorkComplaint(formData);
          break;
        case "WastewaterServiceBranch":
          response = await branchOpsService.submitWastewaterComplaint(formData);
          break;
        case "SewerOdorComplaintBranch":
          response = await branchOpsService.submitSewerOdorComplaint(formData);
          break;
        case "WaterOverflowBranch":
          response = await branchOpsService.submitWaterOverflowComplaint(formData);
          break;
        case "ReportHighPressure":
        case "OperationalIssues":
          response = await branchOpsService.submitPressureComplaint(formData);
          break;
        case "ReportQualityBop":
          response = await branchOpsService.submitWaterQualityComplaint(formData);
          break;
        case "ReportWaterLeakageBop":
        case "ReportWaterLeakBranchOperation":
          response = await branchOpsService.submitWaterLeakageComplaint(formData);
          break;
        case "ReportCompanyVehiclesBop":
        case "VehicleComplaintsBranch":
          response = await branchOpsService.submitCompanyVehicleComplaint(formData);
          break;
        default:
          // Try generic submission if serviceId matches GUEST_BRANCH_SERVICE_URLS
          response = await branchOpsService.submitGuestService('CommonService/GenericSubmit', 'GENERIC', formData);
      }

      if (response.success) {
        setSubmitted(true)
        setRequestNumber(response.requestNumber)
        toast.success(language === "AR" ? "تم تقديم الطلب بنجاح" : "Request submitted successfully")
      } else {
        toast.error(response.message || (language === "AR" ? "فشل تقديم الطلب" : "Failed to submit request"))
      }
    } catch (error) {
      console.error("Submission error:", error)
      toast.error(language === "AR" ? "حدث خطأ أثناء التقديم" : "An error occurred during submission")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 animate-in zoom-in-95 duration-500">
        <Card className="border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
          <div className="bg-[#006A72] p-12 text-center text-white relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 shadow-xl">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-black mb-2 tracking-tight">
                {language === "AR" ? "تم تقديم الطلب!" : "Request Submitted!"}
              </h2>
              <p className="text-white/80 text-sm max-w-md mx-auto">
                {language === "AR" 
                  ? "تم استلام طلبك بنجاح. سيتم التواصل معك قريباً." 
                  : "Your request has been received successfully. Our team will get back to you soon."}
              </p>
            </div>
          </div>
          <CardContent className="p-10 bg-white">
            <div className="flex flex-col items-center gap-8">
              <div className="w-full bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                  {language === "AR" ? "رقم المرجعي" : "TRACKING NUMBER"}
                </p>
                <p className="text-4xl font-black text-[#D92D20] tracking-tighter">
                  {requestNumber || "---"}
                </p>
              </div>
              
              <div className="flex gap-4 w-full">
                <Button 
                  onClick={() => router.push('/branch-operations/guest')}
                  className="flex-1 bg-white hover:bg-slate-50 text-[#1F4E58] border border-slate-200 h-14 rounded-xl font-bold uppercase text-xs tracking-wider"
                >
                  {language === "AR" ? "العودة للرئيسية" : "BACK TO SERVICES"}
                </Button>
                <Button 
                  onClick={() => window.print()}
                  className="flex-1 bg-[#1F4E58] hover:bg-[#163a41] text-white h-14 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg"
                >
                  {language === "AR" ? "طباعة" : "PRINT RECEIPT"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case "contact":
      case "contact-details":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 max-w-4xl">
            <div className="space-y-1 flex flex-col md:flex-row md:items-center gap-3">
              <Label htmlFor="contactName" className="md:w-40 text-gray-700 font-medium whitespace-nowrap text-sm">
                {language === "AR" ? "اسم الشخص المسؤول" : "Person Name"} <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="CustomerName" 
                value={formData.CustomerName || ""}
                onChange={handleInputChange}
                placeholder={language === "AR" ? "اسم الشخص المسؤول" : "Person Name"}
                className="bg-white border-gray-200 h-9 text-sm"
              />
            </div>

            <div className="space-y-1 flex flex-col md:flex-row md:items-center gap-3">
              <Label htmlFor="GSMNumber" className="md:w-40 text-gray-700 font-medium whitespace-nowrap text-sm">
                {language === "AR" ? "رقم الهاتف" : "GSM Number"} <span className="text-red-500">*</span>
              </Label>
              <div className="flex w-full">
                <div className="bg-slate-50 border border-r-0 border-gray-200 px-2 py-1.5 text-gray-500 text-xs flex items-center rounded-l-md">
                  +968
                </div>
                <Input 
                  id="GSMNumber" 
                  value={formData.GSMNumber || ""}
                  onChange={handleInputChange}
                  placeholder={language === "AR" ? "رقم الهاتف" : "GSM Number"}
                  className="bg-white border-gray-200 rounded-l-none h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1 flex flex-col md:flex-row md:items-center gap-3">
              <Label htmlFor="EmailID" className="md:w-40 text-gray-700 font-medium whitespace-nowrap text-sm">
                {language === "AR" ? "البريد الإلكتروني" : "Email ID"}
              </Label>
              <Input 
                id="EmailID" 
                value={formData.EmailID || ""}
                onChange={handleInputChange}
                placeholder={language === "AR" ? "البريد الإلكتروني" : "Email ID"}
                className="bg-white border-gray-200 h-9 text-sm"
              />
            </div>
          </div>
        )

      case "customer":
      case "customer-details":
        if (layout === "account-search") {
          return (
            <div className="space-y-8 max-w-6xl">
              <div className="space-y-3">
                <Label className="text-gray-700 font-medium text-sm">
                  {language === "AR" ? "اختر رقم الحساب" : "Select Account Number"}
                </Label>
                <div className="relative max-w-sm">
                  <Input 
                    id="AccountNumber"
                    value={formData.AccountNumber || ""}
                    onChange={handleInputChange}
                    placeholder={language === "AR" ? "بحث" : "Search"}
                    className="pl-9 h-9 text-sm"
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {[
                  { en: "Customer Name", ar: "اسم العميل", id: "CustomerName", required: true },
                  { en: "GSM Number", ar: "رقم الجوال", id: "GSMNumber", required: true },
                  { en: "Email ID", ar: "البريد الإلكتروني", id: "EmailID" },
                  { en: "Alternate Contact", ar: "رقم بديل", id: "AlternateContactNumber" },
                ].map((field, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center gap-3">
                    <Label className="md:w-36 text-gray-600 font-medium text-xs">
                      {language === "AR" ? field.ar : field.en} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input 
                      id={field.id}
                      value={formData[field.id] || ""}
                      onChange={handleInputChange}
                      className="bg-white border-gray-200 h-9 text-sm" 
                      placeholder={language === "AR" ? field.ar : field.en} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        }
        return (
          <div className="flex flex-col gap-6 max-w-4xl">
             <div className="flex flex-col md:flex-row md:items-center gap-4">
                <Label className="md:w-48 text-gray-700 font-medium">
                  {language === "AR" ? "اسم العميل" : "Customer Name"} <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="CustomerName"
                  value={formData.CustomerName || ""}
                  onChange={handleInputChange}
                  className="bg-white" 
                  placeholder={language === "AR" ? "اسم العميل" : "Customer Name"} 
                />
              </div>
          </div>
        )

      default:
        return (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed rounded-lg">
            <p>{language === "AR" ? `محتوى ${tabs.find(t => t.id === tabId)?.labelAr}` : `${tabs.find(t => t.id === tabId)?.labelEn} content`}</p>
          </div>
        )
    }
  }

  const nextTab = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 animate-in fade-in slide-in-from-bottom-3 duration-700">
      <Card className="overflow-hidden border-none shadow-[0_15px_35px_rgba(0,0,0,0.07)] rounded-xl relative bg-white">
        {/* Modern Tabs - More compact */}
        <div className="flex overflow-x-auto no-scrollbar border-b bg-slate-50/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-[11px] font-semibold transition-all relative whitespace-nowrap tracking-wide uppercase ${
                activeTab === tab.id 
                  ? "text-red-600 bg-white" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-white/30"
              }`}
            >
              {language === "AR" ? tab.labelAr : tab.labelEn}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600" />
              )}
            </button>
          ))}
        </div>

        <CardContent className="p-6 sm:p-8 lg:p-10 min-h-[300px] relative pb-24">
          {renderTabContent(activeTab)}

          {/* Action Buttons */}
          <div className="absolute bottom-6 right-6 sm:right-8 lg:right-10 flex gap-4">
            <Button 
              className="bg-[#006A72] hover:bg-[#005a61] text-white px-8 py-4 h-auto rounded-md transition-all shadow-md text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              onClick={activeTab === tabs[tabs.length-1]?.id ? handleSubmit : nextTab}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {language === "AR" ? "استمرار" : (activeTab === tabs[tabs.length-1]?.id ? "SUBMIT" : "CONTINUE")}
            </Button>
          </div>
        </CardContent>

        {/* Branding Footer */}
        <div className="h-[4px] bg-[#1F4E58] w-full" />
      </Card>
    </div>
  )
}
