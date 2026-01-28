"use client"

import { ColumnDef } from "@tanstack/react-table"

export type Transaction = {
  PaymentDate: string
  Amount: string
  PaymentChannel: string
  TransactionID: string
  LegacyAccountNumber?: string
}

export const columns: ColumnDef<Transaction>[] = [
  {
    id: "srNo",
    header: "Sr No",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "LegacyAccountNumber",
    header: "Legacy Account Number",
    cell: ({ row }) => row.getValue("LegacyAccountNumber") || "--",
  },
  {
    accessorKey: "TransactionID",
    header: "Payment ID",
  },
  {
    accessorKey: "PaymentDate",
    header: "Payment Date",
  },
  {
    accessorKey: "Amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.getValue("Amount")as string
      return <div className="text-right font-medium">{amount}</div>
    },
  },
]
