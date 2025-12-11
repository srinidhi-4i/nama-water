"use client"

import Image from "next/image"

export function LogoSection() {
  return (
    <div className="bg-white py-2 px-6 border-b border-gray-200">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* Left Logo - Oman 2040 */}
        <div className="flex-shrink-0">
          <Image
            src="/Assets/Images/global/Oman_2040.png"
            alt="Oman 2040"
            width={140}
            height={50}
            className="object-contain"
          />
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Right Logo - Nama Water Services */}
        <div className="flex-shrink-0">
          <Image
            src="/Assets/Images/global/nama_logo.png"
            alt="Nama Water Services"
            width={140}
            height={50}
            className="object-contain"
          />
        </div>
      </div>
    </div>
  )
}
