'use client';

import { usePathname } from 'next/navigation';
import AdminHeader from './AdminHeader';

/**
 * Admin Layout Wrapper
 *
 * Client component that conditionally renders AdminHeader based on route.
 * Separates client-side routing logic from server-side metadata export.
 */
export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't show header on login/register pages
  const publicRoutes = ['/admin/login', '/admin/register'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  return (
    <div className="min-h-screen bg-gray-50">
      {!isPublicRoute && <AdminHeader />}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
