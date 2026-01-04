"use client"

import React, { useEffect, useState } from "react"
import { 
  AlertCircle, 
  Droplet, 
  Truck, 
  HardHat, 
  FlaskConical, 
  Gauge, 
  Waves, 
  Wind,
  LucideIcon,
  Loader2,
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { menuService, GUEST_BRANCH_SERVICE_URLS } from "@/services/menu.service"
import { GuestService, GuestServiceGroup } from "@/types/branchops.types"
import { useLanguage } from "@/components/providers/LanguageProvider"

// Icon mapping based on English names from the reference image
const getIconForServiceName = (name: string): LucideIcon => {
  const n = name.toLowerCase()
  if (n.includes("leak")) return Droplet // Report on Water Leaking
  if (n.includes("vehicle") || n.includes("company")) return Truck // Report on Company Vehicles
  if (n.includes("contractor")) return HardHat // Report on Contractor Work
  if (n.includes("quality")) return FlaskConical // Report on Water Quality
  if (n.includes("pressure") || n.includes("network")) return Gauge // Pressure issues
  if (n.includes("wastewater")) return Waves // Wastewater
  if (n.includes("overflow")) return Droplet // Water overflow
  if (n.includes("odor") || n.includes("sewer")) return Wind // Sewer Odor
  return AlertCircle // Default icon
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
      setServiceGroups([])
      
      const lang = language || "EN"
      
      // Call both APIs
      const [rawMenuData, commonData] = await Promise.all([
        menuService.getMenuData(lang),
        menuService.getCommonData()
      ])
      
      console.log("GuestUserServices: rawMenuData received:", rawMenuData);
      console.log("GuestUserServices: commonData received:", commonData);

      // Transform raw menu data
      const menuData = menuService.transformMenuItems(rawMenuData);
      console.log("GuestUserServices: transformed menuData:", menuData);

      if (!menuData || menuData.length === 0) {
        console.warn("GuestUserServices: menuData is empty after transform");
        setServiceGroups([])
        return
      }

      // Deduplicate menuData by MenuId to avoid duplicate key errors
      const uniqueMenuData = Array.from(new Map(menuData.map(item => [item.MenuId, item])).values());

      // Step 1: Find "Guest User Service" parent menu
      const parentMenu: any = uniqueMenuData.find((m: any) => 
        (m.Parent_Id === null || m.Parent_Id === undefined || m.Parent_Id === 0) && 
        (m.Menu_Name_EN === "Guest User Service" || m.MenuId === 2 || m.Module_Name === "Guest User Service" || m.MenuNameEn === "Guest User Service")
      );

      const parentId = parentMenu?.MenuId || 2;

      // Step 2: Filter children - ONLY include guest services as per requirement
      const services = uniqueMenuData
        .filter((m: any) => {
          const mId = m.MenuId || m.menuId;
          const pId = m.Parent_Id || m.parentId || m.ParentId;
          const url = (m.BracnhServiceURL || m.BranchServiceURL || m.branchServiceURL || m.Target_Url || m.targetUrl || m.MenuURL || m.MenuUrl || m.URL || m.Url || "").toString();
          
          if (mId === parentId || mId === 2) return false;

          const isDirectChild = pId === parentId;
          const isInGuestList = GUEST_BRANCH_SERVICE_URLS.some(gUrl => url && url.includes(gUrl));
          
          // Only show if it's explicitly in our Guest Service URL list OR a direct child of the Guest Menu
          return isInGuestList || isDirectChild;
        })
        .map((m: any) => ({
          MenuId: m.MenuId || m.menuId,
          Module_Name: m.Menu_Name_EN || m.Module_Name || m.MenuNameEn || m.Menu_Name || "",
          Module_Name_Arabic: m.Menu_Name_AR || m.Module_Name_Arabic || m.MenuNameAr || m.Menu_Name_AR || "",
          Menu_Icon: m.Icon_Class || m.Menu_Icon || m.Icon || "",
          Target_Url: m.Target_Url || m.targetUrl || m.MenuURL || m.MenuUrl || "",
          BranchServiceURL: m.BracnhServiceURL || m.BranchServiceURL || m.branchServiceURL || m.Target_Url || m.MenuURL || m.MenuUrl || "",
          BranchServiceEnablementFlag: m.BranchServiceEnablementFlag !== undefined ? m.BranchServiceEnablementFlag : 1,
          PersonTypeCode: m.PersonTypeCode || m.personTypeCode,
          quickMenu: m.quickMenu || m.QuickMenu,
          order: m.order || m.Order || 0
        }))
        .sort((a, b) => a.order - b.order)

      console.log("GuestUserServices: filtered services:", services);

      // Step 3: Group under "Raise Complaint" parent
      if (services.length > 0) {
        setServiceGroups([{
          title: "Raise Complaint", 
          titleAr: "تقديم شكوى",
          icon: parentMenu?.Icon_Class || parentMenu?.Menu_Icon || "AlertCircle",
          services: services
        }])
      } else {
        setServiceGroups([])
      }
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
        <div className="bg-white border-b border-slate-100 flex items-center gap-4 px-1">
          <div className="p-2 bg-[#D92D20] rounded-lg shadow-[0_4px_12px_rgba(217,45,32,0.25)]">
            <AlertCircle className="w-5 h-5 text-white" />
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
              const Icon = getIconForServiceName(service.Module_Name)
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
                    <div className="w-full flex items-center gap-5 text-left">
                      <div className="p-1 text-gray-300">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-gray-400 text-sm font-medium flex-1">{serviceName}</span>
                    </div>
                  ) : (
                    <Link 
                      href={`/branch-operations/guest/${serviceUrl}`}
                      className="w-full flex items-center px-6 py-3.5 text-left transition-all"
                    >
                      <div className="p-1 text-[#006A72] transition-transform duration-300 group-hover:scale-110 group-hover:text-[#D92D20]">
                        <Icon className="w-5 h-5 stroke-[1.5]" />
                      </div>
                      <span className="text-[#344054] text-sm font-semibold flex-1 group-hover:text-[#006A72] transition-colors tracking-tight">
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
      
      {/* Footer info */}
      <p className="text-center mt-8 text-gray-400 text-[10px] font-medium uppercase tracking-[0.2em] opacity-80">
        © 2024 NAMA WATER SERVICES
      </p>
    </div>
  )
}
