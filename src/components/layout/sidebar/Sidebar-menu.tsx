export interface SidebarChild {
  label: string
  href: string
}

export interface SidebarMenu {
  label: string
  icon: string
  children: SidebarChild[]
}

export const STATIC_LINKS = [
  { label: "Home", href: "/branchhome", icon: "home" },
]

export const EXPANDABLE_MENUS: SidebarMenu[] = [
  
  {
    label: "Appointment Booking",
    icon: "appointment",
    children: [
      { label: "Appointments", href: "/appointment-booking/appointments" },
      { label: "Appointments Display", href: "/appointment-booking/appointments-display" },
      { label: "Generate Token", href: "/appointment-booking/generate-token" },
      { label: "Holiday Calendar", href: "/appointment-booking/holiday-calendar" },
      { label: "Slot Creation", href: "/appointment-booking/slot-creation" },
      { label: "Supervisor Actions", href: "/appointment-booking/supervisor-actions" },
      { label: "Walk-in Setup", href: "/appointment-booking/walk-in-setup" },
    ],
  },
  {
    label: "Branch Operations",
    icon: "branch",
    children: [
      { label: "Validate/Search Customer", href: "/branch-operations/validate" },
      { label: "Guest User Services", href: "/branch-operations/guest" },
    ],
  },
  
  {
    label: "Notification Center",
    icon: "notification",
    children: [
      { label: "Notification Templates", href: "/notification-center/templates" },
      { label: "Custom Notification", href: "/notification-center/custom" },
    ],
  },
  {
    label: "Water Shutdown",
    icon: "water",
    children: [
      { label: "Water shutdown Notification List", href: "/watershutdown/list" },
      { label: "Water shutdown Templates", href: "/watershutdown/templates" },
    ],
  },
  {
    label: "Wetland",
    icon: "wetland",
    children: [
      { label: "Slot Creation", href: "/wetland/slot-creation" },
      { label: "Holiday Calendar", href: "/wetland/holiday-calendar" },
      { label: "Supervisor Actions", href: "/wetland/supervisor-actions" },
    ],
  },
]
