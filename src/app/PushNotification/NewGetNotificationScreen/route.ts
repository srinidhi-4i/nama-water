import { NextRequest, NextResponse } from 'next/server'

const UAT_BASE_URL = process.env.NEXT_PUBLIC_UAT_BASE_URL || 'https://uat.nama.om/eportal'

/**
 * Proxy endpoint for PushNotification/NewGetNotificationScreen
 * Forwards the request to the UAT backend to get custom notifications with filters
 */
export async function POST(request: NextRequest) {
    try {
        console.log('NewGetNotificationScreen: Received request')

        // Get the FormData from the request
        const formData = await request.formData()

        console.log('NewGetNotificationScreen: Forwarding to UAT')

        // Forward to UAT backend
        const response = await fetch(`${UAT_BASE_URL}/PushNotification/NewGetNotificationScreen`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                // Don't set Content-Type - let fetch set it with the boundary
                'Cookie': request.headers.get('cookie') || '',
            },
        })

        console.log('NewGetNotificationScreen: UAT response status:', response.status)

        const data = await response.json()
        console.log('NewGetNotificationScreen: UAT response:', data)

        // Return the response
        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        console.error('NewGetNotificationScreen: Error:', error)
        return NextResponse.json(
            {
                Status: 'error',
                StatusCode: 606,
                Message: error instanceof Error ? error.message : 'Failed to fetch notifications',
                Data: null
            },
            { status: 500 }
        )
    }
}
