import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const path = (await params).path.join('/');
        const uatUrl = `https://eservicesuat.nws.nama.om:444/api/UserActionWeb/${path}`;

        console.log(`UserActionWeb Proxy [POST]: ${uatUrl}`);

        const incomingCookies = request.headers.get('cookie') || '';

        // Forward FormData or JSON
        let body;
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            body = await request.formData();
        } else {
            body = await request.text();
        }

        const response = await fetch(uatUrl, {
            method: 'POST',
            body: body,
            headers: {
                'Cookie': incomingCookies,
                'Host': 'eservicesuat.nws.nama.om:444',
                'Origin': 'https://eservicesuat.nws.nama.om',
                'Referer': 'https://eservicesuat.nws.nama.om/Validateuser',
                'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Authorization': request.headers.get('authorization') || '',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
            }
        });

        console.log(`UserActionWeb Proxy: UAT status: ${response.status}`);

        const data = await response.json();
        const nextResponse = NextResponse.json(data, { status: response.status });

        // Robust cookie forwarding
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
        console.error('UserActionWeb Proxy Error:', error);
        return NextResponse.json(
            { Status: 'fail', StatusCode: 500, Data: error.message },
            { status: 500 }
        );
    }
}
