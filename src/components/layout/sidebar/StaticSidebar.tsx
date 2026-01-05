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
}

export function StaticSidebar({ isOpen, onMobileClose }: StaticSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

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
    "bg-teal-900 text-white fixed lg:relative inset-y-0 left-0 z-50 transition-all flex flex-col",
    isCollapsed ? "w-14" : "w-64",
    isOpen ? "translate-x-0" : "lg:translate-x-0 -translate-x-full"
  )}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:block absolute -right-3 top-3 bg-red-500 p-1 rounded-full"
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
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
                  {!isCollapsed && link.label}
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
                    {!isCollapsed && menu.label}
                  </div>
                  {!isCollapsed && (
                    <ChevronRight
                      className={cn(
                        "w-3 h-3 transition-transform",
                        openMenu === menu.label && "rotate-90"
                      )}
                    />
                  )}
                </button>

                {openMenu === menu.label && !isCollapsed && (
                <ul className="pl-12 mt-1 space-y-2">
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
                          {child.label}
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
