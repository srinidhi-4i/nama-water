"use client"

import { useEffect, useState, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DataTable } from "@/components/ui/data-table"
import { getOTPLogColumns } from "./columns"
import { branchOpsService } from "@/services/branchops.service"
import { OTPLog } from "@/types/branchops.types"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import PageHeader from "@/components/layout/PageHeader"
import { useLanguage } from "@/components/providers/LanguageProvider"

function OTPLogContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { language } = useLanguage()
    const mobile = searchParams.get("mobile") || ""
    
    const [data, setData] = useState<OTPLog[]>([])
    const [isLoading, setIsLoading] = useState(false)
    
    const columns = useMemo(() => getOTPLogColumns(), [])

    useEffect(() => {
        if (mobile) {
            fetchData()
        }
    }, [mobile])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const logs = await branchOpsService.getOtpLog(mobile)
            setData(logs)
        } catch (error) {
            console.error("Failed to fetch OTP logs", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex-1 bg-gray-50 min-h-screen">
            <PageHeader 
                language={language}
                titleEn="OTP Log of Customer"
                titleAr="سجل رمز التحقق للعميل"
                breadcrumbEn="OTP Log"
                breadcrumbAr="سجل رمز التحقق"
            />
            
            <div className="px-6 py-4">
                <Button 
                    variant="ghost" 
                    onClick={() => router.back()}
                    className="mb-4 text-[#006A72] hover:text-[#005a61] px-2"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {language === "EN" ? "Back" : "العودة"}
                </Button>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-[#1F4E58]">
                            {language === "EN" ? "OTP Log of Customer" : "سجل رمز التحقق للعميل"}
                        </h2>
                    </div>
                    
                    <DataTable 
                        columns={columns} 
                        data={data} 
                        isLoading={isLoading}
                        emptyMessage={language === "EN" ? "No OTP logs found for this number" : "لم يتم العثور على سجلات لهذا الرقم"}
                    />
                </div>
            </div>
        </div>
    )
}

export default function OTPLogPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <OTPLogContent />
        </Suspense>
    )
}
