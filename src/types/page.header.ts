export interface BreadcrumbItem {
  labelEn: string
  labelAr: string
  href?: string  // If undefined, it's the current page (not clickable)
}

export interface PageHeaderProps {
  language: string
  titleEn: string
  titleAr: string
  breadcrumbEn?: string  // Deprecated: use breadcrumbItems instead
  breadcrumbAr?: string  // Deprecated: use breadcrumbItems instead
  breadcrumbItems?: BreadcrumbItem[]  // New: dynamic breadcrumb trail
  showShadow?: boolean
}