"use client"

import React, { useRef, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import { GuestOTPData } from "@/types/guestservices.types"

interface GuestOTPTabProps {
  data: GuestOTPData
  onChange: (data: Partial<GuestOTPData>) => void
  phoneNumber: string
  onResendOTP: () => void
  canResend: boolean
  resendTimer?: number
  errors?: Partial<Record<keyof GuestOTPData, string>>
}

export function GuestOTPTab({
  data,
  onChange,
  phoneNumber,
  onResendOTP,
  canResend,
  resendTimer = 0,
  errors
}: GuestOTPTabProps) {
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ]

  const otpDigits = data.otp.split("").concat(["", "", "", ""]).slice(0, 4)

  useEffect(() => {
    // Auto-focus first input on mount
    inputRefs[0].current?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtpDigits = [...otpDigits]
    newOtpDigits[index] = value.slice(-1) // Take only last digit

    const newOtp = newOtpDigits.join("")
    onChange({ otp: newOtp })

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4)
    if (pastedData.length === 4) {
      onChange({ otp: pastedData })
      inputRefs[3].current?.focus()
    }
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          OTP Verification
        </h3>
        <p className="text-sm text-gray-600">
          We've sent a 4-digit OTP to <span className="font-medium">+968 {phoneNumber}</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Please enter the OTP to verify your mobile number
        </p>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block text-center">
          Enter OTP
        </Label>
        <div className="flex justify-center gap-3" onPaste={handlePaste}>
          {otpDigits.map((digit, index) => (
            <Input
              key={index}
              ref={inputRefs[index]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-14 h-14 text-center text-2xl font-semibold"
            />
          ))}
        </div>
        {errors?.otp && (
          <p className="text-sm text-red-500 mt-2 text-center">{errors.otp}</p>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">
          Didn't receive the OTP?
        </p>
        {canResend ? (
          <Button
            type="button"
            variant="link"
            onClick={onResendOTP}
            className="text-blue-600 hover:text-blue-700"
          >
            Resend OTP
          </Button>
        ) : (
          <p className="text-sm text-gray-500">
            Resend available in {resendTimer}s
          </p>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> OTP is valid for 5 minutes. Please enter it before it expires.
        </p>
      </div>
    </div>
  )
}
