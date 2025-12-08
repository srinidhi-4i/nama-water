"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth.service"
import { Header } from "@/components/layout/Header"
import { LogoSection } from "@/components/layout/LogoSection"
import { Footer } from "@/components/layout/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle, AlertCircle, Info, Trash2, Eye } from "lucide-react"

interface Notification {
  id: number
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  date: string
  read: boolean
}

export default function NotificationCenterPage() {
  const router = useRouter()
  const [language, setLanguage] = useState<"EN" | "AR">("EN")
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "New Appointment Scheduled",
      message: "Customer appointment scheduled for tomorrow at 10:00 AM",
      type: "info",
      date: "2025-11-25 10:30",
      read: false
    },
    {
      id: 2,
      title: "Bill Payment Received",
      message: "Payment of AED 250 received for account #12345",
      type: "success",
      date: "2025-11-25 09:15",
      read: false
    },
    {
      id: 3,
      title: "Meter Reading Due",
      message: "5 meter readings are pending for today",
      type: "warning",
      date: "2025-11-25 08:00",
      read: true
    },
    {
      id: 4,
      title: "System Maintenance",
      message: "Scheduled maintenance on 2025-11-26 from 2:00 AM to 4:00 AM",
      type: "info",
      date: "2025-11-24 16:00",
      read: true
    },
  ])

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login')
    }
  }, [router])

  const handleLanguageChange = (lang: "EN" | "AR") => {
    setLanguage(lang)
  }

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "success":
        return "default"
      case "warning":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="flex flex-col min-h-screen">
      <Header language={language} onLanguageChange={handleLanguageChange} />
      <LogoSection />
      
      <main className="flex-1 overflow-auto bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.push('/branchhome')}
              className="mb-4"
            >
              ← Back to Home
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Bell className="h-8 w-8" />
                  Notification Center
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount} New
                    </Badge>
                  )}
                </h1>
                <p className="text-gray-600 mt-2">Stay updated with important notifications</p>
              </div>
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline">
                  Mark All as Read
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
                  <p className="text-gray-500">No notifications</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`transition-all hover:shadow-md ${
                    !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getIcon(notification.type)}
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {notification.title}
                            {!notification.read && (
                              <Badge variant="secondary" className="text-xs">New</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {notification.date}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={getBadgeVariant(notification.type)}>
                        {notification.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{notification.message}</p>
                    <div className="flex gap-2">
                      {!notification.read && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Mark as Read
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
