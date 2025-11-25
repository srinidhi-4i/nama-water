"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Image from "next/image"

interface AppointmentCategory {
  ID: number
  CategoryCode: string
  NameEn: string
  NameAr: string
}

interface AppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentType: "Branch" | "WetLand" | null
  appointmentCategories?: AppointmentCategory[]
  language?: "EN" | "AR"
  onSubmit: (data: any) => void
}

export function AppointmentModal({
  open,
  onOpenChange,
  appointmentType,
  appointmentCategories = [],
  language = "EN",
  onSubmit,
}: AppointmentModalProps) {
  const [selectedOption, setSelectedOption] = useState<"new" | "exist" | "">("")
  const [selectedVisitType, setSelectedVisitType] = useState("")
  const [idOrGsmNumber, setIdOrGsmNumber] = useState("")

  const handleSubmit = () => {
    if (selectedOption === "new") {
      if (appointmentType === "Branch") {
        // Navigate to appointment booking with visit type
        onSubmit({ type: "new", visitType: selectedVisitType })
      } else {
        // Navigate to wetland booking
        onSubmit({ type: "new", appointmentType: "WetLand" })
      }
    } else if (selectedOption === "exist") {
      // Navigate to history page
      onSubmit({ type: "exist", identifier: idOrGsmNumber, appointmentType })
    }
  }

  const handleClose = () => {
    setSelectedOption("")
    setSelectedVisitType("")
    setIdOrGsmNumber("")
    onOpenChange(false)
  }

  const isSubmitDisabled = () => {
    if (!selectedOption) return true
    if (selectedOption === "new" && appointmentType === "Branch" && !selectedVisitType) return true
    if (selectedOption === "exist" && !idOrGsmNumber) return true
    return false
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {language === "EN" ? "Book an Appointment" : "حجز موعد"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <h4 className="font-medium mb-4">
              {language === "EN" 
                ? "Do you want to create a new appointment or view an existing one?" 
                : "هل تريد إنشاء موعد جديد أو عرض موعد موجود؟"}
            </h4>

            <RadioGroup value={selectedOption} onValueChange={(value: any) => {
              setSelectedOption(value)
              setSelectedVisitType("")
              setIdOrGsmNumber("")
            }}>
              <div className="flex items-center space-x-2 mb-3">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="cursor-pointer">
                  {language === "EN" ? "New Appointment Request" : "طلب موعد جديد"}
                </Label>
              </div>

              {selectedOption === "new" && appointmentType === "Branch" && (
                <div className="ml-6 space-y-2 mb-4">
                  {appointmentCategories.map((category) => (
                    <div key={category.ID} className="flex items-center space-x-3">
                      <RadioGroupItem 
                        value={category.CategoryCode} 
                        id={`visit-${category.ID}`}
                        checked={selectedVisitType === category.CategoryCode}
                        onClick={() => setSelectedVisitType(category.CategoryCode)}
                      />
                      <Image
                        src={category.ID === 1 
                          ? "/Assets/Images/branchVisitIcon.png" 
                          : "/Assets/Images/videoVisitIcon.png"}
                        alt={language === "EN" ? category.NameEn : category.NameAr}
                        width={35}
                        height={35}
                        className="object-contain"
                      />
                      <Label htmlFor={`visit-${category.ID}`} className="cursor-pointer">
                        {language === "EN" ? category.NameEn : category.NameAr}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exist" id="exist" />
                <Label htmlFor="exist" className="cursor-pointer">
                  {language === "EN" ? "Existing Appointment" : "موعد موجود"}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {selectedOption === "exist" && (
            <div className="space-y-2">
              <Label htmlFor="identifier">
                {appointmentType === "Branch"
                  ? language === "EN" 
                    ? "Appointment ID / GSM Number" 
                    : "رقم الموعد / رقم الجوال"
                  : language === "EN"
                    ? "Appointment ID / GSM Number / Email"
                    : "رقم الموعد / رقم الجوال / البريد الإلكتروني"}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="identifier"
                value={idOrGsmNumber}
                onChange={(e) => setIdOrGsmNumber(e.target.value)}
                placeholder={appointmentType === "Branch"
                  ? language === "EN" 
                    ? "Enter Appointment ID or GSM Number" 
                    : "أدخل رقم الموعد أو رقم الجوال"
                  : language === "EN"
                    ? "Enter Appointment ID, GSM Number or Email"
                    : "أدخل رقم الموعد أو رقم الجوال أو البريد الإلكتروني"}
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              {language === "EN" ? "Cancel" : "إلغاء"}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitDisabled()}
              className="bg-teal-700 hover:bg-teal-800"
            >
              {language === "EN" ? "Submit" : "إرسال"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
