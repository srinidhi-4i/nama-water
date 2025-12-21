"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth.service"
import { Header } from "@/components/layout/Header"
import { LogoSection } from "@/components/layout/LogoSection"
import { Footer } from "@/components/layout/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, MapPin, Users, Leaf, Clock } from "lucide-react"

export default function WetlandBookingPage() {
  const router = useRouter()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedLocation, setSelectedLocation] = useState("")
  const [numberOfPeople, setNumberOfPeople] = useState("")
  const [purpose, setPurpose] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login')
    }
  }, [router])

  const handleLanguageChange = (lang: "EN" | "AR") => {
    setLanguage(lang)
  }

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
    <div className="flex flex-col min-h-screen">
      <Header language={language} onLanguageChange={handleLanguageChange} />
      <LogoSection />
      
      <main className="flex-1 overflow-auto bg-gradient-to-br from-green-50 to-teal-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.push('/branchhome')}
              className="mb-4"
            >
              ← Back to Home
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Leaf className="h-8 w-8 text-green-600" />
              Wetland Booking
            </h1>
            <p className="text-gray-600 mt-2">Reserve your visit to protected wetland areas</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Booking Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Visit Date
                  </CardTitle>
                  <CardDescription>Select your preferred visit date</CardDescription>
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
                    Location
                  </CardTitle>
                  <CardDescription>Choose wetland location</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {wetlandLocations.map((location) => (
                        <SelectItem key={location.id} value={location.name}>
                          {language === "EN" ? location.name : location.nameAr} (Max: {location.capacity} people)
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
                    Visitor Information
                  </CardTitle>
                  <CardDescription>Provide details about your visit</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="numberOfPeople">Number of People</Label>
                    <Input
                      id="numberOfPeople"
                      type="number"
                      min="1"
                      placeholder="Enter number of visitors"
                      value={numberOfPeople}
                      onChange={(e) => setNumberOfPeople(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="purpose">Purpose of Visit</Label>
                    <Select value={purpose} onValueChange={setPurpose}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
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
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      placeholder="Enter your name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="Enter phone number"
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
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{date?.toLocaleDateString() || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium text-right">{selectedLocation || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visitors:</span>
                    <span className="font-medium">{numberOfPeople || "0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Purpose:</span>
                    <span className="font-medium text-right">{purpose || "Not selected"}</span>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    disabled={!date || !selectedLocation || !numberOfPeople || !purpose || !contactName || !contactPhone}
                    onClick={handleSubmit}
                  >
                    Confirm Booking
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Information Card */}
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>Important Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Bookings must be made at least 48 hours in advance</li>
                <li>• Visitors must follow all conservation guidelines</li>
                <li>• Photography permits may be required for commercial use</li>
                <li>• Groups larger than 20 people require special approval</li>
                <li>• Visits are subject to weather conditions and may be rescheduled</li>
                <li>• Please arrive 15 minutes before your scheduled time</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
