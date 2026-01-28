import { NextRequest, NextResponse } from 'next/server';

// Get Branch Details endpoint - Step 2
export async function POST(request: NextRequest) {
    try {
        // Get FormData from the request
        const formData = await request.formData();

        const userADId = formData.get('UserADId');

        console.log('Branch Details: Received request');
        console.log('Branch Details: UserADId (plain):', userADId);

        if (!userADId) {
            return NextResponse.json(
                { Status: 'fail', StatusCode: 400, Data: null },
                { status: 400 }
            );
        }

        // Create URLSearchParams for UAT (application/x-www-form-urlencoded)
        const params = new URLSearchParams();
        params.append('UserADId', userADId as string);

        // Forward to GetBranchDetails endpoint
        const uatUrl = 'https://eservicesuat.nws.nama.om:444/api/InternalPortal/GetBranchDetails';

        console.log('Branch Details: Forwarding to UAT with plain UserADId');

        const response = await fetch(uatUrl, {
            method: 'POST',
            body: params,
            headers: {
                'Accept': 'application/json',
                // Keep cookie forwarding as it might be needed for session affinity
                'Cookie': request.headers.get('cookie') || '',
            }
        });

        let data;
        const rawBody = await response.text();

        try {
            data = JSON.parse(rawBody);
            console.log('Branch Details: Successfully parsed JSON from response');
        } catch (e) {
            console.error('Branch Details: Failed to parse JSON response');
            console.error('Branch Details: Raw Body:', rawBody.substring(0, 1000));
            return NextResponse.json(
                { Status: 'fail', StatusCode: 502, Data: 'Upstream service returned invalid response format.' },
                { status: 502 }
            );
        }

        // Create response with headers
        const nextResponse = NextResponse.json(data, { status: response.status });

        // Forward Set-Cookie header if present
        const rawCookies = (response.headers as any).getSetCookie
            ? (response.headers as any).getSetCookie()
            : [response.headers.get('set-cookie')].filter((c: string | null) => !!c);

        if (rawCookies.length > 0) {
            rawCookies.forEach((cookie: string) => {
                let modifiedCookie = cookie
                    .replace(/Domain=[^;]+;?/gi, '')
                    .replace(/Path=[^;]+;?/gi, '')
                    .replace(/Secure;?/gi, '')
                    .replace(/SameSite=[^;]+;?/gi, 'SameSite=Lax;');

                modifiedCookie = modifiedCookie + '; Path=/';

                console.log('Branch Details: Forwarding cookie:', modifiedCookie);
                nextResponse.headers.append('set-cookie', modifiedCookie);
            });
        }

        return nextResponse;
    } catch (error: any) {
        console.error('Branch Details: Error:', error);
        return NextResponse.json(
            { Status: 'fail', StatusCode: 500, Data: null },
            { status: 500 }
        );
    }
}
