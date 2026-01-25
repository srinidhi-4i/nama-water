"use client"

import WetlandSlotEditorPage from "@/components/pages/wetland/WetlandSlotEditorPage"
import { useParams } from "next/navigation"

export default function Page() {
  const params = useParams()
  const date = params.date as string

  return <WetlandSlotEditorPage date={date} />
}
