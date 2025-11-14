'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { checkAuth, logout, resetAuth } from '@/lib/redux/slices/authSlice';
import { loadCartFromStorage } from '@/lib/redux/slices/cartSlice';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Header Component
 *
 * Main navigation header with authentication state management,
 * cart display, and responsive navigation.
 *
 * Features:
 * - Authentication state checking on mount
 * - Cart persistence from localStorage
 * - Responsive navigation menu
 * - Proper logout handling with error recovery
 * - Loading states for authentication checks
 */
export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);
  const { itemCount } = useAppSelector((state) => state.cart);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check authentication status on component mount
    dispatch(checkAuth());

    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch(loadCartFromStorage(cartItems));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        // Clear corrupted cart data
        localStorage.removeItem('cart');
      }
    }
  }, [dispatch]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  /**
   * Handle user logout with proper error handling
   */
  const handleLogout = async () => {
    try {
      console.log('Initiating logout...');
      await dispatch(logout()).unwrap();
      console.log('Logout successful, redirecting to login');

      // Redirect to login page
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);

      // Even if API call fails, force client-side logout
      console.log('API logout failed, forcing client-side logout');
      dispatch(resetAuth());
      router.replace('/login');
    }
  };

  /**
   * Toggle mobile menu visibility
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  /**
   * Check if a navigation link is active
   */
  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/products" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl" role="img" aria-label="Shopping cart">🛍️</span>
            <span className="text-xl font-bold text-gray-400">E-Shop</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`font-medium transition-colors ${isActiveLink('/')
                  ? 'text-primary-600'
                  : 'text-gray-700 hover:text-primary-600'
                }`}
            >
              Home
            </Link>
            <Link
              href="/products"
              className={`font-medium transition-colors ${isActiveLink('/products')
                ? 'text-primary-600'
                : 'text-gray-700 hover:text-primary-600'
                }`}
            >
              Products
            </Link>
            {isAuthenticated && (
              <Link
                href="/orders"
                className={`font-medium transition-colors ${isActiveLink('/orders')
                  ? 'text-primary-600'
                  : 'text-gray-700 hover:text-primary-600'
                  }`}
              >
                Orders
              </Link>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link href={isAuthenticated ? "/cart" : "/login"} className="relative group">
              <button
                className="p-2 text-gray-700 hover:text-primary-600 transition-colors rounded-full hover:bg-gray-100"
                aria-label={`Shopping cart with ${itemCount} items`}
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </button>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Authentication Section */}
            {loading ? (
              // Loading state
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : isAuthenticated ? (
              // Authenticated user
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block">
                  <span className="text-sm text-gray-700">
                    Hello,{' '}
                    <span className="font-medium">
                      {user?.profile?.name || user?.email?.split('@')[0] || 'User'}
                    </span>
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm hover:bg-gray-200 focus:ring-2 focus:ring-gray-300"
                  disabled={loading}
                >
                  Logout
                </button>
              </div>
            ) : (
              // Unauthenticated user - hide sign in button on login/register pages
              !pathname.startsWith('/login') && !pathname.startsWith('/register') && (
                <Link
                  href="/login"
                  className="btn-primary text-sm hover:bg-primary-700 focus:ring-2 focus:ring-primary-300"
                >
                  Sign In
                </Link>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className={`font-medium transition-colors ${isActiveLink('/')
                  ? 'text-primary-600'
                  : 'text-gray-700 hover:text-primary-600'
                  }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/products"
                className={`font-medium transition-colors ${isActiveLink('/products')
                  ? 'text-primary-600'
                  : 'text-gray-700 hover:text-primary-600'
                  }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Products
              </Link>
              {isAuthenticated && (
                <Link
                  href="/orders"
                  className={`font-medium transition-colors ${isActiveLink('/orders')
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Orders
                </Link>
              )}
              {isAuthenticated && (
                <div className="pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-600">
                    Signed in as {user?.profile?.name || user?.email?.split('@')[0] || 'User'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
