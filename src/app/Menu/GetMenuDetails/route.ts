import { NextRequest, NextResponse } from 'next/server'

const UAT_BASE_URL = process.env.NEXT_PUBLIC_UAT_BASE_URL || 'https://uat.nama.om/eportal'

/**
 * Proxy endpoint for Menu/GetMenuDetails
 * Forwards the request to the UAT backend with proper FormData handling
 */
export async function POST(request: NextRequest) {
    try {
        console.log('GetMenuDetails: Received request')

        // Get the FormData from the request
        const formData = await request.formData()

        console.log('GetMenuDetails: Forwarding to UAT')

        // Forward to UAT backend with increased timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        try {
            const response = await fetch(`${UAT_BASE_URL}/api/Menu/GetMenudata`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {
                    // Don't set Content-Type - let fetch set it with the boundary
                    'Cookie': request.headers.get('cookie') || '',
                },
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            console.log('GetMenuDetails: UAT response status:', response.status)

            const data = await response.json()
            console.log('GetMenuDetails: UAT response:', data)

            // Return the response
            return NextResponse.json(data, { status: response.status })
        } catch (fetchError) {
            clearTimeout(timeoutId)
            console.error('GetMenuDetails: Fetch Error:', fetchError)

            // Provide more specific error messages
            let errorMessage = 'Failed to fetch menu details'
            let statusCode = 606

            if (fetchError instanceof Error) {
                if (fetchError.name === 'AbortError') {
                    errorMessage = 'Connection timeout: Unable to reach UAT server. Please check your VPN connection or network access.'
                    statusCode = 504 // Gateway Timeout
                } else if (fetchError.message.includes('fetch failed') || fetchError.message.includes('ENOTFOUND')) {
                    errorMessage = 'Cannot connect to UAT server. Please ensure you are connected to VPN and the server is accessible.'
                    statusCode = 503 // Service Unavailable
                } else {
                    errorMessage = fetchError.message
                }
            }

            return NextResponse.json(
                {
                    Status: 'error',
                    StatusCode: statusCode,
                    Message: errorMessage,
                    Data: null
                },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('GetMenuDetails: Unexpected Error:', error)
        return NextResponse.json(
            {
                Status: 'error',
                StatusCode: 606,
                Message: error instanceof Error ? error.message : 'Unexpected error occurred',
                Data: null
            },
            { status: 500 }
        )
    }
}
