"use client"

import React, { useEffect, useState } from "react"
import { 
  AlertCircle, 
  Loader2,
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { menuService, GUEST_BRANCH_SERVICE_URLS } from "@/services/menu.service"
import { GuestService, GuestServiceGroup } from "@/types/branchops.types"
import { useLanguage } from "@/components/providers/LanguageProvider"

// Icon mapping based on English names from the reference image
// Icon mapping based on UAT assets from e-poral-paw
const getIconForServiceName = (name: string): string => {
  const n = name.toLowerCase()
  if (n.includes("leak")) return "/Assets/Images/global/water_leakage.png"
  if (n.includes("vehicle") || n.includes("company")) return "/Assets/Images/TankerServices.png"
  if (n.includes("contractor")) return "/Assets/Images/global/raise_a_complaint.png"
  if (n.includes("quality")) return "/Assets/Images/WaterRequests.png"
  if (n.includes("pressure") || n.includes("network")) return "/Assets/Images/meter_number.png"
  if (n.includes("wastewater")) return "/Assets/Images/WastewaterRequests.png"
  if (n.includes("overflow")) return "/Assets/Images/waterOverflow.png"
  if (n.includes("odor") || n.includes("odour") || n.includes("sewer")) return "/Assets/Images/Odour.svg"
  return "/Assets/Images/icon-new.png"
}

export const GuestUserServices: React.FC = () => {
  const { language } = useLanguage()
  const [serviceGroups, setServiceGroups] = useState<GuestServiceGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadServices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const lang = language || "EN"
      
      // Call both APIs
      const [rawMenuData, commonData] = await Promise.all([
        menuService.getMenuData(lang),
        menuService.getCommonData()
      ])
      
      // Transform raw menu data
      const menuData = menuService.transformMenuItems(rawMenuData) || [];

      // Unified base list of 8 services in exact UAT order with embedded icon paths
      const requiredServices = [
        { 
          name: "Report on Water Leaking", 
          url: "ReportWaterLeakingBop", 
          ar: "الإبلاغ عن تسرب المياه", 
          icon: "/Assets/Images/water_leakage.png"
        },
        { 
          name: "Report on Company Vehicles", 
          url: "ReportCompanyVehiclesBop", 
          ar: "شكاوى مركبات الشركة", 
          icon: "/Assets/Images/TankerServices.png"
        },
        { 
          name: "Report on Contractor Work", 
          url: "ContractorWorkComplaintBranch", 
          ar: "الإبلاغ عن أعمال المقاول", 
          icon: "/Assets/Images/global/raise_a_complaint.png"
        },
        { 
          name: "Report on Water Quality", 
          url: "ReportQualityBop", 
          ar: "الإبلاغ عن جودة المياه", 
          icon: "/Assets/Images/WaterRequests.png"
        },
        { 
          name: "Report on Low, High or No pressure in network", 
          url: "ReportHighPressure", 
          ar: "الإبلاغ عن ضغط منخفض/مرتفع", 
          icon: "/Assets/Images/meter_number.png"
        },
        { 
          name: "Report on Wastewater Services", 
          url: "WastewaterServiceBranch", 
          ar: "الإبلاغ عن خدمات مياه الصرف الصحي", 
          icon: "/Assets/Images/WastewaterRequests.png"
        },
        { 
          name: "Report a water overflow", 
          url: "WaterOverflowBranch", 
          ar: "الإبلاغ عن فيضان المياه", 
          icon: "/Assets/Images/waterOverflow.png"
        },
        { 
          name: "Sewer Odour Complaint", 
          url: "SewerOdorComplaintBranch", 
          ar: "شكوى رائحة الصرف الصحي", 
          icon: "/Assets/Images/Odour.svg"
        }
      ];

      // Map API data back to this base list if found, otherwise use fallback
      const finalServices: GuestService[] = requiredServices.map((req, index) => {
        const apiService = menuData.find((m: any) => {
          const url = (m.BracnhServiceURL || m.BranchServiceURL || m.branchServiceURL || m.Target_Url || m.targetUrl || m.MenuURL || m.MenuUrl || "").toString();
          return url.includes(req.url) || (m.Menu_Name_EN && m.Menu_Name_EN.toLowerCase().includes(req.name.toLowerCase()));
        });

        return {
          MenuId: typeof apiService?.MenuId === 'number' ? apiService.MenuId : index + 10000,
          Module_Name: req.name,
          Module_Name_Arabic: req.ar,
          Menu_Icon: req.icon,
          Target_Url: req.url,
          BracnhServiceURL: req.url, 
          BranchServiceURL: req.url,
          BranchServiceEnablementFlag: (apiService as any)?.BranchServiceEnablementFlag !== undefined ? (apiService as any).BranchServiceEnablementFlag : 1,
          order: index
        };
      });

      console.log("Final services count:", finalServices.length);
      console.log("Final services:", finalServices.map(s => ({ name: s.Module_Name, icon: s.Menu_Icon, enabled: s.BranchServiceEnablementFlag })));

      setServiceGroups([{
        title: "Raise Complaint", 
        titleAr: "تقديم شكوى",
        icon: "/Assets/Images/icon__raise_a_complaint.png",
        services: finalServices
      }])

    } catch (error) {
      console.error("Error loading guest services:", error)
      setError("Failed to load services. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [language])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#D92D20]" />
        <p className="text-gray-500">Loading guest services...</p>
      </div>
    )
  }

  if (serviceGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
        <p>No guest user services available.</p>
        <button 
          onClick={loadServices}
          className="mt-4 px-4 py-2 text-sm text-[#D92D20] hover:underline"
        >
          Try refreshing
        </button>
      </div>
    )
  }

  // Get the first (and only) group for "Raise Complaint" - matching reference screenshot
  const group = serviceGroups[0]

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
        <p>No guest user services available.</p>
        <button 
          onClick={loadServices}
          className="mt-4 px-4 py-2 text-sm text-[#D92D20] hover:underline"
        >
          Try refreshing
        </button>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto animate-in fade-in duration-700">
      
      <Card className="overflow-hidden border-none shadow-[0_20px_40px_rgba(0,0,0,0.08)] rounded-xl bg-white/50 backdrop-blur-sm">
        {/* Card Header - Compact Premium Look */}
        <div className="bg-white border-b border-slate-100 flex items-center gap-4 p-4">
          <div className="p-2.5 bg-[#D92D20]/10 rounded-xl">
            <img 
              src="/Assets/Images/icon__raise_a_complaint.png" 
              alt="" 
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1F4E58] tracking-tight">
              {language === "AR" ? group.titleAr : group.title}
            </h2>
            <p className="text-gray-400 text-[10px] uppercase tracking-[0.15em] font-medium">
              {language === "AR" ? "الرجاء اختيار الخدمة المطلوبة" : "Select required service"}
            </p>
          </div>
        </div>
        
        {/* Card Body - Refined compact list */}
        <CardContent className="p-0 bg-white">
          <ul className="flex flex-col">
            {group.services.map((service, sIdx) => {
              const iconPath = service.Menu_Icon
              const isDisabled = service.BranchServiceEnablementFlag === 0
              const serviceUrl = service.BracnhServiceURL || service.Target_Url || "#"
              const serviceName = language === "AR" ? service.Module_Name_Arabic : service.Module_Name

              return (
                <li 
                  key={`${service.MenuId}-${sIdx}`} 
                  className={`group border-b border-slate-50 last:border-b-0 transition-all duration-300 ${
                    isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50/80 cursor-pointer'
                  }`}
                >
                  {isDisabled ? (
                    <div className="w-full flex items-center gap-5 px-6 py-3.5 text-left transition-all">
                      <div className="p-1 flex-shrink-0">
                        <img 
                          src={iconPath} 
                          alt="" 
                          className="w-6 h-6 object-contain filter grayscale" 
                        />
                      </div>
                      <span className="text-gray-400 text-sm font-medium flex-1 tracking-tight">{serviceName}</span>
                    </div>
                  ) : (
                    <Link 
                      href={`/branch-operations/guest/${serviceUrl}`}
                      className="w-full flex items-center px-6 py-3.5 text-left transition-all"
                    >
                      <div className="p-1 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                        <img 
                          src={iconPath} 
                          alt="" 
                          className="w-6 h-6 object-contain" 
                        />
                      </div>
                      <span className="text-[#344054] text-sm font-semibold flex-1 group-hover:text-[#006A72] transition-colors tracking-tight ml-4">
                        {serviceName}
                      </span>
                      <div className="flex items-center gap-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        <span className="text-[9px] font-bold text-[#D92D20] tracking-tighter uppercase">{language === "AR" ? "فتح" : "OPEN"}</span>
                        <ChevronRight className="w-4 h-4 text-[#D92D20]" />
                      </div>
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
      
      
    </div>
  )
}
