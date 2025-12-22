"use client"

import { useState } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function AppointmentWalkInSetup() {
  const { language } = useLanguage()
  const [isEnabled, setIsEnabled] = useState(false)

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 px-2 shadow-md bg-white">
        <div className="flex items-center gap-4 text-center sm:text-left h-12">
          <h1 className="text-2xl font-bold text-[#006A72]">
            {language === "EN" ? "Walk-in Setup" : "إعداد الدخول المباشر"}
          </h1>
        </div>
        
        <div className="text-sm text-gray-500">
          <Link 
            href="/branchhome"
            className="font-semibold text-[#006A72] hover:underline cursor-pointer"
          >
            {language === "EN" ? "Home" : "الرئيسية"}
          </Link>
          <span> &gt; {language === "EN" ? "Walk-in Setup" : "إعداد الدخول المباشر"}</span>
        </div>
      </div>

      <div className="px-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "EN" ? "Configure Walk-in Appointments" : "تكوين المواعيد المباشرة"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label>
                  {language === "EN" ? "Enable Walk-in Appointments" : "تفعيل المواعيد المباشرة"}
                </label>
                <Button
                  variant={isEnabled ? "default" : "outline"}
                  onClick={() => setIsEnabled(!isEnabled)}
                >
                  {isEnabled ? (language === "EN" ? "Enabled" : "مفعّل") : (language === "EN" ? "Disabled" : "معطّل")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

