"use client"

import { Button } from "@/components/ui/button"
import { Eye, Edit } from "lucide-react"
import { CustomNotification } from "@/types/notification.types"
import { format } from "date-fns"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"

const columnHelper = createColumnHelper<CustomNotification>()

export const getCustomNotificationColumns = (
  onEdit: (item: CustomNotification) => void,
  onView: (item: CustomNotification) => void
): ColumnDef<CustomNotification, any>[] => [
  columnHelper.accessor('EventTypeEn', {
    header: 'Event Type',
    cell: info => <span className="font-medium">{info.getValue()}</span>
  }),
  columnHelper.accessor('Status', {
    header: 'Status',
    cell: info => info.getValue()
  }),
  columnHelper.accessor('CreatedDateTime', {
    header: 'Created Date and Time',
    cell: info => format(new Date(info.getValue()), 'dd/MM/yyyy HH:mm')
  }),
  columnHelper.accessor('ScheduledDateTime', {
    header: 'Scheduled Date and Time',
    cell: info => format(new Date(info.getValue()), 'dd/MM/yyyy HH:mm')
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(row.original)}
          title="View"
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4 text-[#006A72]" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row.original)}
          title="Edit"
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4 text-[#006A72]" />
        </Button>
      </div>
    ),
  }),
]
