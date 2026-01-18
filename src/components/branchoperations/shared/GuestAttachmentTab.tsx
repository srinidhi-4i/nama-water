"use client"

import React, { useRef } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText } from "lucide-react"
import { GuestAttachmentData } from "@/types/guestservices.types"

interface GuestAttachmentTabProps {
  data: GuestAttachmentData
  onChange: (data: Partial<GuestAttachmentData>) => void
  maxFiles?: number
  maxSizeMB?: number
  showDescription?: boolean
  descriptionLabel?: string
  descriptionMaxLength?: number
  errors?: Partial<Record<keyof GuestAttachmentData, string>>
}

export function GuestAttachmentTab({
  data,
  onChange,
  maxFiles = 3,
  maxSizeMB = 5,
  showDescription = true,
  descriptionLabel = "Details",
  descriptionMaxLength = 400,
  errors
}: GuestAttachmentTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/bmp"]
    const maxSize = maxSizeMB * 1024 * 1024

    if (!allowedTypes.includes(file.type)) {
      return "Only JPG, PNG, and BMP files are allowed"
    }

    if (file.size > maxSize) {
      return `File size must be less than ${maxSizeMB}MB`
    }

    if (file.name.length > 100) {
      return "Filename must be less than 100 characters"
    }

    return null
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const currentFiles = data.files || []

    if (currentFiles.length + selectedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    const validFiles: File[] = []
    for (const file of selectedFiles) {
      const error = validateFile(file)
      if (error) {
        alert(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    }

    if (validFiles.length > 0) {
      onChange({ files: [...currentFiles, ...validFiles] })
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = [...data.files]
    newFiles.splice(index, 1)
    onChange({ files: newFiles })
  }

  const handleDescriptionChange = (value: string) => {
    if (value.length <= descriptionMaxLength) {
      onChange({ description: value })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Attachments
        </Label>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Maximum {maxFiles} files, {maxSizeMB}MB each (JPG, PNG, BMP only)
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Browse Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.bmp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {errors?.files && (
          <p className="text-sm text-red-500 mt-2">{errors.files}</p>
        )}

        {data.files && data.files.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Selected Files ({data.files.length}/{maxFiles})
            </p>
            {data.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDescription && (
        <div>
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            {descriptionLabel}
          </Label>
          <Textarea
            id="description"
            value={data.description || ""}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder={`Enter ${descriptionLabel.toLowerCase()}...`}
            rows={4}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            {(data.description || "").length}/{descriptionMaxLength} characters
          </p>
          {errors?.description && (
            <p className="text-sm text-red-500 mt-1">{errors.description}</p>
          )}
        </div>
      )}
    </div>
  )
}
