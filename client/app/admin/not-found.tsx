'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Admin 404 Not Found Page
 *
 * Professional 404 page for admin dashboard.
 * Provides admin-specific navigation options.
 *
 * Features:
 * - Professional admin theme
 * - Quick access to admin sections
 * - Dashboard navigation
 * - Back functionality
 *
 * @returns Admin 404 Not Found page
 */
export default function AdminNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 Icon */}
        <div className="mb-8">
          <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse">
            Coming soon
          </div>
        </div>

        {/* Emoji and Message */}
        <div className="mb-8">
          <div className="text-6xl mb-4 animate-pulse">🛍️</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚧 Page Under Development
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            We&apos;re currently working hard to bring this page to life.
            Please check back soon!
          </p>
          <div className="animate-pulse text-7xl mb-6">👨‍💻</div>

        </div>

        {/* Navigation Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/admin"
            className="bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-300 group border border-gray-700"
          >
            <div className="flex flex-col items-center p-6">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                📊
              </div>
              <h3 className="font-semibold text-white mb-2">Dashboard</h3>
              <p className="text-sm text-gray-400">View product overview</p>
            </div>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-300 group border border-gray-700"
          >
            <div className="flex flex-col items-center p-6">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                📦
              </div>
              <h3 className="font-semibold text-white mb-2">Order Management</h3>
              <p className="text-sm text-gray-400">Manage customer orders</p>
            </div>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.back()}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full sm:w-auto"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>

          <Link
            href="/admin"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all w-full sm:w-auto"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go to Dashboard
          </Link>
        </div>

        {/* Admin Help */}
        <div className="mt-12 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-300 mb-4">
            <strong className="text-white">Admin Quick Links:</strong>
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Link href="/admin" className="text-blue-400 hover:text-blue-300 transition-colors">
              → Product Management
            </Link>
            <Link href="/admin/orders" className="text-blue-400 hover:text-blue-300 transition-colors">
              → Order Management
            </Link>
            <button className="text-gray-500 cursor-not-allowed text-left">
              → User Management (Coming Soon)
            </button>
            <button className="text-gray-500 cursor-not-allowed text-left">
              → Analytics (Coming Soon)
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Admin System Online</span>
        </div>
      </div>
    </div>
  );
}
