"use client"

import { useParams, useSearchParams } from "next/navigation"
import NotificationTemplateView from "@/components/pages/notification/NotificationTemplateView"

export default function Page() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const mode = (searchParams.get('mode') as "view" | "edit") || "view"

  return <NotificationTemplateView id={id} mode={mode} />
}
