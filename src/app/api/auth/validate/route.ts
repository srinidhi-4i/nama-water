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
        const baseUrl = process.env.NEXT_PUBLIC_UAT_BASE_URL;
        const uatUrl = `${baseUrl}/api/InternalPortal/GetLDAPLoginValidation`;

        console.log('LDAP Validation: Forwarding to UAT with URLSearchParams');

        // Use fetch instead of axios for better cookie handling
        const response = await fetch(uatUrl, {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Host': 'eservicesuat.nws.nama.om:444',
                'Origin': 'https://eservicesuat.nws.nama.om',
                'Referer': 'https://eservicesuat.nws.nama.om/BranchLogin',
            },
        });

        console.log('LDAP Validation: UAT response status:', response.status);
        console.log('LDAP Validation: Content-Type:', response.headers.get('content-type'));

        const rawBody = await response.text();
        let responseData;

        try {
            responseData = JSON.parse(rawBody);
        } catch (e) {
            console.error('LDAP Validation: Failed to parse response');
            responseData = rawBody;
        }

        console.log('LDAP Validation: UAT response:', responseData);

        // Debug: Log ALL headers to see what we are getting
        console.log('LDAP Validation: UAT Response Headers Dump:');
        response.headers.forEach((val, key) => {
            console.log(`  Header [${key}]: ${val}`);
        });

        // Create response with headers
        const nextResponse = NextResponse.json(responseData, { status: response.status });

        // Forward Set-Cookie headers using getSetCookie for multiple cookies
        const rawCookies = (response.headers as any).getSetCookie
            ? (response.headers as any).getSetCookie()
            : [response.headers.get('set-cookie')].filter((c: string | null) => !!c);

        console.log('LDAP Validation: Set-Cookie headers from UAT:', rawCookies);

        if (rawCookies.length > 0) {
            console.log(`LDAP Validation: Forwarding ${rawCookies.length} cookies from UAT`);

            rawCookies.forEach((cookie: string) => {
                console.log('LDAP Validation: Original cookie:', cookie);
                let modifiedCookie = cookie
                    .replace(/Domain=[^;]+;?/gi, '')
                    .replace(/Path=[^;]+;?/gi, '')
                    .replace(/Secure;?/gi, '')
                    .replace(/SameSite=[^;]+;?/gi, 'SameSite=Lax;');

                modifiedCookie = modifiedCookie + '; Path=/';
                console.log('LDAP Validation: Modified cookie:', modifiedCookie);
                nextResponse.headers.append('set-cookie', modifiedCookie);
            });
        } else {
            console.log('LDAP Validation: No Set-Cookie headers from UAT!');
        }

        // --- Set HttpOnly Cookie for auth_token ---
        const token = responseData?.Data?.Token;
        if (responseData?.StatusCode === 605 && responseData?.Data?.StatusCode === 'Success' && token) {
            // Set a secure, httpOnly cookie for the session
            nextResponse.cookies.set({
                name: 'auth_token',
                value: token,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 // 1 day
            });
            console.log('LDAP Validation: auth_token cookie set');
        }
        // -------------------------------------------------------

        return nextResponse;
    } catch (error: any) {
        console.error('LDAP Validation: Error:', error);
        return NextResponse.json(
            { StatusCode: 'Failure', ErrMessage: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
