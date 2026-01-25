"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { branchOpsService } from "@/services/branchops.service"
import { AccountPaymentDetails } from "@/types/branchops.types"
import { AccountPaymentResult } from "@/components/branchoperations/AccountPaymentResult"
import { Loader2 } from "lucide-react"
import PageHeader from "@/components/layout/PageHeader"
import { useLanguage } from "@/components/providers/LanguageProvider"

interface AccountPaymentPageProps {
  id: string
}

export default function AccountPaymentPage({ id }: AccountPaymentPageProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const [data, setData] = useState<AccountPaymentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const result = await branchOpsService.getAccountPaymentDetails(id)
        if (result) {
          setData(result)
        }
      } catch (error) {
        console.error("Failed to fetch payment details", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-100 min-h-screen">
        <PageHeader
          language={language}
          titleEn="Account Payment"
          titleAr="دفع الحساب"
          breadcrumbItems={[
            { labelEn: "Home", labelAr: "الرئيسية", href: "/branchhome" },
            { labelEn: "Search/Validate Customer", labelAr: "البحث/التحقق من العميل", href: "/branch-operations/validate" },
            { labelEn: "Account Payment", labelAr: "دفع الحساب" }
          ]}
        />
        <div className="flex items-center justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#006A72]" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex-1 bg-gray-100 min-h-screen">
        <PageHeader
          language={language}
          titleEn="Account Payment"
          titleAr="دفع الحساب"
          breadcrumbItems={[
            { labelEn: "Home", labelAr: "الرئيسية", href: "/branchhome" },
            { labelEn: "Search/Validate Customer", labelAr: "البحث/التحقق من العميل", href: "/branch-operations/validate" },
            { labelEn: "Account Payment", labelAr: "دفع الحساب" }
          ]}
        />
        <div className="p-10 text-center">
          <p className="text-red-500 font-medium">Account not found or invalid account number.</p>
          <button 
            onClick={() => router.push('/branch-operations/validate')}
            className="mt-4 text-[#006A72] underline"
          >
            Go back to Search
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gray-100 min-h-screen">
      <PageHeader
        language={language}
        titleEn="Account Payment"
        titleAr="دفع الحساب"
        breadcrumbEn="Account Payment"
        breadcrumbAr="دفع الحساب"
      />
      <div className="px-6 py-6 border-none">
        <AccountPaymentResult 
          data={data} 
          onBack={() => router.push('/branch-operations/validate')} 
        />
      </div>
    </div>
  )
}
