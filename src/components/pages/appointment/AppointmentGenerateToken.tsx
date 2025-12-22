"use client"

import { useState } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import PageHeader from "@/components/layout/PageHeader"

export default function AppointmentGenerateToken() {
  const { language } = useLanguage()
  const [token, setToken] = useState<string>("")

  const handleGenerateToken = () => {
    // TODO: Implement token generation
    setToken("TOKEN-" + Math.random().toString(36).substr(2, 9))
  }

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
      <PageHeader
        language={language}
        titleEn="Generate Appointment Token"
        titleAr="إنشاء رمز الموعد"
        breadcrumbEn="Generate Appointment Token"
        breadcrumbAr="إنشاء رمز الموعد"
      />

      <div className="px-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "EN" ? "Generate Appointment Token" : "إنشاء رمز الموعد"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder={language === "EN" ? "Generated token will appear here" : "سيظهر الرمز المُنشأ هنا"}
                  value={token}
                  readOnly
                />
              </div>
              <Button onClick={handleGenerateToken} className="w-full">
                {language === "EN" ? "Generate Token" : "إنشاء رمز"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

