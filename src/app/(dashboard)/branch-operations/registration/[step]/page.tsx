"use client"

import { useParams } from "next/navigation"
import RegistrationWizard from "@/components/pages/branchoperation/registration/RegistrationWizard"

export default function Page() {
  const params = useParams()
  const step = params.step as any

  return <RegistrationWizard step={step} />
}
