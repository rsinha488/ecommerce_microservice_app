// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';

// /**
//  * Middleware for authentication and route protection
//  *
//  * This middleware handles:
//  * - Protecting routes that require authentication
//  * - Redirecting authenticated users away from auth pages
//  * - Preserving redirect URLs for post-login navigation
//  */

// // Routes that require authentication
// const protectedRoutes = ['/orders', '/cart', '/profile', '/checkout'];

// // Routes that should redirect authenticated users (login/register pages)
// const authRoutes = ['/login', '/register'];

// // Public routes that don't need authentication
// const publicRoutes = ['/', '/products', '/about', '/contact'];

// /**
//  * Main middleware function
//  * Handles authentication checks and redirects
//  */
// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   // Get session cookie
//   const sessionId = request.cookies.get('session_id')?.value;
//   const isAuthenticated = !!sessionId;

//   // Check if current route is protected
//   const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

//   // Check if current route is an auth route
//   const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

//   // Check if current route is public
//   const isPublicRoute = publicRoutes.some(route => pathname === route) ||
//                         pathname.startsWith('/products/') ||
//                         pathname.startsWith('/api/');

//   try {
//     // Handle protected routes
//     if (isProtectedRoute) {
//       if (!isAuthenticated) {
//         // User not authenticated, redirect to login with return URL
//         const loginUrl = new URL('/login', request.url);
//         loginUrl.searchParams.set('redirect', pathname);

//         console.log(`Middleware: Redirecting unauthenticated user from ${pathname} to login`);
//         return NextResponse.redirect(loginUrl);
//       }

//       // User is authenticated, allow access to protected route
//       console.log(`Middleware: Allowing authenticated user access to ${pathname}`);
//     }

//     // Handle auth routes (login/register pages)
//     if (isAuthRoute) {
//       if (isAuthenticated) {
//         // User is already authenticated, redirect to intended page or products
//         const redirectTo = request.nextUrl.searchParams.get('redirect') || '/products';
//         console.log(`Middleware: Redirecting authenticated user from ${pathname} to ${redirectTo}`);
//         return NextResponse.redirect(new URL(redirectTo, request.url));
//       }

//       // User not authenticated, allow access to auth pages
//       console.log(`Middleware: Allowing unauthenticated user access to ${pathname}`);
//     }

//     // Handle API routes - add CORS headers for gateway communication
//     if (pathname.startsWith('/api/')) {
//       const response = NextResponse.next();

//       // Add CORS headers for API gateway communication
//       response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008');
//       response.headers.set('Access-Control-Allow-Credentials', 'true');
//       response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//       response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

//       return response;
//     }

//     // Allow access to all other routes
//     return NextResponse.next();

//   } catch (error) {
//     console.error('Middleware error:', error);

//     // On middleware error, redirect to home page
//     return NextResponse.redirect(new URL('/', request.url));
//   }
// }

// /**
//  * Middleware configuration
//  * Defines which routes this middleware should run on
//  */
// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - public files with extensions
//      */
//     '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
//   ],
// };
