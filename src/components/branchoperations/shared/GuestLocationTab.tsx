"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { GoogleMapPicker } from "../GoogleMapPicker"
import { GuestLocationData } from "@/types/guestservices.types"
import { MapPin } from "lucide-react"

interface GuestLocationTabProps {
  data: GuestLocationData
  onChange: (data: Partial<GuestLocationData>) => void
  googleApiKey: string
  errors?: Partial<Record<keyof GuestLocationData, string>>
}

export function GuestLocationTab({ data, onChange, googleApiKey, errors }: GuestLocationTabProps) {
  const handleLocationChange = (location: { lat: number; lng: number; address: string }) => {
    onChange({
      latitude: location.lat,
      longitude: location.lng,
      displayAddress: location.address
    })
  }

  const handleFieldChange = (field: keyof GuestLocationData, value: string) => {
    onChange({ [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Location <span className="text-red-500">*</span>
        </Label>
        {googleApiKey ? (
          <GoogleMapPicker
            center={{ lat: data.latitude, lng: data.longitude }}
            onLocationChange={handleLocationChange}
            apiKey={googleApiKey}
          />
        ) : (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
            <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Google Maps Configuration Required</h3>
            <p className="text-gray-700 mb-4">
              To enable location selection, please add your Google Maps API key to the system configuration.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              For now, you can proceed by entering Way Number and Building Number below.
            </p>
          </div>
        )}
        {errors?.displayAddress && (
          <p className="text-sm text-red-500 mt-2">{errors.displayAddress}</p>
        )}
        {data.displayAddress && (
          <div className="mt-2 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-700">{data.displayAddress}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="wayNo" className="text-sm font-medium text-gray-700">
            Way Number
          </Label>
          <Input
            id="wayNo"
            type="text"
            value={data.wayNo || ""}
            onChange={(e) => {
              const value = e.target.value
              if (/^[0-9a-zA-Z\s,._-]*$/.test(value)) {
                handleFieldChange("wayNo", value)
              }
            }}
            placeholder="Way Number"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="buildingNo" className="text-sm font-medium text-gray-700">
            Building Number
          </Label>
          <Input
            id="buildingNo"
            type="text"
            value={data.buildingNo || ""}
            onChange={(e) => {
              const value = e.target.value
              if (/^[0-9a-zA-Z\s,._-]*$/.test(value)) {
                handleFieldChange("buildingNo", value)
              }
            }}
            placeholder="Building Number"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  )
}
