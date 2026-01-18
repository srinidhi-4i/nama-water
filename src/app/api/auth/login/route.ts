import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Get the JSON data from the request
        const body = await request.json();

        console.log('Proxy: Received login request');
        console.log('Proxy: Request body:', body);

        // Forward the request to the UAT server
        // Using GetBranchDetails endpoint (matching React.js pattern)
        const uatUrl = 'https://eservicesuat.nws.nama.om:444/api/InternalPortal/GetBranchDetails';

        console.log('Proxy: Forwarding to UAT:', uatUrl);

        const response = await fetch(uatUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'Host': 'eservicesuat.nws.nama.om:444',
                'Origin': 'https://eservicesuat.nws.nama.om',
                'Referer': 'https://eservicesuat.nws.nama.om/Validateuser',
                'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            },
            body: JSON.stringify(body),
        });

        console.log('Proxy: UAT response status:', response.status);

        const data = await response.json();

        console.log('Proxy: UAT response data:', data);

        // Return the response from UAT
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('Proxy: Error:', error);
        return NextResponse.json(
            { error: 'Proxy error', message: error.message },
            { status: 500 }
        );
    }
}
