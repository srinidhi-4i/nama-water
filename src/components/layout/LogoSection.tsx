"use client"

import Image from "next/image"

export function LogoSection() {
  return (
    <div className="bg-white py-3 px-4 border-b border-gray-200">
      <div className="flex items-center">
        <Image
          src="/Assets/Images/global/nama_logo.png"
          alt="Nama Water Services"
          width={120}
          height={40}
          className="object-contain"
        />
      </div>
    </div>
  )
}
