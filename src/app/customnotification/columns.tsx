"use client"

import { Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Eye, Edit } from "lucide-react"
import { CustomNotification } from "@/types/notification.types"
import { format } from "date-fns"

export const getColumns = (
  onEdit: (item: CustomNotification) => void,
  onView: (item: CustomNotification) => void
): Column<CustomNotification>[] => [
  {
    key: 'EventTypeEn',
    header: 'Event Type',
    className: 'font-medium',
  },
  {
    key: 'Status',
    header: 'Status',
  },
  {
    key: 'CreatedDateTime',
    header: 'Created Date and Time',
    render: (item) => format(new Date(item.CreatedDateTime), 'dd/MM/yyyy HH:mm'),
  },
  {
    key: 'ScheduledDateTime',
    header: 'Scheduled Date and Time',
    render: (item) => format(new Date(item.ScheduledDateTime), 'dd/MM/yyyy HH:mm'),
  },
  {
    key: 'actions',
    header: 'Actions',
    render: (item) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(item)}
          title="View"
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4 text-[#006A72]" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(item)}
          title="Edit"
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4 text-[#006A72]" />
        </Button>
      </div>
    ),
  },
]
