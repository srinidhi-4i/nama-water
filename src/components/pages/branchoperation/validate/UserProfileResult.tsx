"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { branchOpsService } from "@/services/branchops.service"
import { ProfileData } from "@/components/branchoperations/ProfileData"
import { Loader2 } from "lucide-react"
import PageHeader from "@/components/layout/PageHeader"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { toast } from "sonner"

interface UserProfileResultProps {
  type: string
  id: string
}

export default function UserProfileResult({ type, id }: UserProfileResultProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const result = await branchOpsService.validateUser(type, id)
        if (result.success) {
          setData(result.data)
        } else {
          // Check if it's a "user not found" case (status 606)
          if (result.statusCode === 606 || result.message?.toLowerCase().includes('not found')) {
            // Redirect back to validate page with modal trigger
            const params = new URLSearchParams()
            params.append('showNotFound', 'true')
            params.append('type', type)
            params.append('value', id)
            router.push(`/branch-operations/validate?${params.toString()}`)
          } else {
            toast.error(result.message || "User not found")
          }
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error)
        toast.error("An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    if (type && id) {
      fetchData()
    }
  }, [type, id, router])

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-100 min-h-screen">
        <PageHeader
          language={language}
          titleEn="User Profile"
          titleAr="ملف المستخدم"
          breadcrumbEn="Profile"
          breadcrumbAr="الملف الشخصي"
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
          titleEn="User Profile"
          titleAr="ملف المستخدم"
          breadcrumbEn="Profile"
          breadcrumbAr="الملف الشخصي"
        />
        <div className="p-10 text-center">
          <p className="text-red-500 font-medium">User profile not found.</p>
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
        titleEn="Customer Profile"
        titleAr="ملف العميل"
        breadcrumbItems={[
          { labelEn: "Home", labelAr: "الرئيسية", href: "/branchhome" },
          { labelEn: "Search/Validate Customer", labelAr: "البحث/التحقق من العميل", href: "/branch-operations/validate" },
          { labelEn: "Profile", labelAr: "الملف الشخصي" }
        ]}
      />
      <div className="px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <ProfileData 
            data={data} 
            onBack={() => router.push('/branch-operations/validate')}
            onProceed={() => {
              toast.success("Proceeding with customer...")
            }}
          />
        </div>
      </div>
    </div>
  )
}
