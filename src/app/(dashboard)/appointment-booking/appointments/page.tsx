"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/appointment-booking/appointments/1')
  }, [router])

  return null
}
