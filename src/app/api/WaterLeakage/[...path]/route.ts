import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eserviceuat.nws.nama.om'

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    try {
        const params = await context.params
        const path = params.path?.join('/') || ''
        const url = `${API_BASE_URL}/WaterLeakage/${path}`

        // Get request body
        const body = await request.formData()

        // Get cookies
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get('ASP.NET_SessionId')

        // Prepare headers
        const headers: HeadersInit = {
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
        }

        // Add session cookie if available
        if (sessionCookie) {
            headers['Cookie'] = `${sessionCookie.name}=${sessionCookie.value}`
        }

        // Make request to backend
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body,
            credentials: 'include',
        })

        // Get response data
        const data = await response.json()

        // Forward Set-Cookie headers if present
        const setCookieHeader = response.headers.get('set-cookie')
        const nextResponse = NextResponse.json(data, { status: response.status })

        if (setCookieHeader) {
            nextResponse.headers.set('Set-Cookie', setCookieHeader)
        }

        return nextResponse
    } catch (error) {
        console.error('Water Leakage API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
