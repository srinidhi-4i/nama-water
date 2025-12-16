"use client"

import { Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Eye, Edit } from "lucide-react"
import { NotificationTemplate } from "@/types/notification.types"

// We need to define the handlers or pass them in some way. 
// For columns.tsx, usually we define the structure. 
// If actions need to call component functions, we might need a way to pass callbacks.
// The data-table usually accepts `meta` or we can define columns inside the component using useMemo if handlers are needed.
// However, looking at the previous example (watershutdown), the actions were just `console.log`.
// In `notificationtemplate`, there are `handleEdit` and `handleView`.
// I will define the columns structure here, but the `actions` column might need to be defined IN the component 
// OR I can export a function that accepts handlers, 
// OR I can use the standard approach where the cell renderer uses a specific component that has access to the handlers (e.g. via Context or specific Props if DataTable supports it).
// But `DataTable` in this project seems simple.
// The previous `watershutdown` columns had `console.log`.
// Here we have actual logic.
// For now, I will export the columns that DO NOT depend on local state (like simple data columns).
// And maybe the Actions column needs to be constructed in the component.
// OR I can export a function `getColumns(onEdit, onView)`?
// Let's stick to the pattern: if `columns.tsx` is required, maybe it's just for the static definitions?
// User said: "table columns must be defined in columns.tsx".
// To support actions, I'll export a function `getColumns`.

export const getColumns = (
  onEdit: (item: NotificationTemplate) => void,
  onView: (item: NotificationTemplate) => void
): Column<NotificationTemplate>[] => [
  {
    key: 'EventTypeEn',
    header: 'Event Type',
    className: 'font-medium',
  },
  {
    key: 'NotificationTitleEn',
    header: 'Template Name',
  },
  {
    key: 'actions',
    header: 'Actions',
    render: (item) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(item)}
          title="Edit"
          className="h-8 w-8 text-gray-500 hover:text-[#0A3B4C]"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(item)}
          title="View"
          className="h-8 w-8 text-gray-500 hover:text-[#0A3B4C]"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
]
