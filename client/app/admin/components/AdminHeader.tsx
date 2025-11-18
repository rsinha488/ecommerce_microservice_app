'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { checkAuth, logout, resetAuth } from '@/lib/redux/slices/authSlice';
import { toggleNotificationCenter } from '@/lib/redux/slices/notificationSlice';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Admin Header Component
 *
 * Navigation header specifically for admin dashboard.
 * Prevents navigation to user-facing routes.
 *
 * Features:
 * - Admin-specific navigation (Products, Orders, Inventory, Users)
 * - User profile with logout
 * - No cart or user-facing links
 * - Proper admin authentication check
 */
export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);
  const { unreadCount } = useAppSelector((state) => state.notifications);

  useEffect(() => {
    // Check authentication status on component mount
    dispatch(checkAuth());
  }, [dispatch]);

  /**
   * Handle admin logout
   */
  const handleLogout = async () => {
    try {
      console.log('Admin logout initiated...');
      await dispatch(logout()).unwrap();
      console.log('Logout successful, redirecting to admin login');

      // Redirect to admin login page
      router.replace('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);

      // Even if API call fails, force client-side logout
      console.log('API logout failed, forcing client-side logout');
      dispatch(resetAuth());
      router.replace('/admin/login');
    }
  };

  /**
   * Check if a navigation link is active
   */
  const isActiveLink = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-gray-800 text-white shadow-lg sticky top-0 z-50">
      <nav className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/admin/register" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl" role="img" aria-label="Shopping cart">🛍️</span>
            <span className="text-xl font-bold">Admin Dashboard</span>
            <span className="text-xl" role="img" aria-label="Admin dashboard" >⚙️</span>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated ? <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/admin"
              className={`font-medium transition-colors px-3 py-2 rounded ${isActiveLink('/admin') && pathname === '/admin'
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
              Products
            </Link>
            <Link
              href="/admin/orders"
              className={`font-medium transition-colors px-3 py-2 rounded ${isActiveLink('/admin/orders')
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
              Orders
            </Link>
            <Link
              href="/admin/inventory"
              className={`font-medium transition-colors px-3 py-2 rounded ${isActiveLink('/admin/inventory')
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
              Inventory
            </Link>
            {/* Upcoming users management */}
            {/* <Link
              href={isAuthenticated ? "/admin/users" : "#"}
              className={`font-medium transition-colors px-3 py-2 rounded ${isActiveLink('/admin/users')
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
              Users
            </Link> */}
          </div> : ""}

          {/* Right Side - User Info & Logout */}
          <div className="flex items-center space-x-4">
            {/* Admin Notifications */}
            {isAuthenticated && (
              <button
                onClick={() => dispatch(toggleNotificationCenter())}
                className="relative p-2 text-gray-300 hover:text-white transition-colors rounded-full hover:bg-gray-700"
                aria-label={`Notifications - ${unreadCount} unread`}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {loading ? (
              // Loading state
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm text-gray-300">Loading...</span>
              </div>
            ) : isAuthenticated ? (
              // Authenticated admin
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="bg-primary-600 p-2 rounded-full">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">
                      {user?.profile?.name || user?.email?.split('@')[0] || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-400">Administrator</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors text-sm font-medium focus:ring-2 focus:ring-gray-500"
                  disabled={loading}
                >
                  Logout
                </button>
              </div>
            ) : (null
              // Not authenticated
              // !isAuthenticated && <Link
              //   href="/admin/login"
              //   className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded transition-colors text-sm font-medium focus:ring-2 focus:ring-primary-300"
              // >
              //   Admin Login
              // </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
