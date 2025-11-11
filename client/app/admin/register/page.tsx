'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { register, clearError } from '@/lib/redux/slices/authSlice';
import Link from 'next/link';
import { toast } from 'react-toastify';

/**
 * Admin Registration Page
 *
 * Dedicated registration page for admin users.
 * Validates that email contains "admin" keyword.
 * After successful registration, redirects to admin login page.
 *
 * Features:
 * - Admin email validation (must contain "admin")
 * - Form validation with real-time feedback
 * - Professional toast notifications
 * - Password strength indicator
 * - Automatic redirect after registration
 */
export default function AdminRegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  /**
   * Redirect authenticated admin users to dashboard
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      const isAdmin = user?.email?.includes('admin') || user?.role === 'admin';
      if (isAdmin) {
        router.replace('/admin');
      }
    }
  }, [isAuthenticated, user, router]);

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
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

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
    } else if (!/(?=.*[a-z])(?=.*[A-Z])|(?=.*[0-9])/.test(formData.password)) {
      errors.password = 'Password should contain uppercase, lowercase, or numbers';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return !Object.values(errors).some((error) => error !== '');
  };

  /**
   * Get password strength
   */
  const getPasswordStrength = (): { strength: string; color: string; width: string } => {
    const password = formData.password;
    if (!password) return { strength: '', color: '', width: '0%' };

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { strength: 'Weak', color: 'bg-red-500', width: '33%' };
    if (score <= 3) return { strength: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { strength: 'Strong', color: 'bg-green-500', width: '100%' };
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
      await dispatch(
        register({
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name.trim(),
        })
      ).unwrap();

      toast.success('🎉 Admin account created successfully! Please login with your credentials.', {
        position: 'top-right',
        autoClose: 4000,
      });

      // Redirect to admin login after short delay
      setTimeout(() => {
        router.replace('/admin/login');
      }, 1500);
    } catch (err: any) {
      console.error('Admin registration error:', err);
      toast.error(err || 'Registration failed. Please try again.', {
        position: 'top-right',
        autoClose: 4000,
      });
    }
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Admin Account</h1>
          <p className="text-gray-400">Register as an administrator</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign Up</h2>

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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input w-full ${formErrors.name ? 'border-red-500' : ''}`}
                placeholder="John Doe"
                required
                disabled={loading}
                autoComplete="name"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            {/* Admin Email Field */}
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
              <p className="mt-1 text-xs text-gray-500">
                Email must contain &quot;admin&quot; to register as administrator
              </p>
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
                autoComplete="new-password"
              />
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password Strength:</span>
                    <span className={`text-xs font-semibold ${
                      passwordStrength.strength === 'Weak' ? 'text-red-600' :
                      passwordStrength.strength === 'Medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.strength}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input w-full ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
                autoComplete="new-password"
              />
              {formErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
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
                  Creating Account...
                </span>
              ) : (
                'Create Admin Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <Link
                href="/admin/login"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Already have an admin account? <span className="font-semibold text-primary-600">Sign in</span>
              </Link>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs text-blue-800 font-semibold mb-1">Admin Registration Requirements</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Email must contain &quot;admin&quot; keyword</li>
                  <li>• Password minimum 6 characters</li>
                  <li>• Strong password recommended for security</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Back to User Registration */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Register as regular user instead
          </Link>
        </div>
      </div>
    </div>
  );
}
