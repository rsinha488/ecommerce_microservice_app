'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { login, clearError } from '@/lib/redux/slices/authSlice';
import Link from 'next/link';
import { toast } from 'react-toastify';

/**
 * Admin Login Page
 *
 * Dedicated login page for admin users.
 * Validates admin credentials and redirects to admin dashboard.
 *
 * Features:
 * - Admin-only login interface
 * - Email validation for admin users
 * - Automatic redirect to admin dashboard after successful login
 * - Professional toast notifications
 * - Form validation with real-time feedback
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });

  /**
   * Redirect authenticated admin users to dashboard
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      const isAdmin = user?.email?.includes('admin') || user?.role === 'admin';

      if (isAdmin) {
        router.replace('/admin');
      } else {
        toast.error('Access denied. Admin credentials required.');
        dispatch(clearError());
        // Force logout non-admin users
        router.replace('/login');
      }
    }
  }, [isAuthenticated, user, router, dispatch]);

  /**
   * Handle input changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific errors
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    // Clear global error
    if (error) {
      dispatch(clearError());
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const errors = {
      email: '',
      password: '',
    };

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (!formData.email.toLowerCase().includes('admin')) {
      errors.email = 'Admin email required (must contain &quot;admin&quot;)';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return !Object.values(errors).some((error) => error !== '');
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    dispatch(clearError());

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(
        login({
          email: formData.email.trim(),
          password: formData.password,
        })
      ).unwrap();

      if (result.session_id) {
        toast.success('Login successful!', {
          position: 'top-right',
          autoClose: 2000,
        });

        // Small delay for toast to show
        setTimeout(() => {
          router.replace('/admin');
        }, 500);
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      toast.error(err || 'Invalid admin credentials', {
        position: 'top-right',
        autoClose: 4000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-400">Sign in to access the admin dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>

          {/* Global Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input w-full ${formErrors.email ? 'border-red-500' : ''}`}
                placeholder="admin@company.com"
                required
                disabled={loading}
                autoComplete="email"
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input w-full ${formErrors.password ? 'border-red-500' : ''}`}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
                autoComplete="current-password"
              />
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center space-y-3">
              <div>
                <Link
                  href="/admin/register"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Don&apos;t have an admin account? <span className="font-semibold text-primary-600">Register here</span>
                </Link>
              </div>
              <div>
                <Link
                  href="/login"
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← Back to customer login
                </Link>
              </div>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              <strong>Demo Admin:</strong><br />
              admin@company.com / admin123
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            🔒 Secure admin access only
          </p>
        </div>
      </div>
    </div>
  );
}
