"use client"

import { Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Download, Edit } from "lucide-react"
import { format } from "date-fns"
import { WaterShutdownNotification, WaterShutdownStatus } from "@/types/watershutdown.types"

const getStatusBadge = (status: WaterShutdownStatus) => {
  switch (status) {
    case "SCHEDULED":
      return <Badge variant="secondary">Scheduled</Badge>
    case "CUSTOMER_TRIG":
      return <Badge variant="destructive">Customer Triggered</Badge>
    case "COMPLETED":
      return <Badge variant="default">Completed</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export const columns: Column<WaterShutdownNotification>[] = [
  {
    key: 'eventId',
    header: 'Event ID',
    className: 'font-medium',
  },
  {
    key: 'eventType',
    header: 'Event Name',
  },
  {
    key: 'status',
    header: 'Status',
    render: (item) => getStatusBadge(item.status),
  },
  {
    key: 'region',
    header: 'Region',
  },
  {
    key: 'startDateTime',
    header: 'Start Date & Time',
    render: (item) => format(new Date(item.startDateTime), 'dd/MM/yyyy HH:mm'),
  },
  {
    key: 'endDateTime',
    header: 'End Date & Time',
    render: (item) => format(new Date(item.endDateTime), 'dd/MM/yyyy HH:mm'),
  },
  {
    key: 'actions',
    header: 'C/L Actions',
    render: (item) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => console.log('View', item.eventId)}
          title="View"
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4 text-[#006A72]" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => console.log('Download', item.eventId)}
          title="Download"
          className="h-8 w-8 p-0"
        >
          <Download className="h-4 w-4 text-[#006A72]" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => console.log('Edit', item.eventId)}
          title="Edit"
          className="h-8 w-8 p-0"
          disabled={item.status === 'COMPLETED'}
        >
          <Edit className="h-4 w-4 text-[#006A72]" />
        </Button>
         <Button 
          variant="ghost" 
          size="sm" 
          title="Intermediate SMS"
          className="h-8 w-8 p-0"
          onClick={() => console.log('Intermediate SMS', item.eventId)}
         >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006A72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square-text"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/></svg>
         </Button>
         <Button 
          variant="ghost" 
          size="sm" 
          title="Completion Notification"
          className="h-8 w-8 p-0"
          onClick={() => console.log('Completion', item.eventId)}
         >
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006A72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
         </Button>
      </div>
    ),
  },
]
