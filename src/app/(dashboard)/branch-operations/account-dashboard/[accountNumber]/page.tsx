"use client"

import AccountDashboard from "@/components/pages/branchoperation/account-dashboard/AccountDashboard"
import { useParams } from "next/navigation"

export default function Page() {
  const params = useParams()
  const accountNumber = params.accountNumber as string

  return <AccountDashboard accountNumber={accountNumber} />
}
