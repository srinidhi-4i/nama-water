"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export type WalkInStatistic = {
  category: string
  categoryAr: string
  online: number
  walkIn: number
  showEdit?: boolean
  onEdit?: (newValue: number) => void
}

// Editable cell component for Walk-In column
function EditableWalkInCell({ row }: { row: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(row.original.walkIn)
  const showEdit = row.original.showEdit

  const handleSave = () => {
    row.original.onEdit?.(value)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setValue(row.original.walkIn)
    setIsEditing(false)
  }

  const increment = () => setValue((prev: number) => prev + 1)
  const decrement = () => setValue((prev: number) => Math.max(0, prev - 1))

  if (!showEdit) {
    return <div className="text-center text-xs py-1">{row.original.walkIn}</div>
  }

  if (isEditing) {
    return (
      <div className="flex items-center justify-center gap-1">
        <div className="flex items-center border rounded">
          
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(parseInt(e.target.value) || 0)}
            className="w-12 h-6 text-center text-xs border-0 border-x p-0"
          />
         
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          className="h-6 w-6 p-0 hover:bg-green-100"
        >
          <Check className="h-3 w-3 text-green-600" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-6 w-6 p-0 hover:bg-red-100"
        >
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <span className="text-xs">{row.original.walkIn}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 hover:bg-teal-50"
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="h-3 w-3 text-teal-600" />
      </Button>
    </div>
  )
}

export const columns: ColumnDef<WalkInStatistic>[] = [
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <div className="text-left font-semibold text-xs">
          Appointments
        </div>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-between py-1">
          <span className="text-xs">{row.getValue("category")}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "online",
    header: ({ column }) => {
      return (
        <div className="text-center font-semibold text-xs">
          Online
        </div>
      )
    },
    cell: ({ row }) => {
      return <div className="text-center text-xs py-1">{row.getValue("online")}</div>
    },
  },
  {
    accessorKey: "walkIn",
    header: ({ column }) => {
      return (
        <div className="text-center font-semibold text-xs">
          Walk-In
        </div>
      )
    },
    cell: ({ row }) => {
      return <EditableWalkInCell row={row} />
    },
  },
]
