"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function ApiTestPage() {
  const [endpoint, setEndpoint] = useState("/api/auth/login")
  const [username, setUsername] = useState("Admin")
  const [password, setPassword] = useState("")
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testEndpoint = async () => {
    setLoading(true)
    setResponse(null)
    setError(null)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:52101/'
      const fullUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`
      
      console.log('Testing URL:', fullUrl)
      
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          rememberMe: false,
        }),
      })

      const data = await res.json()
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: data,
      })
    } catch (err: any) {
      setError({
        message: err.message,
        stack: err.stack,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <Card className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">API Endpoint Tester</h1>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Base URL</label>
            <Input 
              value={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:52101/'}
              disabled
              className="bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Endpoint Path</label>
            <Input 
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/api/auth/login"
            />
            <p className="text-xs text-gray-500 mt-1">
              Try: /api/auth/login, /auth/login, /BranchUser/Login, /Account/Login
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <Input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button onClick={testEndpoint} disabled={loading} className="w-full">
            {loading ? 'Testing...' : 'Test Endpoint'}
          </Button>
        </div>

        {response && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2 text-green-600">Response</h2>
            <div className="bg-green-50 p-4 rounded border border-green-200">
              <p className="text-sm mb-2"><strong>Status:</strong> {response.status} {response.statusText}</p>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-96">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2 text-red-600">Error</h2>
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <p className="text-sm mb-2"><strong>Message:</strong> {error.message}</p>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-96">
                {error.stack}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded border border-blue-200">
          <h3 className="font-semibold mb-2">Common .NET API Endpoints:</h3>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li><code>/api/auth/login</code> - Standard REST API pattern</li>
            <li><code>/auth/login</code> - Without /api prefix</li>
            <li><code>/BranchUser/Login</code> - MVC Controller pattern</li>
            <li><code>/Account/Login</code> - ASP.NET Identity pattern</li>
            <li><code>/api/BranchUser/Login</code> - API Controller pattern</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
