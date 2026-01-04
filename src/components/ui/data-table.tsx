"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table"

import { ArrowUpDown } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  emptyMessage?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No data available",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    columnResizeMode: "onChange",
    state: {
      sorting,
    },
    initialState: {
        pagination: {
            pageSize: 5,
        }
    }
  })

  return (
    <div>
      <div className="rounded-lg border bg-white overflow-x-auto">
        <Table className="rounded-lg w-full" style={{ minWidth: table.getTotalSize() }}>
          <TableHeader className="bg-slate-800 text-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-slate-800">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                        key={header.id} 
                        style={{ width: header.getSize() }}
                        className="relative group pr-4"
                    >
                      <div
                        className={
                          header.column.getCanSort()
                            ? "cursor-pointer select-none flex items-center justify-between w-full gap-1"
                            : "flex items-center justify-between w-full gap-1"
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex-1">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </div>

                        {header.column.getCanSort() && (
                          <div className="shrink-0">
                            <ArrowUpDown 
                              className={`w-3.5 h-3.5 transition-colors ${
                                header.column.getIsSorted() 
                                  ? "text-white" 
                                  : "text-slate-600"
                              }`} 
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Resizer */}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1 bg-teal-500 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity ${
                          header.column.getIsResizing() ? "bg-teal-400 opacity-100" : ""
                        }`}
                      />
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between py-4 gap-4 select-none">
          {/* Left Side: Page info */}
        

          {/* Middle: Pagination Controls */}
           <Pagination className="w-auto mx-0">
              <PaginationContent className="flex-wrap justify-center">
                  <PaginationItem>
                      <PaginationPrevious 
                          disabled={!table.getCanPreviousPage()}
                          onClick={(e) => {
                              e.preventDefault();
                              if (table.getCanPreviousPage()) table.previousPage();
                          }}
                          className="cursor-pointer"
                      />
                  </PaginationItem>
                  
                  {/* Page Numbers - Limited for better mobile view */}
                  {Array.from({ length: table.getPageCount() }, (_, i) => i)
                    .filter(i => {
                      const current = table.getState().pagination.pageIndex;
                      return i === 0 || i === table.getPageCount() - 1 || (i >= current - 1 && i <= current + 1);
                    })
                    .map((pageIndex, idx, arr) => {
                      const prev = arr[idx - 1];
                      const current = table.getState().pagination.pageIndex;
                      
                      return (
                        <React.Fragment key={pageIndex}>
                          {prev !== undefined && pageIndex - prev > 1 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                              <PaginationLink
                                  href="#"
                                  isActive={pageIndex === current}
                                  onClick={(e) => {
                                      e.preventDefault();
                                      table.setPageIndex(pageIndex);
                                  }}
                                  className="cursor-pointer"
                              >
                                  {pageIndex + 1}
                              </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      )
                  })}

                  <PaginationItem>
                      <PaginationNext 
                          disabled={!table.getCanNextPage()}
                          onClick={(e) => {
                              e.preventDefault();
                              if (table.getCanNextPage()) table.nextPage();
                          }}
                          className="cursor-pointer"
                      />
                  </PaginationItem>
              </PaginationContent>
           </Pagination>

          {/* Right Side: Rows per page */}
            <div className="flex items-center space-x-2 min-w-[200px] justify-center lg:justify-end">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <select
                value={table.getState().pagination.pageSize}
                aria-label="show"
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value))
                }}
                className="h-8 w-14 rounded-md border border-input bg-white px-2 py-1 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {[5, 10, 20, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
        </div>
    </div>
  )
}
