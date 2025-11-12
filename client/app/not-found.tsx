'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Generic 404 Not Found Page (User)
 *
 * Eye-catching 404 page matching the e-commerce theme.
 * Provides helpful navigation options to get users back on track.
 *
 * Features:
 * - Attractive design with animations
 * - Multiple navigation options
 * - Search functionality
 * - Recent products suggestion
 * - Back button
 *
 * @returns 404 Not Found page
 */
export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 Icon */}
        <div className="mb-8 animate-bounce">
          <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/products"
            className="card hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex flex-col items-center p-6">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                🏪
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Browse Products</h3>
              <p className="text-sm text-gray-600">Explore our collection</p>
            </div>
          </Link>

          <Link
            href="/cart"
            className="card hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex flex-col items-center p-6">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                🛒
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">View Cart</h3>
              <p className="text-sm text-gray-600">Check your items</p>
            </div>
          </Link>

          <Link
            href="/orders"
            className="card hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex flex-col items-center p-6">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                📦
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">My Orders</h3>
              <p className="text-sm text-gray-600">Track your purchases</p>
            </div>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.back()}
            className="btn-secondary w-full sm:w-auto"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>

          <Link href="/" className="btn-primary w-full sm:w-auto">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </Link>
        </div>

        {/* Decorative Elements */}
        <div className="mt-8 flex justify-center gap-4 opacity-50">
          <div className="animate-pulse">🎁</div>
          <div className="animate-pulse delay-100">💳</div>
          <div className="animate-pulse delay-200">📱</div>
          <div className="animate-pulse delay-300">⭐</div>
        </div>
      </div>
    </div>
  );
}
