"use client"

import React, { useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getExpandedRowModel,
  ExpandedState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { accountDetailsColumns, meterHistoryColumns, AccountDetail, MeterHistory } from "@/app/(dashboard)/branch-operations/account-dashboard/[accountNumber]/column"

interface AccountDetailsTableProps {
  data: AccountDetail[]
  meterDataMap: Record<string, MeterHistory[]>
}

export default function AccountDetailsTable({ data, meterDataMap }: AccountDetailsTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    data,
    columns: accountDetailsColumns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto hide-scrollbar">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-slate-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-slate-800 border-none">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-white font-black text-[11px] uppercase tracking-wider py-4 px-6 whitespace-nowrap">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow className="hover:bg-slate-50 border-slate-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4 px-6 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                      <TableCell colSpan={row.getVisibleCells().length} className="p-0">
                        <div className="p-6 bg-slate-50/30">
                          <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <NestedMeterTable data={meterDataMap[row.original.AccountNumber] || []} />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

function NestedMeterTable({ data }: { data: MeterHistory[] }) {
  const table = useReactTable({
    data,
    columns: meterHistoryColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-x-auto hide-scrollbar">
      <Table className="min-w-[800px]">
        <TableHeader className="bg-white border-b border-slate-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-teal-900 font-black text-[10px] uppercase tracking-wider py-3 px-6 whitespace-nowrap">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-slate-50 border-slate-50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3 px-6 text-[11px] whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={meterHistoryColumns.length} className="py-8 text-center text-slate-400 font-bold text-xs">
                No meter history available for this account
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

