"use client"

import UserProfileResult from "@/components/pages/branchoperation/validate/UserProfileResult"
import { useParams } from "next/navigation"

export default function Page() {
  const params = useParams()
  const type = params.type as string
  const id = params.id as string

  return <UserProfileResult type={type} id={id} />
}
