import { AppointmentIcon } from "@/components/icons/appointment-icon"
import { BranchIcon } from "@/components/icons/branch-icon"
import { NotificationIcon } from "@/components/icons/notification-icon"
import { WaterIcon } from "@/components/icons/water-icon"
import { WetlandIcon } from "@/components/icons/wetland-icon"
import { Home } from "lucide-react"

export const renderSidebarIcon = (icon: string) => {
  switch (icon) {
    case "home":
      return <Home className="w-5 h-5" />
    case "branch":
      return (<BranchIcon className="w-5 h-5" />)
    case "appointment":
      return (<AppointmentIcon className="w-5 h-5" />)
    case "wetland":
      return (<WetlandIcon className="w-5 h-5" />)
    case "notification":
      return (<NotificationIcon className="w-5 h-5" />)
    case "water":
      return (<WaterIcon className="w-5 h-5" />)
    default:
      return null
  }
}
