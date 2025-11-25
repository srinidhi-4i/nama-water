"use client"

import { useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { cn } from "@/lib/utils"

interface Announcement {
  ID: number
  AnnoncementContentEN: string
  AnnouncementContentAR: string
}

interface AnnouncementBannerProps {
  announcements: Announcement[]
  language?: "EN" | "AR"
}

export function AnnouncementBanner({ announcements, language = "EN" }: AnnouncementBannerProps) {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, axis: "y" },
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  )

  if (!announcements || announcements.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-3">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <h3 className="text-lg font-semibold">
              {language === "EN" ? "Announcements" : "الإعلانات"}
            </h3>
          </div>
          
          <div className="flex-1 overflow-hidden" ref={emblaRef}>
            <div className="flex flex-col">
              {announcements.map((announcement) => (
                <div
                  key={announcement.ID}
                  className="min-h-[40px] flex items-center"
                >
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{
                      __html: language === "EN" 
                        ? announcement.AnnoncementContentEN 
                        : announcement.AnnouncementContentAR
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
