"use client"

import React, { useState } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import PageHeader from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Settings2, 
  Smartphone,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  Users,
  Info
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function AppointmentWalkInSetup() {
  const { language } = useLanguage()
  const [isEnabled, setIsEnabled] = useState(true)
  const [maxWalkIns, setMaxWalkIns] = useState("10")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
        setIsSaving(false)
        toast.success(language === "EN" ? "Settings saved successfully" : "تم حفظ الإعدادات بنجاح")
    }, 1000)
  }

  // Custom Toggle component to avoid missing Switch
  const CustomToggle = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
    <button 
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-teal-600" : "bg-slate-200"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
          checked ? (language === "EN" ? "translate-x-5" : "-translate-x-5") : "translate-x-0"
        )}
      />
    </button>
  )

  return (
    <div className="flex-1 bg-[#F8FAFC] overflow-x-hidden pb-8 min-h-screen">
      <PageHeader
        language={language}
        titleEn="Walk-in Setup"
        titleAr="إعداد الدخول المباشر"
        breadcrumbEn="Walk-in Setup"
        breadcrumbAr="إعداد الدخول المباشر"
      />

      <div className="max-w-4xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <Card className="border-none shadow-xl shadow-teal-900/5 bg-white overflow-hidden rounded-[2.5rem]">
            <CardHeader className="p-10 bg-slate-50 border-b border-slate-100">
               <div className="flex items-center justify-between">
                  <div className="space-y-2">
                     <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <div className="bg-teal-100 p-2 rounded-xl">
                            <Settings2 className="h-6 w-6 text-teal-600" />
                        </div>
                        {language === "EN" ? "Global Configuration" : "التكوين العام"}
                     </CardTitle>
                     <CardDescription className="text-slate-500 text-base">
                        {language === "EN" ? "Enable or disable walk-in appointments across all branches." : "تمكين أو تعطيل المواعيد المباشرة في جميع الفروع."}
                     </CardDescription>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                     <Label className="font-black text-slate-600 mr-2 uppercase tracking-widest text-[10px]">
                        {isEnabled ? (language === "EN" ? "Activated" : "مفعل") : (language === "EN" ? "Deactivated" : "تعطيل")}
                     </Label>
                     <CustomToggle checked={isEnabled} onChange={setIsEnabled} />
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-10 space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{language === "EN" ? "Max Walk-ins Per Slot" : "أقصى عدد للدخول المباشر لكل فترة"}</Label>
                        <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            <Input 
                                type="number" 
                                value={maxWalkIns}
                                onChange={(e) => setMaxWalkIns(e.target.value)}
                                className="h-14 pl-12 bg-slate-50 border-none rounded-xl focus:ring-teal-500 focus:bg-white transition-all font-bold" 
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{language === "EN" ? "This overrides the individual branch settings unless specified otherwise." : "هذا يتجاوز إعدادات الفرع الفردي ما لم ينص على خلاف ذلك."}</p>
                     </div>

                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{language === "EN" ? "Buffer Time (Minutes)" : "الوقت الاحتياطي (بالدقائق)"}</Label>
                        <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            <Input 
                                type="number" 
                                defaultValue="5"
                                className="h-14 pl-12 bg-slate-50 border-none rounded-xl focus:ring-teal-500 focus:bg-white transition-all font-bold" 
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{language === "EN" ? "Gap between walk-in and booked appointments." : "الفجوة بين المواعيد المباشرة والمحجوزة."}</p>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="bg-teal-50 border border-teal-100 rounded-[2rem] p-8 space-y-4">
                        <div className="h-10 w-10 bg-teal-600 rounded-xl flex items-center justify-center">
                           <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="font-black text-teal-900">{language === "EN" ? "Priority Rules" : "قواعد الأولوية"}</h4>
                        <div className="space-y-3">
                           {[
                              language === "EN" ? "Prioritize booked appointments" : "إعطاء الأولوية للمواعيد المحجوزة",
                              language === "EN" ? "Auto-assign to next available counter" : "التعيين التلقائي للعداد المتاح التالي",
                              language === "EN" ? "Send SMS notification on arrival" : "إرسال إشعار SMS عند الوصول"
                           ].map((item, i) => (
                              <div key={i} className="flex items-center gap-3">
                                 <CheckCircle2 className="h-4 w-4 text-teal-500" />
                                 <span className="text-xs font-bold text-teal-800/70">{item}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FeatureToggle 
                    language={language}
                     icon={<Zap className="h-5 w-5 text-amber-500" />}
                     titleEn="Fast Track"
                     titleAr="المسار السريع"
                     descEn="Enable priority for elderly/VIP"
                     descAr="تمكين الأولوية لكبار السن / كبار الشخصيات"
                     checked={true}
                     onChange={() => {}}
                  />
                  <FeatureToggle 
                     language={language}
                     icon={<Smartphone className="h-5 w-5 text-blue-500" />}
                     titleEn="Mobile QR"
                     titleAr="رمز QR للجوال"
                     descEn="Generate QR for walk-in tickets"
                     descAr="توليد رمز QR لتذاكر الدخول المباشر"
                     checked={true}
                     onChange={() => {}}
                  />
                  <FeatureToggle 
                    language={language}
                     icon={<Info className="h-5 w-5 text-slate-500" />}
                     titleEn="Wait Time"
                     titleAr="وقت الانتظار"
                     descEn="Display ETA on branch screens"
                     descAr="عرض الوقت المتوقع على شاشات الفرع"
                     checked={false}
                     onChange={() => {}}
                  />
               </div>

               <div className="flex justify-end pt-4">
                  <Button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="h-14 px-12 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-lg shadow-xl shadow-teal-900/10 transition-all active:scale-95"
                  >
                    {isSaving ? (language === "EN" ? "Saving..." : "جاري الحفظ...") : (language === "EN" ? "Save Changes" : "حفظ التغييرات")}
                  </Button>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}

function FeatureToggle({ icon, titleEn, titleAr, descEn, descAr, checked, language, onChange }: any) {
    const CustomToggle = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
        <button 
          onClick={() => onChange(!checked)}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "bg-teal-600" : "bg-slate-200"
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
              checked ? (language === "EN" ? "translate-x-4" : "-translate-x-4") : "translate-x-0"
            )}
          />
        </button>
      )

    return (
        <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between gap-4">
            <div className="space-y-3">
                <div className="p-3 bg-white rounded-xl w-fit shadow-sm border border-slate-100">
                    {icon}
                </div>
                <div className="space-y-1">
                    <p className="font-bold text-slate-800 text-sm">{language === "EN" ? titleEn : titleAr}</p>
                    <p className="text-[10px] text-slate-400 font-medium leading-tight">{language === "EN" ? descEn : descAr}</p>
                </div>
            </div>
            <div className="flex justify-end">
                <CustomToggle checked={checked} onChange={onChange} />
            </div>
        </div>
    )
}
