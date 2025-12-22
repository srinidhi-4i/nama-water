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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:13',message:'DashboardLayout rendered',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const { userDetails } = useAuth()
  const { language, setLanguage } = useLanguage()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:23',message:'Layout useEffect triggered',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    loadMenuData()
  }, [])

  const loadMenuData = async () => {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:27',message:'loadMenuData called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const data = await menuService.getMenuDetails()
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:30',message:'Menu data received',data:{dataLength:data?.length || 0,firstItemUrl:data?.[0]?.Target_Url || data?.[0]?.MenuURL || 'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      if (data && data.length > 0) {
        const transformedData: MenuItem[] = data.map((item: any) => ({
          MenuID: item.MenuId,
          MenuNameEn: item.Menu_Name_EN,
          MenuNameAr: item.Menu_Name_AR,
          MenuURL: item.Target_Url,
          ApplicationNameEn: item.ApplicationNameEn || "General"
        }))
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:38',message:'Menu items transformed',data:{transformedCount:transformedData.length,firstUrl:transformedData[0]?.MenuURL || 'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        setMenuItems(transformedData)
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/839c7757-441a-490f-a720-0ae555f4ea7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layout.tsx:42',message:'Error loading menu data',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
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
