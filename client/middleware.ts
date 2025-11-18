import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for Route Protection
 *
 * This middleware works in conjunction with client-side authentication.
 * Since HTTP-only cookies can't be read by client JavaScript, we check for
 * any session cookie that indicates the user might be authenticated.
 *
 * Note: This provides basic protection, but the main auth logic is handled
 * client-side via Redux + axios interceptors.
 */

// Routes that require authentication
const protectedRoutes = [
  '/checkout',
  '/orders',
  '/admin',
];

// Routes that should redirect to home if already authenticated
const authRoutes = [
  '/login',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log("🚀 ~ middleware ~ pathname:", pathname)

  // Check for any session-related cookie
  // Common session cookie names: connect.sid, session, sessionid, etc.
  const sessionCookieNames = ['connect.sid', 'session', 'sessionid', 'auth_token'];
  const hasSessionCookie = sessionCookieNames.some(name => request.cookies.has(name));

  // Also check for a custom auth flag cookie (set by client after login)
  const authFlag = request.cookies.get('auth_flag');
  const isAuthenticated = hasSessionCookie || !!authFlag;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // For protected routes without auth, add redirect param but don't block
  // The client-side will handle the actual redirect based on Redux state
  if (isProtectedRoute && !isAuthenticated) {
    // Don't block - let client-side handle it
    // This prevents issues with cookie timing/synchronization
    const response = NextResponse.next();

    // Add a header to indicate auth might be needed
    response.headers.set('x-auth-required', 'true');
    return response;
  }

  // Redirect to home if trying to access auth routes while authenticated
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow request to proceed
  return NextResponse.next();
}

// Configure which routes should trigger the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
