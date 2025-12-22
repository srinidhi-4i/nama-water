"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock, MapPin, User } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import Link from "next/link"
import PageHeader from "@/components/layout/PageHeader"

export default function AppointmentList() {
  const router = useRouter()
  const { language } = useLanguage()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [selectedService, setSelectedService] = useState<string>("")

  const timeSlots = [
    "09:00 AM - 09:30 AM",
    "09:30 AM - 10:00 AM",
    "10:00 AM - 10:30 AM",
    "10:30 AM - 11:00 AM",
    "11:00 AM - 11:30 AM",
    "11:30 AM - 12:00 PM",
    "02:00 PM - 02:30 PM",
    "02:30 PM - 03:00 PM",
    "03:00 PM - 03:30 PM",
    "03:30 PM - 04:00 PM",
  ]

  const services = [
    "New Connection",
    "Meter Reading Issue",
    "Bill Payment",
    "Disconnection Request",
    "Reconnection Request",
    "Complaint Registration",
  ]

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
      <PageHeader
        language={language}
        titleEn="Appointment Booking"
        titleAr="حجز موعد"
        breadcrumbEn="Appointment Booking"
        breadcrumbAr="حجز موعد"
      />

      <div className="px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Calendar Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {language === "EN" ? "Select Date" : "اختر التاريخ"}
                </CardTitle>
                <CardDescription>
                  {language === "EN" ? "Choose your preferred appointment date" : "اختر تاريخ الموعد المفضل لديك"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                  disabled={(date: Date) => date < new Date() || date.getDay() === 5 || date.getDay() === 6}
                />
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {language === "EN" ? "Service Type" : "نوع الخدمة"}
                  </CardTitle>
                  <CardDescription>
                    {language === "EN" ? "Select the service you need" : "اختر الخدمة التي تحتاجها"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === "EN" ? "Select a service" : "اختر خدمة"} />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {language === "EN" ? "Time Slot" : "الفترة الزمنية"}
                  </CardTitle>
                  <CardDescription>
                    {language === "EN" ? "Choose your preferred time" : "اختر الوقت المفضل لديك"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={selectedSlot === slot ? "default" : "outline"}
                        onClick={() => setSelectedSlot(slot)}
                        className="text-sm"
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {language === "EN" ? "Appointment Summary" : "ملخص الموعد"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === "EN" ? "Date:" : "التاريخ:"}</span>
                    <span className="font-medium">{date?.toLocaleDateString() || (language === "EN" ? "Not selected" : "غير محدد")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === "EN" ? "Time:" : "الوقت:"}</span>
                    <span className="font-medium">{selectedSlot || (language === "EN" ? "Not selected" : "غير محدد")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === "EN" ? "Service:" : "الخدمة:"}</span>
                    <span className="font-medium">{selectedService || (language === "EN" ? "Not selected" : "غير محدد")}</span>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    disabled={!date || !selectedSlot || !selectedService}
                  >
                    {language === "EN" ? "Confirm Appointment" : "تأكيد الموعد"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

