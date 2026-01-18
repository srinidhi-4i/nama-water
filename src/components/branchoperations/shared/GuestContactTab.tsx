"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { GuestContactData } from "@/types/guestservices.types"

interface GuestContactTabProps {
  data: GuestContactData
  onChange: (data: Partial<GuestContactData>) => void
  errors?: Partial<Record<keyof GuestContactData, string>>
}

export function GuestContactTab({ data, onChange, errors }: GuestContactTabProps) {
  const handleChange = (field: keyof GuestContactData, value: string) => {
    onChange({ [field]: value })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Label htmlFor="personName" className="text-sm font-medium text-gray-700">
          Contact Person Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="personName"
          type="text"
          value={data.personName}
          onChange={(e) => handleChange("personName", e.target.value)}
          placeholder="Enter your full name"
          className={`mt-1 ${errors?.personName ? "border-red-500" : ""}`}
        />
        {errors?.personName && (
          <p className="text-sm text-red-500 mt-1">{errors.personName}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
          GSM Number <span className="text-red-500">*</span>
        </Label>
        <div className="flex mt-1">
          <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
            +968
          </span>
          <Input
            id="phoneNumber"
            type="tel"
            value={data.phoneNumber}
            onChange={(e) => {
              const value = e.target.value
              // Only allow digits and limit to 8 characters
              if (/^\d{0,8}$/.test(value)) {
                handleChange("phoneNumber", value)
              }
            }}
            placeholder="12345678"
            maxLength={8}
            className={`rounded-l-none ${errors?.phoneNumber ? "border-red-500" : ""}`}
          />
        </div>
        {errors?.phoneNumber && (
          <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Enter 8-digit mobile number (must start with 7 or 9)
        </p>
      </div>

      <div>
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          E-mail ID
        </Label>
        <Input
          id="email"
          type="email"
          value={data.email || ""}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="example@email.com"
          className={`mt-1 ${errors?.email ? "border-red-500" : ""}`}
        />
        {errors?.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">Optional</p>
      </div>
    </div>
  )
}
