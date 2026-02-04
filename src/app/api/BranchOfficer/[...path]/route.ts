import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const path = (await params).path.join('/');
        const uatUrl = `https://eservicesuat.nws.nama.om:444/api/BranchOfficer/${path}`;

        console.log(`BranchOfficer Proxy [POST]: ${uatUrl}`);

        // Get ALL cookies from the request - UAT uses session cookies for auth
        const incomingCookies = request.headers.get('cookie') || '';
        console.log(`BranchOfficer Proxy: Forwarding cookies (length: ${incomingCookies.length})`);

        // Forward FormData as-is
        const formData = await request.formData();

        // Log FormData for debugging
        const formDataObj: any = {};
        formData.forEach((val, key) => { formDataObj[key] = val; });
        console.log(`BranchOfficer Proxy: FormData:`, formDataObj);

        // Extract token from Authorization header if present
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

        const uatHeaders = {
            'Cookie': incomingCookies,
            'Host': 'eservicesuat.nws.nama.om:444',
            'Origin': 'https://eservicesuat.nws.nama.om',
            'Referer': 'https://eservicesuat.nws.nama.om/Validateuser',
            'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Authorization': authHeader || '',
            'Token': token || '', // Try forwarding as Token header as well
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        };

        console.log('BranchOfficer Proxy: Outgoing Headers:', JSON.stringify({
            CookieLength: uatHeaders.Cookie.length,
            Authorization: !!uatHeaders.Authorization,
            Token: !!uatHeaders.Token,
            Host: uatHeaders.Host
        }, null, 2));

        const response = await fetch(uatUrl, {
            method: 'POST',
            body: formData,
            headers: uatHeaders
        });

        console.log(`BranchOfficer Proxy: UAT status: ${response.status}`);

        const data = await response.json();
        console.log(`BranchOfficer Proxy: Response StatusCode: ${data.StatusCode}`);

        // Create response and forward cookies with Path=/
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
        console.error('BranchOfficer Proxy Error:', error);
        return NextResponse.json(
            { Status: 'fail', StatusCode: 500, Data: error.message },
            { status: 500 }
        );
    }
}
