"use client"

import React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface GuestSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  requestNumber: string
  title?: string
  message?: string
}

export function GuestSuccessModal({
  isOpen,
  onClose,
  requestNumber,
  title = "Request Submitted Successfully",
  message = "Your request has been registered successfully."
}: GuestSuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Request Number</p>
            <p className="text-2xl font-bold text-blue-600">{requestNumber}</p>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Please save this request number for future reference. You can use it to track the status of your request.
          </p>

          <Button
            onClick={onClose}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            Go to Home
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
