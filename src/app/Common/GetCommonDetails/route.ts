import { NextRequest, NextResponse } from 'next/server'

const UAT_BASE_URL = process.env.NEXT_PUBLIC_UAT_BASE_URL || 'https://uat.nama.om/eportal'

/**
 * Proxy endpoint for Common/GetCommonDetails
 * Forwards the request to the UAT backend with proper FormData handling
 */
export async function POST(request: NextRequest) {
    try {
        console.log('GetCommonDetails: Received request')

        // Get the FormData from the request
        const formData = await request.formData()

        console.log('GetCommonDetails: Forwarding to UAT')

        // Forward to UAT backend
        const response = await fetch(`${UAT_BASE_URL}/Common/GetCommonDetails`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                // Don't set Content-Type - let fetch set it with the boundary
                'Cookie': request.headers.get('cookie') || '',
            },
        })

        console.log('GetCommonDetails: UAT response status:', response.status)

        const data = await response.json()
        console.log('GetCommonDetails: UAT response:', data)

        // Return the response
        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        console.error('GetCommonDetails: Error:', error)
        return NextResponse.json(
            {
                Status: 'error',
                StatusCode: 606,
                Message: error instanceof Error ? error.message : 'Failed to fetch common details',
                Data: null
            },
            { status: 500 }
        )
    }
}
