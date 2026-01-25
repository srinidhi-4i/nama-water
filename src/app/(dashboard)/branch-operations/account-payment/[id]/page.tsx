"use client"

import AccountPaymentPage from "@/components/pages/branchoperation/account-payment/AccountPaymentPage"
import { useParams } from "next/navigation"

export default function Page() {
  const params = useParams()
  const id = params.id as string

  return <AccountPaymentPage id={id} />
}
