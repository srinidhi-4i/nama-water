import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Define protected paths
    // Add any other paths that require authentication
    const protectedPaths = ['/branchhome', '/dashboard'];

    // Check if the current path is protected
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

    // Check for the auth token
    const hasAuthToken = request.cookies.has('auth_token');

    // Case 1: Trying to access protected route without token -> Redirect to Login
    if (isProtectedPath && !hasAuthToken) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    // Case 2: Trying to access Login page (root) while already logged in -> Redirect to Branch Home
    if (pathname === '/' && hasAuthToken) {
        const url = request.nextUrl.clone();
        url.pathname = '/branchhome';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

// Configure paths to match
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
