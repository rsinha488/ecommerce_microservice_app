'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

/**
 * ConditionalLayout Component
 *
 * Dynamically renders Header and Footer based on the current route.
 * Admin routes (/admin/*) get their own layout without user Header/Footer.
 * Regular routes get the standard Header/Footer layout.
 *
 * This prevents the double header issue in admin dashboard.
 */
export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Check if we're on an admin route
  const isAdminRoute = pathname?.startsWith('/admin');

  // Admin routes don't get Header/Footer (they have their own in admin/layout.tsx)
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // Regular routes get Header and Footer
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
