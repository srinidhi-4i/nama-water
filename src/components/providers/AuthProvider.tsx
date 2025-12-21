"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService } from "@/services/auth.service"

interface AuthContextType {
  userDetails: any | null
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  userDetails: null,
  isAuthenticated: false,
  isLoading: true,
})

const PUBLIC_ROUTES = ["/login"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userDetails, setUserDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated()
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

      if (!authenticated && !isPublicRoute) {
        router.replace("/login")
      } else if (authenticated) {
        const userData = authService.getCurrentUser()
        if (userData?.BranchUserDetails?.[0]) {
          setUserDetails(userData.BranchUserDetails[0])
        }
        
        // If logged in and trying to access login page, redirect to home
        if (isPublicRoute) {
          router.replace("/branchhome")
        }
      }
      
      setIsLoading(false)
    }

    checkAuth()
  }, [pathname, router])

  return (
    <AuthContext.Provider value={{ 
      userDetails, 
      isAuthenticated: !!userDetails, 
      isLoading 
    }}>
      {isLoading && !PUBLIC_ROUTES.includes(pathname) ? (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-800"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
