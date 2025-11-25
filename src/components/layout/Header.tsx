"use client"

import Link from "next/link"
import Image from "next/image"
import { Bell } from "lucide-react"

interface HeaderProps {
  language?: "EN" | "AR"
  onLanguageChange?: (lang: "EN" | "AR") => void
}

export function Header({ language = "EN", onLanguageChange }: HeaderProps) {
  return (
    <header className="bg-teal-700 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Left: Call Center Info */}
          <div className="flex items-center gap-3 text-xs">
            <span>Call Center: 1442</span>
            <span>Sunday - Thursday</span>
          </div>

          {/* Right: Language, Notification, Profile */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button className="relative p-1.5 hover:bg-teal-600 rounded">
              <Bell className="w-4 h-4" />
            </button>

            {/* Language Switcher */}
            <button 
              onClick={() => onLanguageChange?.(language === "EN" ? "AR" : "EN")}
              className="px-2 py-1 hover:bg-teal-600 rounded text-xs"
            >
              {language === "EN" ? "English" : "العربية"}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xs font-semibold">S</span>
              </div>
              <span className="text-xs">Srinidhi R</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
