"use client"

import { OTPLog } from "@/types/branchops.types"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"

const columnHelper = createColumnHelper<OTPLog>()

export const getOTPLogColumns = (): ColumnDef<OTPLog, any>[] => [
    columnHelper.accessor('SI_No', {
        header: 'SI no.',
        size: 80,
        cell: info => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor('GSM_Number', {
        header: 'GSM Number',
        size: 150,
        cell: info => info.getValue()
    }),
    columnHelper.accessor('OTP_Triggered_Date_Time', {
        header: 'OTP Triggered Date & Time',
        size: 250,
        cell: info => info.getValue()
    }),
    columnHelper.accessor('Message_Delivery_Status', {
        header: 'Message Delivery Status',
        size: 250,
        cell: info => info.getValue()
    })
]
