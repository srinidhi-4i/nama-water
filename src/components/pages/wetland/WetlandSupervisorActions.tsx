"use client"

import { useState } from "react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, MapPin, Users, Leaf, Clock } from "lucide-react"
import Link from "next/link"

export default function WetlandSupervisorActions() {
  const { language } = useLanguage()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedLocation, setSelectedLocation] = useState("")
  const [numberOfPeople, setNumberOfPeople] = useState("")
  const [purpose, setPurpose] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")

  const wetlandLocations = [
    { id: 1, name: "Al Wathba Wetland Reserve", nameAr: "محمية الوثبة للأراضي الرطبة", capacity: 50 },
    { id: 2, name: "Ras Al Khor Wildlife Sanctuary", nameAr: "محمية رأس الخور للحياة البرية", capacity: 30 },
    { id: 3, name: "Mangrove National Park", nameAr: "حديقة المانغروف الوطنية", capacity: 40 },
    { id: 4, name: "Dubai Desert Conservation Reserve", nameAr: "محمية دبي الصحراوية", capacity: 25 },
  ]

  const purposes = [
    "Educational Visit",
    "Research Study",
    "Photography",
    "Bird Watching",
    "Environmental Assessment",
    "School Field Trip",
  ]

  const handleSubmit = () => {
    console.log("Booking submitted:", {
      date,
      location: selectedLocation,
      numberOfPeople,
      purpose,
      contactName,
      contactPhone
    })
    // Implement booking logic here
  }

  return (
    <div className="flex-1 bg-slate-100 overflow-x-hidden pb-8 min-h-[calc(100vh-200px)]">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 px-2 shadow-md bg-white">
        <div className="flex items-center gap-4 text-center sm:text-left h-12">
          <h1 className="text-2xl font-bold text-[#006A72] flex items-center gap-3">
            <Leaf className="h-8 w-8 text-green-600" />
            {language === "EN" ? "Wetland Booking" : "حجز الأراضي الرطبة"}
          </h1>
        </div>
        
        <div className="text-sm text-gray-500">
          <Link 
            href="/branchhome"
            className="font-semibold text-[#006A72] hover:underline cursor-pointer"
          >
            {language === "EN" ? "Home" : "الرئيسية"}
          </Link>
          <span> &gt; {language === "EN" ? "Wetland Booking" : "حجز الأراضي الرطبة"}</span>
        </div>
      </div>

      <div className="px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Booking Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {language === "EN" ? "Visit Date" : "تاريخ الزيارة"}
                  </CardTitle>
                  <CardDescription>{language === "EN" ? "Select your preferred visit date" : "اختر تاريخ الزيارة المفضل لديك"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    disabled={(date: Date) => date < new Date()}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {language === "EN" ? "Location" : "الموقع"}
                  </CardTitle>
                  <CardDescription>{language === "EN" ? "Choose wetland location" : "اختر موقع الأراضي الرطبة"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === "EN" ? "Select a location" : "اختر موقعاً"} />
                    </SelectTrigger>
                    <SelectContent>
                      {wetlandLocations.map((location) => (
                        <SelectItem key={location.id} value={location.name}>
                          {language === "EN" ? location.name : location.nameAr} (Max: {location.capacity} {language === "EN" ? "people" : "أشخاص"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Visitor Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {language === "EN" ? "Visitor Information" : "معلومات الزائر"}
                  </CardTitle>
                  <CardDescription>{language === "EN" ? "Provide details about your visit" : "قدم تفاصيل حول زيارتك"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="numberOfPeople">{language === "EN" ? "Number of People" : "عدد الأشخاص"}</Label>
                    <Input
                      id="numberOfPeople"
                      type="number"
                      min="1"
                      placeholder={language === "EN" ? "Enter number of visitors" : "أدخل عدد الزوار"}
                      value={numberOfPeople}
                      onChange={(e) => setNumberOfPeople(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="purpose">{language === "EN" ? "Purpose of Visit" : "الغرض من الزيارة"}</Label>
                    <Select value={purpose} onValueChange={setPurpose}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "EN" ? "Select purpose" : "اختر الغرض"} />
                      </SelectTrigger>
                      <SelectContent>
                        {purposes.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="contactName">{language === "EN" ? "Contact Name" : "اسم جهة الاتصال"}</Label>
                    <Input
                      id="contactName"
                      placeholder={language === "EN" ? "Enter your name" : "أدخل اسمك"}
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">{language === "EN" ? "Contact Phone" : "رقم الهاتف"}</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder={language === "EN" ? "Enter phone number" : "أدخل رقم الهاتف"}
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {language === "EN" ? "Booking Summary" : "ملخص الحجز"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === "EN" ? "Date:" : "التاريخ:"}</span>
                    <span className="font-medium">{date?.toLocaleDateString() || (language === "EN" ? "Not selected" : "غير محدد")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === "EN" ? "Location:" : "الموقع:"}</span>
                    <span className="font-medium text-right">{selectedLocation || (language === "EN" ? "Not selected" : "غير محدد")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === "EN" ? "Visitors:" : "الزوار:"}</span>
                    <span className="font-medium">{numberOfPeople || "0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === "EN" ? "Purpose:" : "الغرض:"}</span>
                    <span className="font-medium text-right">{purpose || (language === "EN" ? "Not selected" : "غير محدد")}</span>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    disabled={!date || !selectedLocation || !numberOfPeople || !purpose || !contactName || !contactPhone}
                    onClick={handleSubmit}
                  >
                    {language === "EN" ? "Confirm Booking" : "تأكيد الحجز"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Information Card */}
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>{language === "EN" ? "Important Information" : "معلومات مهمة"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• {language === "EN" ? "Bookings must be made at least 48 hours in advance" : "يجب إجراء الحجوزات قبل 48 ساعة على الأقل"}</li>
                <li>• {language === "EN" ? "Visitors must follow all conservation guidelines" : "يجب على الزوار اتباع جميع إرشادات الحفظ"}</li>
                <li>• {language === "EN" ? "Photography permits may be required for commercial use" : "قد تكون تصاريح التصوير مطلوبة للاستخدام التجاري"}</li>
                <li>• {language === "EN" ? "Groups larger than 20 people require special approval" : "المجموعات الأكبر من 20 شخصًا تتطلب موافقة خاصة"}</li>
                <li>• {language === "EN" ? "Visits are subject to weather conditions and may be rescheduled" : "الزيارات تخضع لظروف الطقس وقد يتم إعادة جدولتها"}</li>
                <li>• {language === "EN" ? "Please arrive 15 minutes before your scheduled time" : "يرجى الوصول قبل 15 دقيقة من وقتك المحدد"}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

