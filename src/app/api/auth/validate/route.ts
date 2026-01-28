import { NextRequest, NextResponse } from 'next/server';

// LDAP Validation endpoint - Step 1
export async function POST(request: NextRequest) {
    try {
        // Get FormData from the request
        const formData = await request.formData();

        const userName = formData.get('UserName');
        const password = formData.get('Password');

        console.log('LDAP Validation: Received request');

        if (!userName || !password) {
            return NextResponse.json(
                { StatusCode: 'Failure', ErrMessage: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Create FormData for UAT
        const uatFormData = new FormData();
        uatFormData.append('UserName', userName as string);
        uatFormData.append('Password', password as string);

        // Forward to GetLDAPLoginValidation endpoint
        const uatUrl = 'https://eservicesuat.nws.nama.om:444/api/InternalPortal/GetLDAPLoginValidation';

        console.log('LDAP Validation: Forwarding to UAT');

        const response = await fetch(uatUrl, {
            method: 'POST',
            body: uatFormData,
            headers: {
                // Do not forward cookies to avoid WAF blocking
                'Host': 'eservicesuat.nws.nama.om:444',
                'Origin': 'https://eservicesuat.nws.nama.om',
                'Referer': 'https://eservicesuat.nws.nama.om/Validateuser',
                'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            }
        });

        console.log('LDAP Validation: UAT response status:', response.status);

        let data;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            console.error('LDAP Validation: Received non-JSON response with status:', response.status);
            // Fail gracefully if upstream returns HTML (e.g., WAF block or 500 error)
            return NextResponse.json(
                { StatusCode: 'Failure', ErrMessage: 'Upstream service returned invalid response.' },
                { status: 502 }
            );
        }

        console.log('LDAP Validation: UAT response:', data);

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
                nextResponse.headers.append('set-cookie', modifiedCookie);
            });
        }

        return nextResponse;
    } catch (error: any) {
        console.error('LDAP Validation: Error:', error);
        return NextResponse.json(
            { StatusCode: 'Failure', ErrMessage: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
