"use client"

import { useState } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AppointmentSlotCreation() {
  const { language } = useLanguage()

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 px-2 shadow-md bg-white">
        <div className="flex items-center gap-4 text-center sm:text-left h-12">
          <h1 className="text-2xl font-bold text-[#006A72]">
            {language === "EN" ? "Appointment Slot Creation" : "إنشاء فترات المواعيد"}
          </h1>
        </div>
        
        <div className="text-sm text-gray-500">
          <Link 
            href="/branchhome"
            className="font-semibold text-[#006A72] hover:underline cursor-pointer"
          >
            {language === "EN" ? "Home" : "الرئيسية"}
          </Link>
          <span> &gt; {language === "EN" ? "Appointment Slot Creation" : "إنشاء فترات المواعيد"}</span>
        </div>
      </div>

      <div className="px-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-gray-500 text-center py-8">
            {language === "EN" ? "Appointment slot creation will be implemented here" : "سيتم تنفيذ إنشاء فترات المواعيد هنا"}
          </p>
        </div>
      </div>
    </div>
  )
}

