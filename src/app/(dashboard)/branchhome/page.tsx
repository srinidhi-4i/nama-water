"use client"

import { useEffect } from "react"
import Image from "next/image"

export default function BranchHomePage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      const logoutIframe = document.querySelector(
        'iframe[name="auraLogoutFrame"]'
      )
      if (logoutIframe) logoutIframe.remove()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative w-full h-full">
      {/* Background Image */}
      <Image
        src="/Assets/Images/global/branchHomepage.png"
        alt="Branch Homepage"
        fill
        className="object-cover"
        priority
      />
    </div>
  )
}
