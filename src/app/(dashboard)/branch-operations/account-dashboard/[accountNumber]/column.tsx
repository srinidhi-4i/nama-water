"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export type Transaction = {
  PaymentDate: string
  Amount: string
  PaymentChannel: string
  TransactionID: string
  LegacyAccountNumber?: string
  [key: string]: any // Support other API keys
}

export type AccountDetail = {
  AccountNumber: string
  LegacyNumber: string
  ServiceType: string
  ServiceAgreement: string
  ConnectionStatus: string
  DisconnectionReason: string
  [key: string]: any
}

export type MeterHistory = {
  MeterNumber: string
  MeterStatus: string
  MeterReplacementHistory: string
  DateTime: string
  [key: string]: any
}

export type Request = {
  Reference: string
  ServiceName: string
  Date: string
  Status: string
  [key: string]: any
}

export const columns: ColumnDef<Transaction>[] = [
  {
    id: "srNo",
    header: "Sr No",
    cell: ({ row }) => row.index + 1,
  },
  {
    id: "legacyAcc",
    header: "Legacy Account Number",
    cell: ({ row }) => {
      const data = row.original;
      return data.AccountNum || data.LegacyAccountNumber || data.LegacyNumber || data.LegacyID || data.LegacyId || data.OldAccountNumber || data.OldAccNo || data.LegacyAccountId || "--";
    },
  },
  {
    id: "transactionId",
    header: "Payment ID",
    cell: ({ row }) => {
      const data = row.original;
      return data.PaymentID || data.TransactionID || data.TransRefNo || data.paymentTransactionID || data.PaymentId || "--";
    },
  },
  {
    accessorKey: "PaymentDate",
    header: "Payment Date",
    cell: ({ row }) => row.getValue("PaymentDate") || "--",
  },
  {
    id: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const data = row.original;
      const amount = data.PaymentAmount || data.Amount || data.TotalResult || data.TotalAmount || "0.000";
      return <div className="text-right font-black text-slate-800">{amount}</div>
    },
  },
]

export const accountDetailsColumns: ColumnDef<AccountDetail>[] = [
  {
    id: "srNo",
    header: "Sr.No",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "AccountNumber",
    header: "Account Number",
    cell: ({ row }) => <span className="font-black text-slate-800">{row.getValue("AccountNumber") || "--"}</span>,
  },
  {
    accessorKey: "LegacyNumber",
    header: "Legacy Number",
    cell: ({ row }) => <span className="font-black text-slate-800">{row.getValue("LegacyNumber") || "--"}</span>,
  },
  {
    accessorKey: "ServiceType",
    header: "Service Type",
    cell: ({ row }) => <span className="font-black text-slate-800 uppercase">{row.getValue("ServiceType") || "--"}</span>,
  },
  {
    accessorKey: "ServiceAgreement",
    header: "Service Agreement",
    cell: ({ row }) => <span className="font-bold text-teal-600">{row.getValue("ServiceAgreement") || "Active"}</span>,
  },
  {
    accessorKey: "ConnectionStatus",
    header: "Connection Status",
    cell: ({ row }) => <span className="font-black text-slate-800 uppercase">{row.getValue("ConnectionStatus") || "CONNECTED"}</span>,
  },
  {
    id: "disconnectionReason",
    header: "Disconnection Reason",
    cell: ({ row }) => {
      const isExpanded = (row as any).getIsExpanded && (row as any).getIsExpanded();
      return (
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-400">{(row.original.DisconnectionReason || "--")}</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              (row as any).toggleExpanded();
            }}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <div className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </button>
        </div>
      )
    },
  },
]

export const meterHistoryColumns: ColumnDef<MeterHistory>[] = [
  {
    accessorKey: "MeterNumber",
    header: "Meter Number",
    cell: ({ row }) => <span className="text-slate-600 font-bold">{row.getValue("MeterNumber") || "--"}</span>,
  },
  {
    accessorKey: "MeterStatus",
    header: "Meter Status",
    cell: ({ row }) => {
      const status = row.getValue("MeterStatus") as string;
      return (
        <span className={`font-bold ${status?.toLowerCase().includes('active') && !status?.toLowerCase().includes('inactive') ? "text-teal-600" : "text-red-500"}`}>
          {status || "--"}
        </span>
      )
    },
  },
  {
    accessorKey: "MeterReplacementHistory",
    header: "Meter Replacement History",
    cell: ({ row }) => <span className="text-slate-400">{(row.getValue("MeterReplacementHistory") || "--")}</span>,
  },
  {
    accessorKey: "DateTime",
    header: "Date and Time",
    cell: ({ row }) => <span className="text-slate-600 font-bold">{row.getValue("DateTime") || "--"}</span>,
  },
]

export const requestColumns: ColumnDef<Request>[] = [
  { id: "srNo", header: "Sr No", cell: ({ row }) => <span className="text-gray-500 font-bold">{row.index + 1}</span> },
  { 
      accessorKey: "Reference", 
      header: "Reference Number", 
      cell: ({ row }) => <span className="text-teal-900 font-black">{row.original.CompletionRequestID || row.original["Ref.Number"] || row.original.ReferenceNumber || row.original.RequestNumber || row.original.SRNo || row.original.ServiceNo || row.original.RequestID || row.original.id || "-"}</span> 
  },
  { 
      accessorKey: "ServiceName", 
      header: "Service Name", 
      cell: ({ row }) => <span className="text-slate-700 font-bold">{row.original.RequestType || row.original.ServiceName || row.original["service Name"] || row.original.RequestTypeDesc || row.original.ServiceDescription || row.original.Type || "-"}</span> 
  },
  { 
      accessorKey: "Date", 
      header: "Request Date", 
      cell: ({ row }) => <span className="text-slate-600 font-bold">{row.original.RequestDate || row.original["Updated Date"] || row.original.RequestedDate || row.original.SRDate || row.original.date || row.original.CreatedDate || row.original.CreatedDateTime || row.original.RequestedDateTime || row.original.Requested_Date || row.original.Created_Date || row.original.Date || "-"}</span> 
  },
  { 
      accessorKey: "Status", 
      header: "Status", 
      cell: ({ row }) => {
          const s = row.original.RequestStatus || row.original.Status || row.original.SRStatus || row.original.StatusDesc || row.original["Status Name"] || row.original.State || row.original.StatusDescription || row.original.SRStatusDescription || row.original.RequestStatusDesc || "-"
          const low = s.toLowerCase()
          let colorClass = "border-blue-500 text-blue-600"
          if (low.includes('complete') || low.includes('closed') || low.includes('success')) colorClass = "border-green-500 text-green-600"
          if (low.includes('pending') || low.includes('progress') || low.includes('await') || low.includes('assign')) colorClass = "border-amber-500 text-amber-600"
          if (low.includes('cancel') || low.includes('reject') || low.includes('fail')) colorClass = "border-red-500 text-red-600"
          
          return (
              <div className={`px-4 py-1 rounded-full border text-[10px] font-bold text-center w-fit ${colorClass}`}>
                  {s}
              </div>
          )
      }
  },
  {
      id: "viewDetails",
      header: "View Details",
      cell: () => (
          <Button variant="outline" className="h-8 bg-black text-white hover:bg-teal-800 text-[10px] font-black uppercase rounded-lg px-4 border-none">
              View Details
          </Button>
      )
  },
  {
      id: "actions",
      header: "Action",
      cell: () => (
          <div className="flex justify-center">
              <Download className="h-4 w-4 text-teal-600 cursor-pointer hover:scale-110 transition-transform" />
          </div>
      )
  },
]

export type Appointment = {
  AppointmentType: string
  AppointmentDate: string
  Status: string
  [key: string]: any
}

export const appointmentColumns: ColumnDef<Appointment>[] = [
  { id: "srNo", header: "Sr No", cell: ({ row }) => row.index + 1 },
  { accessorKey: "AppointmentType", header: "Type", cell: ({ row }) => row.original.AppointmentType || "-" },
  { accessorKey: "AppointmentDate", header: "Date", cell: ({ row }) => row.original.AppointmentDate || "-" },
  { accessorKey: "Status", header: "Status", cell: ({ row }) => row.original.Status || "-" }
]

export type Alarm = {
  AlarmType: string
  AlarmDate: string
  Status: string
  [key: string]: any
}

export const alarmColumns: ColumnDef<Alarm>[] = [
  { id: "srNo", header: "Sr No", cell: ({ row }) => row.index + 1 },
  { accessorKey: "AlarmType", header: "Alarm Type", cell: ({ row }) => row.original.AlarmType || "-" },
  { accessorKey: "AlarmDate", header: "Date", cell: ({ row }) => row.original.AlarmDate || "-" },
  { accessorKey: "Status", header: "Status", cell: ({ row }) => row.original.Status || "-" }
]
