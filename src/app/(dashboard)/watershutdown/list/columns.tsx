"use client"

import { Button } from "@/components/ui/button"
import { Eye, Download, Edit } from "lucide-react"
import { format } from "date-fns"
import { WaterShutdownNotification, WaterShutdownStatus } from "@/types/watershutdown.types"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"

const columnHelper = createColumnHelper<WaterShutdownNotification>()

export const getWaterShutdownColumns = ({
    onView,
    onDownload,
    onEdit,
    onSMS,
    onComplete
}: {
    onView?: (id: string) => void,
    onDownload?: (id: string) => void,
    onEdit?: (id: string) => void,
    onSMS?: (id: string) => void,
    onComplete?: (id: string) => void
}): ColumnDef<WaterShutdownNotification, any>[] => [
    columnHelper.accessor('eventId', {
        header: 'Event ID',
        size: 120, 
        cell: info => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor('eventType', {
        header: 'Event Name',
        size: 150,
        cell: (info) => (
      <Input
        value={info.getValue()}
        readOnly
        className="w-full border-none shadow-none p-0"
      />
    ),
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        size: 150,
        cell: (info) => (
      <Input
        value={info.getValue()}
        readOnly
        className="w-full border-none shadow-none p-0"
      />
    ),
    }),
    columnHelper.accessor('region', {
        header: 'Region',
        size: 100,
        cell: (info) => (
        <Input
        value={info.getValue()}
        readOnly
        className="w-full border-none shadow-none p-0"
      />
    ),
    }),
    columnHelper.accessor('startDateTime', {
        header: 'Start Date & Time',
        size: 150,
        cell: info => format(new Date(info.getValue()), 'dd/MM/yyyy HH:mm')
    }),
    columnHelper.accessor('endDateTime', {
        header: 'End Date & Time',
        size: 150,
        cell: info => format(new Date(info.getValue()), 'dd/MM/yyyy HH:mm')
    }),
    columnHelper.display({
        id: 'actions',
        header: 'C/L Actions',
        size: 200,
        cell: ({ row }) => {
             const item = row.original;
             return (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView?.(item.internalId?.toString() || item.eventId)}
                  title="View"
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4 text-[#006A72]" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownload?.(item.internalId?.toString() || item.eventId)}
                  title="Download"
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4 text-[#006A72]" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(item.internalId?.toString() || item.eventId)}
                  title="Edit"
                  className="h-8 w-8 p-0"
                  disabled={item.status === 'COMPLETED' || item.status === 'CANCELLED' || item.status === '2'}
                >
                  <Edit className="h-4 w-4 text-[#006A72]" />
                </Button>
                 <Button 
                  variant="ghost" 
                  size="sm" 
                  title="Intermediate SMS"
                  className="h-8 w-8 p-0"
                  onClick={() => onSMS?.(item.internalId?.toString() || item.eventId)}
                  disabled={!isActionEnabled(item, 'SMS')}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006A72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square-text"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/></svg>
                 </Button>
                 <Button 
                  variant="ghost" 
                  size="sm" 
                  title="Completion Notification"
                  className="h-8 w-8 p-0"
                  onClick={() => onComplete?.(item.internalId?.toString() || item.eventId)}
                  disabled={!isActionEnabled(item, 'COMPLETE')}
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006A72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                 </Button>
              </div>

            )
        }
    })
]

function isActionEnabled(item: WaterShutdownNotification, type: 'SMS' | 'COMPLETE'): boolean {
    const isEnded = ['COMPLETED', 'CANCELLED', 'COMPLETION TRIGGERED'].includes(item.status);

    if (type === 'SMS') {
        // SMS enabled if Not Ended (allow seeing history even if not started)
        return !isEnded;
    }
    
    if (type === 'COMPLETE') {
         // Completion enabled if Started AND Not Ended
        const now = new Date();
        const startDate = new Date(item.startDateTime);
        const isStarted = now >= startDate;
        return isStarted && !isEnded;
    }
    
    return true;
}
