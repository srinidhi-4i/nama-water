"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, Lock, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { authService } from "@/services/auth.service"

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
})

// Add this type inference
type FormValues = z.infer<typeof formSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])



const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    username: "",
    password: "",
    rememberMe: false,
  },
})

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      console.log('Login attempt with username:', values.username)
      
      // Call loginBranchOps matching the React.js pattern
      const user = await authService.loginBranchOps(
        values,
        values.rememberMe,
        values.username
      )

      if (user) {
        console.log("Login successful", user)
        toast.success("Login Successful", {
          description: `Welcome back, ${user.BranchuserNameEn || user.username || 'User'}!`
        })
        
        // Navigate to BranchHome page (matching React.js: history.push("/BranchHome"))
        router.push("/branchhome")
      } else {
        toast.error("Login Failed", {
          description: "Invalid username or password. Please try again."
        })
      }
    } catch (error: any) {
      // Provide specific error messages based on error type
      const errorMessage = error.message || "An error occurred during login. Please try again."
      
      toast.error("Login Error", {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <div 
      className="flex min-h-screen w-full items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: "url('/Assets/Images/global/login_background.png')" }}
    >
      <Card className="w-full max-w-4xl overflow-hidden shadow-2xl rounded-3xl">
        <div className="grid md:grid-cols-2">
          {/* Left Side - Illustration */}
          <div className="hidden md:flex flex-col items-center justify-center bg-white p-8 relative">
     {/* Vertical Divider */}
             <div className="absolute right-0 top-8 bottom-8 border-r border-gray-200 w"></div>

              <img 
              src="/Assets/Images/global/login_left.png" 
              alt="Login Illustration" 
              className="w-80 h-auto"
            />
            
          </div>

          {/* Right Side - Login Form */}
          <div className="flex flex-col justify-center bg-white p-8 md:p-12">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <img 
                src="/Assets/Images/global/nama_logo.png" 
                alt="Nama Water Services" 
                className="h-16 w-auto"
              />
            </div>

            {/* Login Heading */}
            <h1 className="mb-8 text-left text-2xl font-semibold text-gray-800">Login</h1>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">User ID</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-5 w-5 text-red-500" />
                          <Input 
                            
                            className="pl-10 bg-gray-50 " 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-red-500" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            
                            className="pl-10 pr-10 bg-gray-50 "
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-teal-900 hover:bg-teal-800 text-white" 
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>

                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-end space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm text-black -top-1">
                          Remember Me
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </div>
      </Card>
    </div>
  )
}
