"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'

interface GoogleMapPickerProps {
  center: { lat: number; lng: number }
  onLocationChange: (location: { lat: number; lng: number; address: string }) => void
  apiKey: string
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export function GoogleMapPicker({ center, onLocationChange, apiKey }: GoogleMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [autocomplete, setAutocomplete] = useState<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // Load Google Maps script
  useEffect(() => {
    if (window.google) {
      setScriptLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setScriptLoaded(true)
    document.head.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [apiKey])

  // Initialize map
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current || map) return

    const google = window.google
    
    // Create map
    const newMap = new google.maps.Map(mapRef.current, {
      zoom: 12,
      center: center,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    })

    // Create marker
    const newMarker = new google.maps.Marker({
      map: newMap,
      position: center,
      title: 'Water Leakage Location',
      draggable: false,
      animation: google.maps.Animation.DROP,
    })

    // Bind marker to map center
    newMarker.bindTo('position', newMap, 'center')

    // Listen to map center changes
    newMap.addListener('mouseup', () => {
      const position = newMarker.getPosition()
      const lat = position.lat()
      const lng = position.lng()

      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          onLocationChange({
            lat,
            lng,
            address: results[0].formatted_address
          })
        } else {
          onLocationChange({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` })
        }
      })
    })

    setMap(newMap)
    setMarker(newMarker)

    // Initialize autocomplete
    const input = document.getElementById('map-search-input') as HTMLInputElement
    if (input) {
      const newAutocomplete = new google.maps.places.Autocomplete(input, {
        types: [],
        componentRestrictions: { country: 'OM' },
      })

      newAutocomplete.bindTo('bounds', newMap)
      newAutocomplete.setFields(['address_components', 'geometry', 'name'])

      newAutocomplete.addListener('place_changed', () => {
        const place = newAutocomplete.getPlace()
        
        if (!place.geometry || !place.geometry.location) {
          return
        }

        const location = place.geometry.location
        newMap.setCenter(location)
        newMap.setZoom(17)

        onLocationChange({
          lat: location.lat(),
          lng: location.lng(),
          address: place.formatted_address || place.name
        })
      })

      setAutocomplete(newAutocomplete)
    }
  }, [scriptLoaded, center, onLocationChange, map])

  return (
    <div className="space-y-3">
      <Input
        id="map-search-input"
        type="text"
        placeholder="Enter water leaks position"
        className="w-full"
      />
      <div 
        ref={mapRef} 
        className="w-full h-[400px] rounded-lg border border-gray-300"
        style={{ minHeight: '400px' }}
      />
      <p className="text-xs text-gray-500">
        Click and drag the map to position the marker at the exact leakage location
      </p>
    </div>
  )
}
