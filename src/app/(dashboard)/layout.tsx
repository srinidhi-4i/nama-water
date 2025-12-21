"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { menuService } from "@/services/menu.service"
import { MenuItem } from "@/types/menu"
import { Header } from "@/components/layout/Header"
import { LogoSection } from "@/components/layout/LogoSection"
import { Sidebar } from "@/components/layout/Sidebar"
import { Footer } from "@/components/layout/Footer"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userDetails } = useAuth()
  const { language, setLanguage } = useLanguage()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    loadMenuData()
  }, [])

  const loadMenuData = async () => {
    try {
      const data = await menuService.getMenuDetails()
      if (data && data.length > 0) {
        const transformedData: MenuItem[] = data.map((item: any) => ({
          MenuID: item.MenuId,
          MenuNameEn: item.Menu_Name_EN,
          MenuNameAr: item.Menu_Name_AR,
          MenuURL: item.Target_Url,
          ApplicationNameEn: item.ApplicationNameEn || "General"
        }))
        setMenuItems(transformedData)
      }
    } catch (error) {
      console.error('Error loading menu data:', error)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        language={language} 
        onLanguageChange={setLanguage} 
        userDetails={userDetails} 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <LogoSection />
      
      <div className="flex flex-1">
        <Sidebar 
          menuItems={menuItems} 
          language={language} 
          isOpen={isSidebarOpen} 
          onMobileClose={() => setIsSidebarOpen(false)} 
        />

        <main className="flex-1 bg-slate-100 overflow-x-hidden">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  )
}
