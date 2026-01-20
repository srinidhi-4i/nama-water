"use client"

import { useEffect } from "react"

export default function AppointmentDisplay() {
  useEffect(() => {
    // Open external URL in new tab as per requirement
    window.open("https://eservicesuat.nws.nama.om/AppointmentCounterPage?AuraPortalMode=true&UserData=B6oc%2BA%2BxYQ6HLNjSkX4PUw%3D%3D&lng=EN", "_blank")
    // Redirect back to home or previous page after opening
    window.location.href = "/branchhome"
  }, [])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
        <p className="text-slate-500 font-medium tracking-wide">Redirecting to Appointment Counter Display...</p>
      </div>
    </div>
  )
}
