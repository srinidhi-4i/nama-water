"use client"

import { useLanguage } from "@/components/providers/LanguageProvider"
import { CustomerInfo } from "@/types/branchops.types"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"

interface ProfileDataProps {
  data: CustomerInfo
  onBack: () => void
  onProceed: () => void
}

export function ProfileData({ data, onBack, onProceed }: ProfileDataProps) {
  const { language } = useLanguage()

  const ValidatedBadge = () => (
    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none flex items-center gap-1 font-normal italic py-0.5 px-2">
      <CheckCircle2 className="h-3 w-3" />
      Validated
    </Badge>
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
        {/* Full Name English */}
        <div className="space-y-0.5">
          <Label className="text-gray-400 text-xs font-normal">Full Name in English</Label>
          <p className="font-semibold text-[#1F4E58] text-[15px] uppercase leading-tight">
            {data.FullNameEn || "-"}
          </p>
        </div>

        {/* Full Name Arabic */}
        <div className="space-y-0.5">
          <Label className="text-gray-400 text-xs font-normal">Full Name in Arabic</Label>
          <p className="font-semibold text-[#1F4E58] text-lg text-right dir-rtl leading-tight">
            {data.FullNameAr || "-"}
          </p>
        </div>

        {/* National ID */}
        <div className="space-y-0.5">
          <Label className="text-gray-400 text-xs font-normal">National ID</Label>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[#1F4E58] text-base">
              {data.NationalID || data.CivilID || "-"}
            </p>
            <ValidatedBadge />
          </div>
        </div>

        {/* Expiry Date */}
        <div className="space-y-0.5">
          <Label className="text-gray-400 text-xs font-normal">Expiry Date</Label>
          <p className="font-semibold text-[#1F4E58] text-base">
            {data.ExpiryDate || "-"}
          </p>
        </div>

        {/* Cust Type */}
        <div className="space-y-0.5">
          <Label className="text-gray-400 text-xs font-normal">Cust Type</Label>
          <p className="font-semibold text-[#1F4E58] text-base">
            {data.CustomerType || "Individual"}
          </p>
        </div>

        <div className="hidden md:block"></div>

        {/* GSM Number */}
        <div className="space-y-1">
          <Label className="text-gray-400 text-xs font-normal">GSM Number</Label>
          <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-sm border border-gray-100 min-h-[44px]">
            <p className="font-semibold text-[#1F4E58] text-base">
              {data.MobileNumber || "-"}
            </p>
            <ValidatedBadge />
          </div>
        </div>

        {/* Email ID */}
        <div className="space-y-1">
          <Label className="text-gray-400 text-xs font-normal">Email ID</Label>
          <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-sm border border-gray-100 min-h-[44px]">
            <p className="font-semibold text-[#1F4E58] text-base truncate max-w-[200px]" title={data.EmailID}>
              {data.EmailID || "-"}
            </p>
            <ValidatedBadge />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="bg-[#D1D5DB] hover:bg-gray-300 text-gray-700 border-none px-6 font-semibold h-9 text-sm rounded-sm"
        >
          Back
        </Button>
        <div className="flex-1"></div>
        <Button 
          onClick={onProceed}
          className="bg-[#004A50] hover:bg-[#00383d] text-white px-10 font-semibold h-10 text-sm rounded-sm"
        >
          Proceed
        </Button>
      </div>
    </div>
  )
}
