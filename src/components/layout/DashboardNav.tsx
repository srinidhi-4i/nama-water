"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface NavItem {
  href: string
  labelEn: string
  labelAr: string
  icon: string
  isImage?: boolean
}

interface DashboardNavProps {
  language?: "EN" | "AR"
}

const navItems: NavItem[] = [
  {
    href: "/branchhome",
    labelEn: "Home",
    labelAr: "الرئيسية",
    icon: "icon-PAW__home",
  },
  {
    href: "/myaccount",
    labelEn: "My Accounts",
    labelAr: "حساباتي",
    icon: "icon-PAW__my_account-45",
  },
  {
    href: "/dashboard",
    labelEn: "Dashboard",
    labelAr: "لوحة القيادة",
    icon: "icon-PAW__dashboard",
  },
  {
    href: "/landingpage",
    labelEn: "Dashboard Chart",
    labelAr: "مخطط لوحة القيادة",
    icon: "icon-PAW__dashboard",
  },
  {
    href: "/faq",
    labelEn: "FAQ",
    labelAr: "الأسئلة الشائعة",
    icon: "icon-PAW__FAQ",
  },
  {
    href: "/mytask",
    labelEn: "My Tasks",
    labelAr: "مهامي",
    icon: "icon-PAW__my_tasks",
  },
  {
    href: "/myrequest",
    labelEn: "My Requests",
    labelAr: "طلباتي",
    icon: "icon-PAW__my_request",
  },
  {
    href: "/waterleakagealarm",
    labelEn: "Alarm",
    labelAr: "إنذار",
    icon: "icon-PAW__water_leakage",
  },
  {
    href: "/branchandwetlandhistory?isLoggedInUser=1",
    labelEn: "My Appointments",
    labelAr: "مواعيدي",
    icon: "/Assets/Images/appoinment.png",
    isImage: true,
  },
]

export function DashboardNav({ language = "EN" }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <ul className="flex items-center gap-6 overflow-x-auto py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-teal-50",
                    isActive && "bg-teal-100 text-teal-700"
                  )}
                >
                  {item.isImage ? (
                    <Image
                      src={item.icon}
                      alt={language === "EN" ? item.labelEn : item.labelAr}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  ) : (
                    <span className={cn(item.icon, "text-2xl")} />
                  )}
                  <span className="text-sm font-medium whitespace-nowrap">
                    {language === "EN" ? item.labelEn : item.labelAr}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
