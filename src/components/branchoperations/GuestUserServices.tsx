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
  if (n.includes("leak")) return Droplet
  if (n.includes("vehicle") || n.includes("company")) return Truck
  if (n.includes("contractor")) return HardHat
  if (n.includes("quality")) return FlaskConical
  if (n.includes("pressure") || n.includes("network")) return Gauge
  if (n.includes("wastewater")) return Waves
  if (n.includes("overflow")) return Droplet
  if (n.includes("odor") || n.includes("sewer")) return Wind
  return AlertCircle // Default icon
}

export const GuestUserServices: React.FC = () => {
  const { language } = useLanguage()
  const [serviceGroups, setServiceGroups] = useState<GuestServiceGroup[]>([])
  const [loading, setLoading] = useState(true)

  const loadServices = async () => {
    try {
      setLoading(true)
      // Get language and pass to API call
      const lang = language || "EN"
      const menuData = await menuService.getMenuData(lang)
      
      if (!Array.isArray(menuData) || menuData.length === 0) {
        setServiceGroups([])
        return
      }

      // Step 1: Find parent menu with Parent_Id === null (GetParentMenu logic from e-poral-paw)
      const parentMenu = menuData.find((m: any) => {
        const pId = m.Parent_Id || m.ParentId
        return pId === null || pId === undefined
      })

      if (!parentMenu) {
        setServiceGroups([])
        return
      }

      const parentId = parentMenu.MenuId || parentMenu.MenuID

      // Step 2: Filter children by criteria matching e-poral-paw logic
      // Filter by: Parent_Id === parentId, GuestBranchServiceURLS, PersonTypeCode, quickMenu === "1"
      const services: GuestService[] = menuData
        .filter((m: any) => {
          const mParentId = m.Parent_Id || m.ParentId
          const branchServiceURL = m.BracnhServiceURL || m.BranchServiceURL || ""
          const personTypeCode = m.PersonTypeCode
          const quickMenu = m.quickMenu
          const menuId = m.MenuId || m.MenuID

          // Must be child of parent
          if (mParentId !== parentId) return false

          // Filter out Guest User Service itself (MenuId === 2)
          if (menuId === 2) return false

          // Must be in GuestBranchServiceURLS
          if (!GUEST_BRANCH_SERVICE_URLS.includes(branchServiceURL)) return false

          // PersonTypeCode should match (null/undefined means all, or "IND")
          if (personTypeCode !== undefined && personTypeCode !== null && personTypeCode !== "IND") {
            return false
          }

          // Only show quickMenu === "1" items
          if (quickMenu !== "1") return false

          return true
        })
        .map((m: any) => ({
          MenuId: m.MenuId || m.MenuID,
          Module_Name: m.Module_Name || m.Menu_Name_EN || m.MenuNameEn || "",
          Module_Name_Arabic: m.Module_Name_Arabic || m.Menu_Name_AR || m.MenuNameAr || "",
          Menu_Icon: m.Menu_Icon || m.Icon_Class || "",
          Target_Url: m.Target_Url || m.TargetUrl || "",
          BracnhServiceURL: m.BracnhServiceURL || m.BranchServiceURL || "",
          BranchServiceEnablementFlag: m.BranchServiceEnablementFlag ?? 1,
          PersonTypeCode: m.PersonTypeCode,
          quickMenu: m.quickMenu,
          order: m.order || m.Order || 0
        }))
        .sort((a, b) => a.order - b.order)

      // Step 3: Group under "Raise Complaint" parent (matching reference screenshot)
      if (services.length > 0) {
        setServiceGroups([{
          title: parentMenu.Module_Name || parentMenu.Menu_Name_EN || parentMenu.MenuNameEn || "Raise Complaint",
          titleAr: parentMenu.Module_Name_Arabic || parentMenu.Menu_Name_AR || parentMenu.MenuNameAr || "تقديم شكوى",
          icon: parentMenu.Menu_Icon || parentMenu.Icon_Class || "AlertCircle",
          services: services
        }])
      } else {
        setServiceGroups([])
      }
    } catch (error) {
      console.error("Error loading guest services:", error)
      setServiceGroups([])
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
    <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-500">
      <Card className="overflow-hidden border-none shadow-xl rounded-xl">
        {/* Card Header - matching reference screenshot */}
        <div className="px-6 py-4 bg-[#1F4E58] flex items-center gap-4 border-b">
          <div className="p-2 bg-[#D92D20] rounded-lg shadow-sm">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            {language === "AR" ? group.titleAr : group.title}
          </h2>
        </div>
        
        {/* Card Body - List of services */}
        <CardContent className="p-0">
          <ul className="flex flex-col">
            {group.services.map((service, sIdx) => {
              const Icon = getIconForServiceName(service.Module_Name)
              const isDisabled = service.BranchServiceEnablementFlag === 0
              const serviceUrl = service.BracnhServiceURL || service.Target_Url || "#"
              const serviceName = language === "AR" ? service.Module_Name_Arabic : service.Module_Name

              return (
                <li 
                  key={service.MenuId || sIdx} 
                  className={`border-b last:border-b-0 transition-colors ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  {isDisabled ? (
                    <div className="w-full flex items-center gap-4 px-8 py-4 text-left">
                      <div className="p-1 text-gray-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-gray-500 text-base flex-1">{serviceName}</span>
                    </div>
                  ) : (
                    <Link 
                      href={`/${serviceUrl}`}
                      className="w-full flex items-center gap-4 px-8 py-4 text-left group"
                      style={{ pointerEvents: isDisabled ? 'none' : 'auto' }}
                    >
                      <div className="p-1 text-[#006A72] transition-colors group-hover:text-[#D92D20]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[#344054] text-base flex-1 group-hover:text-[#006A72] transition-colors">
                        {serviceName}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#006A72] transition-colors" />
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
