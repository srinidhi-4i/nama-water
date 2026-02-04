"use client"


import { useRouter } from "next/navigation"
import { Bell, LogOut, Menu } from "lucide-react"
import { useState, useEffect } from "react"
import { authService } from "@/services/auth.service"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BranchUserDetails {
  BranchuserNameEn: string
  BranchuserNameAr?: string
  BranchuserEmailID?: string
  BranchuserID?: string
  BranchuserADID?: string
}

interface HeaderProps {
  language?: "EN" | "AR"
  onLanguageChange?: (lang: "EN" | "AR") => void
  userDetails?: BranchUserDetails | null
  onMenuClick?: () => void
}

export function Header({ language = "EN", onLanguageChange, userDetails, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get user initials from name
  const getUserInitials = (name: string) => {
    if (!name) return "U"
    const names = name.trim().split(" ")
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  // Get display name
  const displayName = userDetails?.BranchuserNameEn || "User"
  const initials = getUserInitials(displayName)

  const handleLogout = async () => {
    await authService.branchLogout()
    router.push("/branch-login")
  }

  if (!mounted) return null

  return (
    <header className="bg-teal-900 text-white  z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-10">
          {/* Left: Menu Toggle & Call Center Info */}
          <div className="flex items-center gap-3 text-xs">
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-1.5 hover:bg-teal-800 rounded transition-colors"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="flex items-center gap-1">
              <span className="hidden sm:inline">Call Center:</span>
              <span className="font-semibold">1442</span>
            </span>
            <span className="hidden md:inline">Sunday - Thursday</span>
          </div>

          {/* Right: Language, Notification, Profile */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button 
              className="relative p-1.5 hover:bg-teal-800 rounded transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Language Switcher */}
            <button 
              onClick={() => onLanguageChange?.(language === "EN" ? "AR" : "EN")}
              className="px-2 py-1 hover:bg-teal-800 rounded text-xs transition-colors"
            >
              {language === "EN" ? "English" : "العربية"}
            </button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-teal-800 px-2 py-1 rounded transition-colors">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs font-semibold">{initials}</span>
                  </div>
                  <span className="text-xs hidden sm:inline max-w-[120px] truncate" title={displayName}>
                    {displayName}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
