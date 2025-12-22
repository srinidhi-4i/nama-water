"use client"

import { useState } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PageHeader from "@/components/layout/PageHeader"


export default function AppointmentWalkInSetup() {
  const { language } = useLanguage()
  const [isEnabled, setIsEnabled] = useState(false)

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
      <PageHeader
        language={language}
        titleEn="Walk-in Setup"
        titleAr="إعداد الدخول المباشر"
        breadcrumbEn="Walk-in Setup"
        breadcrumbAr="إعداد الدخول المباشر"
      />
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

