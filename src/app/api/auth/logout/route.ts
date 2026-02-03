import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const response = NextResponse.json(
            { Status: 'success', Message: 'Logged out successfully' },
            { status: 200 }
        );

        // Clear the auth_token cookie
        response.cookies.delete('auth_token');

        // Verify it's cleared (optional, delete usually works)
        // You can also set it to expire immediately for double safety
        response.cookies.set({
            name: 'auth_token',
            value: '',
            httpOnly: true,
            expires: new Date(0),
            path: '/',
        });

        return response;
    } catch (error) {
        return NextResponse.json(
            { Status: 'error', Message: 'Failed to logout' },
            { status: 500 }
        );
    }
}
