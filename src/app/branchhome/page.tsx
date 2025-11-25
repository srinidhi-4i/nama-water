"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth.service"
import { menuService } from "@/services/menu.service"
import { Header } from "@/components/layout/Header"
import { LogoSection } from "@/components/layout/LogoSection"
import { Sidebar } from "@/components/layout/Sidebar"
import { Footer } from "@/components/layout/Footer"
import Image from "next/image"

interface MenuItem {
  MenuID: number
  MenuNameEn: string
  MenuNameAr: string
  MenuURL: string
  ApplicationNameEn: string
}

export default function BranchHomePage() {
  const router = useRouter()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.push('/login')
      return
    }

    // Load menu data (optional - won't break if it fails)
    loadMenuData()

    // Clean up any leftover iframes from Aura logout
    const timer = setTimeout(() => {
      const logoutIframe = document.querySelector('iframe[name="auraLogoutFrame"]')
      if (logoutIframe) {
        logoutIframe.remove()
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  const loadMenuData = async () => {
    try {
      const data = await menuService.getMenuDetails()
      
      if (data && data.length > 0) {
        // Transform menu data to include ApplicationNameEn
        const transformedData = data.map((item: any) => ({
          MenuID: item.MenuId,
          MenuNameEn: item.Menu_Name_EN,
          MenuNameAr: item.Menu_Name_AR,
          MenuURL: item.Target_Url,
          ApplicationNameEn: item.ApplicationNameEn || "General"
        }))
        setMenuItems(transformedData)
      } else {
        // Use default menu items if API returns empty
        setMenuItems(getDefaultMenuItems())
      }
    } catch (error) {
      console.error('Error loading menu data:', error)
      // Use default menu items on error
      setMenuItems(getDefaultMenuItems())
    }
  }

  const getDefaultMenuItems = (): MenuItem[] => {
    return [
      {
        MenuID: 1,
        MenuNameEn: "Appointment Booking",
        MenuNameAr: "حجز موعد",
        MenuURL: "/appointmentbooking",
        ApplicationNameEn: "Appointment"
      },
      {
        MenuID: 2,
        MenuNameEn: "Appointment History",
        MenuNameAr: "سجل المواعيد",
        MenuURL: "/appointmenthistory",
        ApplicationNameEn: "Appointment"
      },
      {
        MenuID: 3,
        MenuNameEn: "Search Customer",
        MenuNameAr: "البحث عن العميل",
        MenuURL: "/searchcustomer",
        ApplicationNameEn: "Branch Operations"
      },
      {
        MenuID: 4,
        MenuNameEn: "Notifications",
        MenuNameAr: "الإشعارات",
        MenuURL: "/notifications",
        ApplicationNameEn: "Notification Center"
      },
      {
        MenuID: 5,
        MenuNameEn: "Water Shutdown List",
        MenuNameAr: "قائمة إيقاف المياه",
        MenuURL: "/watershutdown",
        ApplicationNameEn: "Water Shutdown"
      },
      {
        MenuID: 6,
        MenuNameEn: "Wetland Booking",
        MenuNameAr: "حجز الأراضي الرطبة",
        MenuURL: "/wetlandbooking",
        ApplicationNameEn: "Wetland"
      }
    ]
  }

  const handleLanguageChange = (lang: "EN" | "AR") => {
    setLanguage(lang)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <Header language={language} onLanguageChange={handleLanguageChange} />

      {/* Logo Section */}
      <LogoSection />

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar menuItems={menuItems} language={language} />

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/Assets/Images/global/branchHomepage.png"
              alt="Branch Homepage"
              fill
              className="object-cover"
              priority
            />
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
