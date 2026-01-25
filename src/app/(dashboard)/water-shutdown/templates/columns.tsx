"use client"

import { Button } from "@/components/ui/button"
import { Eye, Edit } from "lucide-react"
import { WaterShutdownTemplate } from "@/types/watershutdown.types"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"

const columnHelper = createColumnHelper<WaterShutdownTemplate>()

export const getWaterShutdownTemplateColumns = ({
    onView,
    onEdit
}: {
    onView?: (item: WaterShutdownTemplate) => void,
    onEdit?: (item: WaterShutdownTemplate) => void
}): ColumnDef<WaterShutdownTemplate, any>[] => [
    columnHelper.accessor((row: any) => row.EventTypeNameEn || row.EventTypeName || row.eventType || "N/A", {
        id: 'EventTypeNameEn',
        header: 'Event Type',
        size: 250,
        cell: info => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor((row: any) => row.TemplateTypeNameEn || row.TemplateType || row.TemplateTypeName || "N/A", {
        id: 'TemplateTypeNameEn',
        header: 'Template Type',
        size: 250,
        cell: (info) => (
            <Input
                value={info.getValue()}
                readOnly
                className="w-full border-none shadow-none p-0 bg-transparent text-gray-700"
            />
        ),
    }),
    columnHelper.display({
        id: 'actions',
        header: 'Actions',
        size: 150,
        cell: ({ row }) => {
             const item = row.original;
             return (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(item)}
                  title="Edit"
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4 text-[#006A72]" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView?.(item)}
                  title="View"
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4 text-[#006A72]" />
                </Button>
              </div>
            )
        }
    })
]
