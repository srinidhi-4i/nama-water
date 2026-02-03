import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const path = (await params).path.join('/');
        const uatUrl = `https://eservicesuat.nws.nama.om:444/api/PushNotification/${path}`;

        console.log(`PushNotification Proxy [POST]: ${uatUrl}`);

        const incomingCookies = request.headers.get('cookie') || '';

        // Forward FormData
        const formData = await request.formData();

        // 60s timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
            const response = await fetch(uatUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Cookie': incomingCookies,
                    'Host': 'eservicesuat.nws.nama.om:444',
                    'Origin': 'https://eservicesuat.nws.nama.om',
                    'Referer': 'https://eservicesuat.nws.nama.om/',
                    'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0',
                    'Authorization': request.headers.get('authorization') || '',
                    'Accept': 'application/json, text/plain, */*',
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log(`PushNotification Proxy: UAT status: ${response.status}`);

            const data = await response.json();

            // Create response and forward cookies
            const nextResponse = NextResponse.json(data, { status: response.status });

            // Forward cookies
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

        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                console.error('PushNotification Proxy: Request timed out');
                return NextResponse.json(
                    { Status: 'fail', StatusCode: 408, Data: 'Request timed out' },
                    { status: 408 }
                );
            }
            throw fetchError;
        }

    } catch (error: any) {
        console.error('PushNotification Proxy Error:', error);
        return NextResponse.json(
            { Status: 'fail', StatusCode: 500, Data: error.message },
            { status: 500 }
        );
    }
}
