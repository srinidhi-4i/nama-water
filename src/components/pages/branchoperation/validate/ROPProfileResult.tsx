"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { branchOpsService } from "@/services/branchops.service"
import { ProfileDataROP } from "@/components/branchoperations/ProfileDataROP"
import { Loader2 } from "lucide-react"
import PageHeader from "@/components/layout/PageHeader"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { toast } from "sonner"

interface ROPProfileResultProps {
  civilId: string
  expiryDate: string
}

export default function ROPProfileResult({ civilId, expiryDate }: ROPProfileResultProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const result = await branchOpsService.getROPUserDetails(civilId, expiryDate)
        if (result.success) {
          setData(result.data)
        } else {
          toast.error(result.message || "ROP user details not found")
        }
      } catch (error) {
        console.error("Failed to fetch ROP profile", error)
        toast.error("An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    if (civilId && expiryDate) {
      fetchData()
    }
  }, [civilId, expiryDate])

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-100 min-h-screen">
        <PageHeader
          language={language}
          titleEn="ROP Profile"
          titleAr="ملف ROP"
          breadcrumbItems={[
            { labelEn: "Home", labelAr: "الرئيسية", href: "/branchhome" },
            { labelEn: "Validate Customer", labelAr: "التحقق من العميل", href: "/branch-operations/validate" },
            { labelEn: "Profile", labelAr: "الملف الشخصي" }
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
          titleEn="ROP Profile"
          titleAr="ملف ROP"
          breadcrumbItems={[
            { labelEn: "Home", labelAr: "الرئيسية", href: "/branchhome" },
            { labelEn: "Validate Customer", labelAr: "التحقق من العميل", href: "/branch-operations/validate" },
            { labelEn: "Profile", labelAr: "الملف الشخصي" }
          ]}
        />
        <div className="p-10 text-center">
          <p className="text-red-500 font-medium">ROP profile details not found.</p>
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
        titleEn="ROP Profile"
        titleAr="ملف ROP"
        breadcrumbEn="Profile"
        breadcrumbAr="الملف الشخصي"
      />
      <div className="px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <ProfileDataROP 
            data={data} 
            onBack={() => router.push('/branch-operations/validate')}
            onProceed={() => {
              toast.success("Proceeding with ROP customer...")
            }}
          />
        </div>
      </div>
    </div>
  )
}
