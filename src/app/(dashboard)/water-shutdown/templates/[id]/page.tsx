"use client"

import { useParams, useSearchParams } from "next/navigation"
import WaterShutdownTemplateView from "@/components/pages/watershutdown/WaterShutdownTemplateView"

export default function Page() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const mode = (searchParams.get('mode') as "view" | "edit") || "view"

  return <WaterShutdownTemplateView id={id} mode={mode} />
}
