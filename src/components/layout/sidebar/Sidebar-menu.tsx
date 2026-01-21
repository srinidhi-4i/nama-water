export interface SidebarChild {
  label: string
  labelAr: string
  href: string
}

export interface SidebarMenu {
  label: string
  labelAr: string
  icon: string
  children: SidebarChild[]
}

export const STATIC_LINKS = [
  { label: "Home", labelAr: "الرئيسية", href: "/branchhome", icon: "home" },
]

export const EXPANDABLE_MENUS: SidebarMenu[] = [
  
  {
    label: "Appointment Booking",
    labelAr: "حجز المواعيد",
    icon: "appointment",
    children: [
      { label: "Appointments", labelAr: "المواعيد", href: "/appointment-booking/appointments" },
      { label: "Appointments Display", labelAr: "عرض المواعيد", href: "/appointment-booking/appointments-display" },
      { label: "Generate Token", labelAr: "إنشاء رمز", href: "/appointment-booking/generate-token" },
      { label: "Holiday Calendar", labelAr: "تقويم العطلات", href: "/appointment-booking/holiday-calendar" },
      { label: "Slot Creation", labelAr: "إنشاء فترة", href: "/appointment-booking/slot-creation" },
      { label: "Supervisor Actions", labelAr: "إجراءات المشرف", href: "/appointment-booking/supervisor-actions" },
      { label: "Walk-in Setup", labelAr: "إعداد الحضور", href: "/appointment-booking/walk-in-setup" },
    ],
  },
  {
    label: "Branch Operations",
    labelAr: "عمليات الفرع",
    icon: "branch",
    children: [
      { label: "Validate/Search Customer", labelAr: "التحقق/البحث عن عميل", href: "/branch-operations/validate" },
      { label: "Guest User Services", labelAr: "خدمات الزوار", href: "/branch-operations/guest" },
    ],
  },
  
  {
    label: "Notification Center",
    labelAr: "مركز الإشعارات",
    icon: "notification",
    children: [
      { label: "Notification Templates", labelAr: "قوالب الإشعارات", href: "/notification-center/templates" },
      { label: "Custom Notification", labelAr: "إشعار مخصص", href: "/notification-center/custom" },
    ],
  },
  {
    label: "Water Shutdown",
    labelAr: "انقطاع المياه",
    icon: "water",
    children: [
      { label: "Water shutdown Notification List", labelAr: "قائمة إشعارات انقطاع المياه", href: "/watershutdown/list" },
      { label: "Water shutdown Templates", labelAr: "قوالب انقطاع المياه", href: "/watershutdown/templates" },
    ],
  },
  {
    label: "Wetland",
    labelAr: "الأراضي الرطبة",
    icon: "wetland",
    children: [
      { label: "Slot Creation", labelAr: "إنشاء فترة", href: "/wetland/slot-creation" },
      { label: "Holiday Calendar", labelAr: "تقويم العطلات", href: "/wetland/holiday-calendar" },
      { label: "Supervisor Actions", labelAr: "إجراءات المشرف", href: "/wetland/supervisor-actions" },
    ],
  },
]
