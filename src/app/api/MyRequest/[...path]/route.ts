import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const path = (await params).path.join('/');
        const uatUrl = `https://eservicesuat.nws.nama.om:444/api/MyRequest/${path}`;

        console.log(`MyRequest Proxy [POST]: ${uatUrl}`);

        const incomingCookies = request.headers.get('cookie') || '';

        // Forward FormData
        const formData = await request.formData();

        const response = await fetch(uatUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'Cookie': incomingCookies,
                'Host': 'eservicesuat.nws.nama.om:444',
                'Origin': 'https://eservicesuat.nws.nama.om',
                'Referer': 'https://eservicesuat.nws.nama.om/Validateuser',
                'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0',
                'Authorization': request.headers.get('authorization') || '',
                'Accept': 'application/json, text/plain, */*',
            }
        });

        const data = await response.json();
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
    } catch (error: any) {
        return NextResponse.json(
            { Status: 'fail', StatusCode: 500, Data: error.message },
            { status: 500 }
        );
    }
}
