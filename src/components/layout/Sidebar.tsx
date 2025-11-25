"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, ChevronLeft, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface MenuItem {
  MenuID: number
  MenuNameEn: string
  MenuNameAr: string
  MenuURL: string
  ApplicationNameEn: string
}

interface SidebarProps {
  menuItems?: MenuItem[]
  language?: "EN" | "AR"
}

export function Sidebar({ menuItems = [], language = "EN" }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const pathname = usePathname()

  // Group menu items by application
  const groupedMenus = menuItems.reduce((acc: Record<string, MenuItem[]>, item) => {
    const appName = item.ApplicationNameEn
    if (!acc[appName]) {
      acc[appName] = []
    }
    acc[appName].push(item)
    return acc
  }, {})

  const toggleMenu = (appName: string) => {
    setOpenMenu(openMenu === appName ? null : appName)
  }

  const renderIcon = (appName: string) => {
    // Return SVG icons based on application name
    switch (appName) {
      case "Appointment":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 200 200" className="fill-current">
            <path d="M15.963,107.065a6.239,6.239,0,0,1-6.193-6.193V42.54h99.38V80.276l6.769,1.872V26.409a13,13,0,0,0-12.963-12.963H91.434V6.677A4.18,4.18,0,0,0,87.257,2.5H77.751a4.18,4.18,0,0,0-4.177,4.177V13.59H45.345V6.677A4.18,4.18,0,0,0,41.168,2.5H31.662a4.18,4.18,0,0,0-4.177,4.177V13.59H15.963A13,13,0,0,0,3,26.553v74.319a13,13,0,0,0,12.963,12.963H80.2l-1.872-6.769H15.963Z" transform="translate(29 29.5)" />
          </svg>
        )
      case "Branch Operations":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="22" viewBox="0 0 21.743 26.35" className="stroke-current fill-none">
            <circle cx="5" cy="5" r="5" transform="translate(7.543 1.491)" strokeWidth="1.5" />
            <path d="M18.21,17.3A8.426,8.426,0,0,0,4,23.426v3.83h7.66" transform="translate(0 -3.275)" strokeWidth="1.5" />
          </svg>
        )
      case "Notification Center":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" className="fill-current">
            <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" />
          </svg>
        )
      case "Water Shutdown":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 200 200" className="fill-current">
            <path d="M386.611,1021.911a59.609,59.609,0,0,1-42.151-101.76L386.611,878l42.151,42.151c.709.708,1.411,1.444,2.08,2.186a39.639,39.639,0,0,0-11.366,7.285l-.059-.059-32.805-32.832-32.785,32.785a46.365,46.365,0,1,0,65.57,65.57,47.02,47.02,0,0,0,3.5-3.914A39.479,39.479,0,0,0,435,997.134a60.269,60.269,0,0,1-6.245,7.325,59.215,59.215,0,0,1-42.144,17.452Z" transform="translate(21 19.966)" />
          </svg>
        )
      case "Wetland":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 200 200" className="fill-current">
            <path d="M71.418,142.825a71.413,71.413,0,1,1,71.455-71.336,71.429,71.429,0,0,1-71.455,71.336" transform="translate(29 29)" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className={cn(
      "bg-teal-800 text-white transition-all duration-300 h-full flex flex-col relative",
      isCollapsed ? "w-14" : "w-48"
    )}>
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-2 bg-teal-700 rounded-full p-0.5 hover:bg-teal-600 z-10"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="py-1">
          {/* Home */}
          <li>
            <Link
              href="/branchhome"
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 hover:bg-teal-700 transition-colors text-sm",
                pathname === "/branchhome" && "bg-teal-700"
              )}
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Home</span>}
            </Link>
          </li>

          {/* Dynamic Menu Items */}
          {Object.keys(groupedMenus).map((appName, index) => (
            <li key={index}>
              <button
                onClick={() => toggleMenu(appName)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-teal-700 transition-colors text-sm",
                  openMenu === appName && "bg-teal-700"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 flex-shrink-0">
                    {renderIcon(appName)}
                  </div>
                  {!isCollapsed && <span className="text-xs">{appName}</span>}
                </div>
                {!isCollapsed && (
                  <ChevronRight
                    className={cn(
                      "w-3 h-3 transition-transform",
                      openMenu === appName && "rotate-90"
                    )}
                  />
                )}
              </button>

              {/* Submenu */}
              {openMenu === appName && !isCollapsed && (
                <ul className="bg-teal-900">
                  {groupedMenus[appName].map((menu, idx) => (
                    <li key={idx}>
                      <Link
                        href={menu.MenuURL}
                        className={cn(
                          "block px-10 py-1.5 hover:bg-teal-700 transition-colors text-xs",
                          pathname === menu.MenuURL && "bg-teal-700"
                        )}
                      >
                        {language === "EN" ? menu.MenuNameEn : menu.MenuNameAr}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
