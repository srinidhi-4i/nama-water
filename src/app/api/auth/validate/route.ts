import { NextRequest, NextResponse } from 'next/server';

// LDAP Validation endpoint - Step 1
export async function POST(request: NextRequest) {
    try {
        // Get FormData from the request
        const formData = await request.formData();

        const userName = formData.get('UserName');
        const password = formData.get('Password');

        console.log('LDAP Validation: Received request');
        console.log('LDAP Validation: UserName present:', !!userName);
        console.log('LDAP Validation: Password present:', !!password);

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
        });

        console.log('LDAP Validation: UAT response status:', response.status);

        const data = await response.json();

        console.log('LDAP Validation: UAT response:', data);

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('LDAP Validation: Error:', error);
        return NextResponse.json(
            { StatusCode: 'Failure', ErrMessage: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
