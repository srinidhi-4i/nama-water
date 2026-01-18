"use client"

import { useLanguage } from "@/components/providers/LanguageProvider"
import { ROPUserDetails } from "@/types/branchops.types"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface ProfileDataROPProps {
  data: ROPUserDetails
  onBack: () => void
  onProceed: () => void
}

export function ProfileDataROP({ data, onBack, onProceed }: ProfileDataROPProps) {
  const { language } = useLanguage()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
        {/* Full Name English */}
        <div className="space-y-1">
          <Label className="text-gray-500 font-normal">Full Name (English)</Label>
          <p className="font-semibold text-[#1F4E58] text-lg uppercase">
            {data.FullNameEn || "-"}
          </p>
        </div>

        {/* Full Name Arabic */}
        <div className="space-y-1">
          <Label className="text-gray-500 font-normal">Full Name (Arabic)</Label>
          <p className="font-semibold text-[#1F4E58] text-lg text-right dir-rtl">
            {data.FullNameAr || "-"}
          </p>
        </div>

        {/* Civil ID */}
        <div className="space-y-1">
          <Label className="text-gray-500 font-normal">Civil ID</Label>
          <p className="font-semibold text-[#1F4E58] text-lg">
            {data.NationalIDOrCivilID || "-"}
          </p>
        </div>

        {/* Expiry Date */}
        <div className="space-y-1">
          <Label className="text-gray-500 font-normal">Expiry Date</Label>
          <p className="font-semibold text-[#1F4E58] text-lg">
            {data.ExpiryDate || "-"}
          </p>
        </div>

        {/* GSM Number */}
        <div className="space-y-1">
          <Label className="text-gray-500 font-normal">GSM Number</Label>
          <p className="font-semibold text-[#1F4E58] text-lg">
            {data.GsmNumber || "-"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-6">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 border-none px-8 font-semibold h-11"
        >
          Back
        </Button>
        <div className="flex-1"></div>
        <Button 
          onClick={onProceed}
          className="bg-[#004A50] hover:bg-[#00383d] text-white px-12 font-semibold h-11"
        >
          Proceed
        </Button>
      </div>
    </div>
  )
}
