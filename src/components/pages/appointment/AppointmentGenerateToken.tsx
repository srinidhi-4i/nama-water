"use client"

import { useState } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AppointmentGenerateToken() {
  const { language } = useLanguage()
  const [token, setToken] = useState<string>("")

  const handleGenerateToken = () => {
    // TODO: Implement token generation
    setToken("TOKEN-" + Math.random().toString(36).substr(2, 9))
  }

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 px-2 shadow-md bg-white">
        <div className="flex items-center gap-4 text-center sm:text-left h-12">
          <h1 className="text-2xl font-bold text-[#006A72]">
            {language === "EN" ? "Generate Token" : "إنشاء رمز"}
          </h1>
        </div>
        
        <div className="text-sm text-gray-500">
          <Link 
            href="/branchhome"
            className="font-semibold text-[#006A72] hover:underline cursor-pointer"
          >
            {language === "EN" ? "Home" : "الرئيسية"}
          </Link>
          <span> &gt; {language === "EN" ? "Generate Token" : "إنشاء رمز"}</span>
        </div>
      </div>

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

