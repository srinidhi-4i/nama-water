"use client"

import { useEffect } from "react"
import { authService } from "@/services/auth.service"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Keys to watch for logout (matching authService/STORAGE_KEYS)
      const authKeys = [
        "AU/@/#/TO/#/VA", 
        "bcw/APbiop/swBop23765qtf==",
        "brUd/APtiypx/sw7lu83P7A=="
      ]
      
      if (authKeys.includes(e.key || "") && !e.newValue) {
        // Token was removed in another tab
        window.location.href = "/login"
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return <>{children}</>
}
