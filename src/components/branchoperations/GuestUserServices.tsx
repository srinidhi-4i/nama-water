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
  Loader2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { menuService } from "@/services/menu.service"
import { GuestService, GuestServiceGroup } from "@/types/branchops.types"

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
  const [serviceGroups, setServiceGroups] = useState<GuestServiceGroup[]>([])
  const [loading, setLoading] = useState(true)

  const loadServices = async () => {
    try {
      setLoading(true)
      const rawData = await menuService.getMenuData()
      
      // Handle the data structure (might be wrapped or direct array)
      const menuData = Array.isArray(rawData) ? rawData : (rawData as any)?.MenuData || []
      
      const groups: GuestServiceGroup[] = []

      // Step 1: Find Root Items (Headers like "Raise Complaint")
      // In guest context, roots either have Parent_Id === 2 or are parents of items in the list.
      const parents = menuData.filter((m: any) => {
        const pId = m.Parent_Id || m.ParentId || 0
        // Root items usually have null parent or point to the main module (2)
        return !pId || pId === 2
      })

      // Step 2: Group children under these parents
      parents.forEach((parent: any) => {
        const parentId = parent.MenuId || parent.MenuID
        
        const services: GuestService[] = menuData
          .filter((m: any) => {
            const mParentId = m.Parent_Id || m.ParentId
            return mParentId != null && mParentId == parentId
          })
          .map((m: any) => ({
            MenuId: m.MenuId || m.MenuID,
            Module_Name: m.Module_Name || m.Menu_Name_EN || m.MenuNameEn,
            Module_Name_Arabic: m.Module_Name_Arabic || m.Menu_Name_AR || m.MenuNameAr,
            Menu_Icon: m.Menu_Icon || m.Icon_Class,
            Target_Url: m.Target_Url || m.TargetUrl || m.BracnhServiceURL,
            BracnhServiceURL: m.BracnhServiceURL || m.BranchServiceURL,
            BranchServiceEnablementFlag: m.BranchServiceEnablementFlag ?? 1,
            order: m.order || m.Order || 0
          }))

        if (services.length > 0) {
          groups.push({
            title: parent.Module_Name || parent.Menu_Name_EN || parent.MenuNameEn,
            titleAr: parent.Module_Name_Arabic || parent.Menu_Name_AR || parent.MenuNameAr,
            icon: parent.Menu_Icon || parent.Icon_Class || "AlertCircle",
            services: services.sort((a, b) => a.order - b.order)
          })
        }
      })

      // Fallback: If no hierarchy found but we have data, show all items in one group
      if (groups.length === 0 && menuData.length > 0) {
        const flatServices: GuestService[] = menuData
          .filter((m: any) => (m.MenuId || m.MenuID) !== 2) // Filter out the 'Guest User Service' itself
          .map((m: any) => ({
            MenuId: m.MenuId || m.MenuID,
            Module_Name: m.Module_Name || m.Menu_Name_EN || m.MenuNameEn,
            Module_Name_Arabic: m.Module_Name_Arabic || m.Menu_Name_AR || m.MenuNameAr,
            Menu_Icon: m.Menu_Icon || m.Icon_Class,
            Target_Url: m.Target_Url || m.TargetUrl || m.BracnhServiceURL,
            BracnhServiceURL: m.BracnhServiceURL || m.BranchServiceURL,
            BranchServiceEnablementFlag: m.BranchServiceEnablementFlag ?? 1,
            order: m.order || 0
          }))

        if (flatServices.length > 0) {
          groups.push({
            title: "Raise Complaint", // Default as per reference image
            titleAr: "تقديم شكوى",
            icon: "AlertCircle",
            services: flatServices.sort((a, b) => a.order - b.order)
          })
        }
      }

      setServiceGroups(groups)
    } catch (error) {
      console.error("Error loading guest services:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-[#1F4E58] mb-6">Guest User Services</h1>
      
      {serviceGroups.map((group, gIdx) => (
        <Card key={gIdx} className="overflow-hidden border-none shadow-xl rounded-xl">
          <div className="px-6 py-4 bg-[#F2F4F7] flex items-center gap-4 border-b">
            <div className="p-2 bg-red-600 rounded-lg shadow-sm">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#1F4E58]">{group.title}</h2>
          </div>
          <CardContent className="p-0">
            <ul className="flex flex-col">
              {group.services.map((service, sIdx) => {
                const Icon = getIconForServiceName(service.Module_Name)
                return (
                  <li key={service.MenuId || sIdx} className="border-b last:border-b-0 hover:bg-slate-50 transition-colors">
                    <button
                      className="w-full flex items-center gap-4 px-8 py-4 text-left group"
                      onClick={() => {
                        console.log(`Navigate to ${service.Target_Url}`)
                      }}
                    >
                      <div className="p-1 text-cyan-600 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[#344054] font-medium text-lg group-hover:text-black">
                        {service.Module_Name}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
