"use client"

import WaterShutdownView from "@/components/pages/watershutdown/WaterShutdownView"
import { useParams } from "next/navigation"

export default function Page() {
  const params = useParams()
  const eventId = params.eventId as string

  return <WaterShutdownView eventId={eventId} />
}
