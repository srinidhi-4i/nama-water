"use client"

import React from "react"
import { useParams } from "next/navigation"
import { GuestServiceForm, FormTab } from "@/components/branchoperations/GuestServiceForm"
import { WaterLeakageForm } from "@/components/branchoperations/WaterLeakageForm"

const SERVICE_CONFIGS: Record<string, { en: string; ar: string; tabs: FormTab[]; layout?: "simple" | "account-search" }> = {
  "ReportWaterLeakingBop": { 
    en: "Report on Water Leaking", 
    ar: "الإبلاغ عن تسرب المياه",
    tabs: [
      { id: "contact", labelEn: "Contact Details", labelAr: "تفاصيل الاتصال" },
      { id: "premise", labelEn: "Premise Details", labelAr: "تفاصيل المبنى" },
      { id: "attachment", labelEn: "Attachment & Leakage Details", labelAr: "المرفقات وتفاصيل التسرب" },
    ]
  },
  "ReportCompanyVehiclesBop": { 
    en: "Report on Company Vehicles", 
    ar: "شكاوى مركبات الشركة",
    tabs: [
      { id: "contact", labelEn: "Contact Details", labelAr: "تفاصيل الاتصال" },
      { id: "location", labelEn: "Location Details", labelAr: "تفاصيل الموقع" },
      { id: "attachment", labelEn: "Attachment & Case Details", labelAr: "المرفقات وتفاصيل الحالة" },
    ]
  },
  "VehicleComplaintsBranch": { 
    en: "Report on Company Vehicles", 
    ar: "شكاوى مركبات الشركة",
    tabs: [
      { id: "contact", labelEn: "Contact Details", labelAr: "تفاصيل الاتصال" },
      { id: "location", labelEn: "Location Details", labelAr: "تفاصيل الموقع" },
      { id: "attachment", labelEn: "Attachment & Case Details", labelAr: "المرفقات وتفاصيل الحالة" },
    ]
  },
  "ReportHighPressure": { 
    en: "Report on Low, High or No pressure in network", 
    ar: "الإبلاغ عن ضغط منخفض/مرتفع",
    tabs: [
      { id: "contact", labelEn: "Contact Details", labelAr: "تفاصيل الاتصال" },
      { id: "customer", labelEn: "Customer Details", labelAr: "تفاصيل العميل" },
    ]
  },
  "WastewaterServiceBranch": { 
    en: "Report on Wastewater Services", 
    ar: "الإبلاغ عن خدمات مياه الصرف الصحي",
    layout: "account-search",
    tabs: [
      { id: "customer", labelEn: "Customer Details", labelAr: "تفاصيل العميل" },
      { id: "property", labelEn: "Property Details", labelAr: "تفاصيل العقار" },
      { id: "complaint", labelEn: "Complaint Details", labelAr: "تفاصيل الشكوى" },
    ]
  },
  "WaterOverflowBranch": { 
    en: "Report a water overflow", 
    ar: "الإبلاغ عن فيضان المياه",
    layout: "account-search",
    tabs: [
      { id: "customer", labelEn: "Customer Details", labelAr: "تفاصيل العميل" },
      { id: "property", labelEn: "Property Details", labelAr: "تفاصيل العقار" },
      { id: "complaint", labelEn: "Complaint Details", labelAr: "تفاصيل الشكوى" },
    ]
  },
  "SewerOdorComplaintBranch": { 
    en: "Sewer Odor Complaint", 
    ar: "شكوى رائحة الصرف الصحي",
    layout: "account-search",
    tabs: [
      { id: "customer", labelEn: "Customer Details", labelAr: "تفاصيل العميل" },
      { id: "property", labelEn: "Property Details", labelAr: "تفاصيل العقار" },
      { id: "complaint", labelEn: "Complaint Details", labelAr: "تفاصيل الشكوى" },
    ]
  },
  "ReportQualityBop": { 
    en: "Report on Water Quality", 
    ar: "الإبلاغ عن جودة المياه",
    tabs: [
      { id: "contact", labelEn: "Contact Details", labelAr: "تفاصيل الاتصال" },
      { id: "customer", labelEn: "Customer Details", labelAr: "تفاصيل العميل" },
    ]
  },
  "ContractorWorkComplaintBranch": { 
    en: "Report on Contractor Work", 
    ar: "الإبلاغ عن أعمال المقاول",
    tabs: [
      { id: "contact", labelEn: "Contact Details", labelAr: "تفاصيل الاتصال" },
      { id: "customer", labelEn: "Customer Details", labelAr: "تفاصيل العميل" },
    ]
  },
}

export default function GuestServicePage() {
  const params = useParams()
  const serviceId = params?.serviceId as string
  
  // Use dedicated Water Leakage form for this service
  if (serviceId === "ReportWaterLeakingBop") {
    return (
      <WaterLeakageForm 
        titleEn="REPORT A WATER LEAKAGE"
        titleAr="الإبلاغ عن تسرب المياه"
        serviceId={serviceId}
      />
    )
  }
  
  const config = SERVICE_CONFIGS[serviceId] || { 
    en: serviceId ? serviceId.replace(/([A-Z])/g, ' $1').trim() : "Service Request", 
    ar: "طلب خدمة",
    tabs: [{ id: "contact", labelEn: "Contact Details", labelAr: "تفاصيل الاتصال" }]
  }

  return (
    <div className="bg-slate-50 min-h-screen py-4">
      <GuestServiceForm 
        titleEn={config.en} 
        titleAr={config.ar} 
        tabs={config.tabs}
        layout={config.layout}
        serviceId={serviceId}
      />
    </div>
  )
}
