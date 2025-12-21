"use client"

import { Button } from "@/components/ui/button"
import { Eye, Edit } from "lucide-react"
import { NotificationTemplate } from "@/types/notification.types"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"

const columnHelper = createColumnHelper<NotificationTemplate>()

export const getNotificationTemplateColumns = (
  onEdit: (item: NotificationTemplate) => void,
  onView: (item: NotificationTemplate) => void
): ColumnDef<NotificationTemplate, any>[] => [
  columnHelper.accessor('EventTypeEn', {
    header: 'Event Type',
    size:310,
    cell: info => <span className="font-medium">{info.getValue()}</span>
  }),
  columnHelper.accessor('NotificationTitleEn', {
    header: 'Template Name',
    size:310,
    cell: info => info.getValue()
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    size: 330,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row.original)}
          title="Edit"
          className="h-8 w-8 text-gray-500 hover:text-[#0A3B4C]"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(row.original)}
          title="View"
          className="h-8 w-8 text-gray-500 hover:text-[#0A3B4C]"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    ),
  }),
]
