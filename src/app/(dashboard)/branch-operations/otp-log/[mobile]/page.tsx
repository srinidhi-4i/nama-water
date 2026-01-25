"use client"

import OTPLog from "@/components/pages/branchoperation/otp-log/OTPLog"
import { useParams } from "next/navigation"

export default function Page() {
  const params = useParams()
  const mobile = params.mobile as string

  return <OTPLog mobile={mobile} />
}
