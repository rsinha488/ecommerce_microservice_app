import type { Metadata } from 'next';
import AdminHeader from './components/AdminHeader';

export const metadata: Metadata = {
  title: 'Admin Dashboard - E-commerce Platform',
  description: 'Administrator dashboard for managing products, orders, and inventory',
};

/**
 * Admin Layout
 *
 * This layout overrides the root layout for all /admin/* routes
 * to provide a separate admin-specific navigation and styling.
 *
 * Features:
 * - Admin-specific Header with admin navigation only
 * - No user-facing routes (prevents redirect to /products)
 * - Clean admin-focused interface
 * - Protected routes - admin authentication required
 *
 * IMPORTANT: This layout prevents admin users from being redirected
 * to user routes when clicking navigation links.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
