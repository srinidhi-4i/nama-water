"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { renderSidebarIcon } from "./icon-map"
import { EXPANDABLE_MENUS, STATIC_LINKS } from "./Sidebar-menu"

interface StaticSidebarProps {
  isOpen?: boolean
  onMobileClose?: () => void
  language?: "EN" | "AR"
}

export function StaticSidebar({ isOpen, onMobileClose, language = "EN" }: StaticSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const isRTL = language === "AR"

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "bg-teal-900 text-white fixed lg:relative inset-y-0 z-50 transition-all flex flex-col",
          isCollapsed ? "w-14" : "w-64",
          // Mobile visibility
          isOpen ? "translate-x-0" : (isRTL ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"),
          // RTL/LTR positioning
          isRTL ? "right-0 border-l border-teal-800" : "left-0 border-r border-teal-800"
        )}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "hidden lg:block absolute top-3 bg-red-500 p-1 rounded-full z-50",
            isRTL ? "-left-3" : "-right-3"
          )}
        >
          {isCollapsed ? (
            isRTL ? <ChevronLeft /> : <ChevronRight />
          ) : (
            isRTL ? <ChevronRight /> : <ChevronLeft />
          )}
        </button>

        <nav  className="flex-shrink-0">
          <ul className="space-y-1">
            {STATIC_LINKS.map((link, index) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onMobileClose}
                 className={cn(
                "flex items-center gap-3 px-4 py-4 text-sm font-medium hover:bg-teal-800 transition-colors",
                pathname === link.href && "bg-teal-900"
              )}

                >
                  {renderSidebarIcon(link.icon)}
                  {!isCollapsed && (isRTL ? link.labelAr : link.label)}
                </Link>
                {index === 0 && (
          <div className="mx-4 my-2 h-px bg-white/20" />
        )}
              </li>
            ))}

            {EXPANDABLE_MENUS.map(menu => (
              <li key={menu.label}>
                <button
                  onClick={() =>
                    setOpenMenu(openMenu === menu.label ? null : menu.label)
                  }
                className="w-full flex justify-between items-center px-4 py-4 text-sm font-medium hover:bg-teal-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {renderSidebarIcon(menu.icon)}
                    {!isCollapsed && (isRTL ? menu.labelAr : menu.label)}
                  </div>
                  {!isCollapsed && (
                    <ChevronRight
                      className={cn(
                        "w-3 h-3 transition-transform",
                        openMenu === menu.label && "rotate-90",
                        isRTL && "rotate-180", // Initial state for RTL
                        isRTL && openMenu === menu.label && "-rotate-90" // Expanded state for RTL
                      )}
                    />
                  )}
                </button>

                {openMenu === menu.label && !isCollapsed && (
                <ul className={cn("mt-1 space-y-2", isRTL ? "pr-12" : "pl-12")}>
                    {menu.children.map(child => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onMobileClose}
                          className={cn(
                          "block py-2 text-sm text-white/80 hover:text-white transition-colors",
                          pathname === child.href && "text-white"
                        )}

                        >
                          {isRTL ? child.labelAr : child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
         {/* Spacer */}
  <div className="flex-1" />

  {/* Optional bottom fade */}
  <div className="h-24 bg-gradient-to-t from-teal-900 to-transparent" />
      </aside>
    </>
  )
}
