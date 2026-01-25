"use client"

import AppointmentSlotEditorPage from "@/components/pages/appointment/AppointmentSlotEditorPage"
import { useParams } from "next/navigation"
import { Suspense } from "react"

function EditorLoader() {
  const params = useParams()
  const date = params.date as string

  return <AppointmentSlotEditorPage date={date} />
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditorLoader />
    </Suspense>
  )
}
