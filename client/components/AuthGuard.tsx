'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/lib/redux/hooks';

/**
 * AuthGuard Component
 *
 * Client-side route protection that redirects unauthenticated users
 * from protected routes to the login page.
 *
 * This works in conjunction with Redux persist to ensure auth state
 * is preserved across page reloads.
 */

const protectedRoutes = ['/checkout', '/orders'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  console.log("🚀 ~ AuthGuard ~ children:", children)
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Don't redirect while loading auth state
    if (loading) return;

    // Check if current route needs protection
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

    if (isProtectedRoute && !isAuthenticated) {
      // Save the intended destination
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, loading, pathname, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
