"use client"

import { useLanguage } from "@/components/providers/LanguageProvider"
import { GuestUserServices } from "@/components/branchoperations/GuestUserServices"
import Link from "next/link"

export default function GuestUserServicesPage() {
  const { language } = useLanguage()

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden">
      {/* Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 px-2 shadow-md bg-white">
        <div className="flex items-center gap-4 text-center sm:text-left h-12 px-4">
        <h1 className="text-2xl font-bold text-[#006A72]">
            {language === "EN" ? "Guest User Services" : "خدمات المستخدم الضيف"}
          </h1>
        </div>
            
        <div className="text-sm text-gray-500 px-6">
          <Link 
            href="/branchhome"
            className="font-semibold text-[#006A72] hover:underline cursor-pointer"
          >
             {language === "EN" ? "Home" : "الرئيسية"}
          </Link>
          <span> &gt; {language === "EN" ? "Guest User Services" : "خدمات المستخدم الضيف"}</span>
        </div>
      </div>

      <div className="px-6 py-4">
        <GuestUserServices />
      </div>
    </div>
  )
}
