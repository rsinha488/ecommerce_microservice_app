import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/orders', '/cart'];
const authRoutes = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // For protected routes, check authentication
  if (isProtectedRoute) {
    const sessionId = request.cookies.get('session_id')?.value;

    if (!sessionId) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // TODO: Validate session with backend
    // For now, just check if session_id cookie exists
  }

  // For auth routes, redirect authenticated users to products
  if (isAuthRoute) {
    const sessionId = request.cookies.get('session_id')?.value;

    if (sessionId) {
      // User is authenticated, redirect to products or return URL
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/products';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return NextResponse.next();
}

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
