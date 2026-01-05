"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { Header } from "@/components/layout/Header"
import { LogoSection } from "@/components/layout/LogoSection"
import { Footer } from "@/components/layout/Footer"
import { StaticSidebar } from "@/components/layout/sidebar/StaticSidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userDetails } = useAuth()
  const { language, setLanguage } = useLanguage()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
        <StaticSidebar 
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
