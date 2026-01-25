"use client"

import { useParams } from "next/navigation"
import GuestServicePage from "@/components/pages/branchoperation/guest/GuestServicePage"

export default function Page() {
  const params = useParams()
  const serviceId = params.serviceId as string

  return <GuestServicePage serviceId={serviceId} />
}
