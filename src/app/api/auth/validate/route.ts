import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

// Create an HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

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

        const response = await axios.post(uatUrl, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            httpsAgent: httpsAgent,
            validateStatus: () => true, // Resolve promise for all status codes
        });

        console.log('LDAP Validation: UAT response status:', response.status);
        console.log('LDAP Validation: Content-Type:', response.headers['content-type']);

        const data = response.data;
        // Check if data is already an object or needs parsing (Axios usually parses JSON automatically)
        const responseData = typeof data === 'string' ? JSON.parse(data) : data;

        console.log('LDAP Validation: UAT response:', responseData);

        // Create response with headers
        const nextResponse = NextResponse.json(responseData, { status: response.status });

        // Forward Set-Cookie header if present
        const setCookieHeader = response.headers['set-cookie'];

        if (setCookieHeader) {
            const rawCookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

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

        // --- NEW: Set HttpOnly Cookie for Next.js Middleware ---
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
            console.log('LDAP Validation: Session cookie set');
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
