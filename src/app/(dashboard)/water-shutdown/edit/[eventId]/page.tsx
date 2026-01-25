"use client"

import WaterShutdownEdit from "@/components/pages/watershutdown/WaterShutdownEdit"
import { useParams } from "next/navigation"

export default function Page() {
  const params = useParams()
  const eventId = params.eventId as string

  return <WaterShutdownEdit eventId={eventId} />
}
