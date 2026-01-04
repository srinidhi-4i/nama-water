"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { ArrowLeft, Search } from "lucide-react"

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
}

export function GuestServiceForm({ titleEn, titleAr, tabs, layout = "simple" }: GuestServiceFormProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "contact")
  
  const title = language === "AR" ? titleAr : titleEn

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
                id="contactName" 
                placeholder={language === "AR" ? "اسم الشخص المسؤول" : "Person Name"}
                className="bg-white border-gray-200 h-9 text-sm"
              />
            </div>

            <div className="space-y-1 flex flex-col md:flex-row md:items-center gap-3">
              <Label htmlFor="gsm" className="md:w-40 text-gray-700 font-medium whitespace-nowrap text-sm">
                {language === "AR" ? "رقم الهاتف" : "GSM Number"} <span className="text-red-500">*</span>
              </Label>
              <div className="flex w-full">
                <div className="bg-slate-50 border border-r-0 border-gray-200 px-2 py-1.5 text-gray-500 text-xs flex items-center rounded-l-md">
                  +968
                </div>
                <Input 
                  id="gsm" 
                  placeholder={language === "AR" ? "رقم الهاتف" : "GSM Number"}
                  className="bg-white border-gray-200 rounded-l-none h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1 flex flex-col md:flex-row md:items-center gap-3">
              <Label htmlFor="email" className="md:w-40 text-gray-700 font-medium whitespace-nowrap text-sm">
                {language === "AR" ? "البريد الإلكتروني" : "Email ID"}
              </Label>
              <Input 
                id="email" 
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
                    placeholder={language === "AR" ? "بحث" : "Search"}
                    className="pl-9 h-9 text-sm"
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {[
                  { en: "Customer Name", ar: "اسم العميل", required: true },
                  { en: "Contact Name", ar: "اسم جهة الاتصال" },
                  { en: "GSM Number", ar: "رقم الجوال", required: true },
                  { en: "Contact Number", ar: "رقم الاتصال" },
                  { en: "Email ID", ar: "البريد الإلكتروني" },
                  { en: "Contact Email ID", ar: "بريد جهة الاتصال" },
                ].map((field, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center gap-3">
                    <Label className="md:w-36 text-gray-600 font-medium text-xs">
                      {language === "AR" ? field.ar : field.en} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input className="bg-white border-gray-200 h-9 text-sm" placeholder={language === "AR" ? field.ar : field.en} />
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
                <Input className="bg-white" placeholder={language === "AR" ? "اسم العميل" : "Customer Name"} />
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
      {/* Breadcrumb-style Header */}
      <div className="flex items-center gap-2 mb-4 text-gray-500 text-[10px]">
        <button 
          onClick={() => router.back()}
          className="hover:text-red-600 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          {language === "AR" ? "رجوع" : "BACK"}
        </button>
        <span className="text-gray-300">|</span>
        <h1 className="text-sm font-semibold text-[#1F4E58] tracking-tight uppercase">
          {title}
        </h1>
      </div>

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
              onClick={nextTab}
            >
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
