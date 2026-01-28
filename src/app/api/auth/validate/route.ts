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

        // Create URLSearchParams for UAT (application/x-www-form-urlencoded)
        const params = new URLSearchParams();
        params.append('UserName', userName as string);
        params.append('Password', password as string);

        // Forward to GetLDAPLoginValidation endpoint
        const uatUrl = 'https://eservicesuat.nws.nama.om:444/api/InternalPortal/GetLDAPLoginValidation';

        console.log('LDAP Validation: Forwarding to UAT with URLSearchParams');

        const response = await fetch(uatUrl, {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            }
        });

        console.log('LDAP Validation: UAT response status:', response.status);

        let data;
        const contentType = response.headers.get('content-type') || '';
        const rawBody = await response.text();

        console.log('LDAP Validation: Content-Type:', contentType);

        try {
            // Attempt to parse as JSON regardless of reported Content-Type
            // since UAT server sometimes returns text/plain for JSON
            data = JSON.parse(rawBody);
            console.log('LDAP Validation: Successfully parsed JSON from response');
        } catch (e) {
            console.error('LDAP Validation: Failed to parse JSON response');
            console.error('LDAP Validation: Raw Body:', rawBody.substring(0, 1000));

            // Fail gracefully if upstream returns non-JSON (e.g., HTML WAF block)
            return NextResponse.json(
                { StatusCode: 'Failure', ErrMessage: 'Upstream service returned invalid response format.' },
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
