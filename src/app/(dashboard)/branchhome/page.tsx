"use client"

import { useEffect } from "react"
import Image from "next/image"

export default function BranchHomePage() {
  useEffect(() => {
    // Clean up any leftover iframes from Aura logout
    const timer = setTimeout(() => {
      const logoutIframe = document.querySelector('iframe[name="auraLogoutFrame"]')
      if (logoutIframe) {
        logoutIframe.remove()
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative flex-1 min-h-[calc(100vh-200px)]">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/Assets/Images/global/branchHomepage.png"
          alt="Branch Homepage"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}
