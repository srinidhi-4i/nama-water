"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ServiceCardProps {
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  icon: string
  href?: string
  onClick?: () => void
  language?: "EN" | "AR"
  isAvailable?: boolean
  className?: string
}

export function ServiceCard({
  titleEn,
  titleAr,
  descriptionEn,
  descriptionAr,
  icon,
  href,
  onClick,
  language = "EN",
  isAvailable = true,
  className,
}: ServiceCardProps) {
  const title = language === "EN" ? titleEn : titleAr
  const description = language === "EN" ? descriptionEn : descriptionAr

  const content = (
    <Card className={cn(
      "h-full transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer",
      !isAvailable && "opacity-60 cursor-not-allowed",
      className
    )}>
      <CardContent className="flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-16 h-16 flex items-center justify-center">
          {icon.startsWith('/') || icon.startsWith('http') ? (
            <Image
              src={icon}
              alt={title}
              width={64}
              height={64}
              className="object-contain"
            />
          ) : (
            <span className={cn(icon, "text-5xl text-teal-700")} />
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </CardContent>
    </Card>
  )

  if (onClick) {
    return (
      <div onClick={isAvailable ? onClick : undefined}>
        {content}
      </div>
    )
  }

  if (href && isAvailable) {
    return <Link href={href}>{content}</Link>
  }

  return <div>{content}</div>
}
