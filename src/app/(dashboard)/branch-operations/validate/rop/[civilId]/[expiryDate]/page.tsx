"use client"

import ROPProfileResult from "@/components/pages/branchoperation/validate/ROPProfileResult"
import { useParams } from "next/navigation"

export default function Page() {
  const params = useParams()
  const civilId = params.civilId as string
  const expiryDate = params.expiryDate as string

  return <ROPProfileResult civilId={civilId} expiryDate={expiryDate} />
}
