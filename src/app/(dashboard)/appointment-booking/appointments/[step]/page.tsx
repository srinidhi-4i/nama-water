"use client"

import AppointmentBookingWizard from "@/components/pages/appointment/AppointmentBookingWizard"
import { useParams } from "next/navigation"
import { Suspense } from "react"

function StepLoader() {
  const params = useParams()
  const step = parseInt(params.step as string) || 1

  return <AppointmentBookingWizard step={step} />
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StepLoader />
    </Suspense>
  )
}
