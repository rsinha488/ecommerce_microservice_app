'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { login, register, clearError } from '@/lib/redux/slices/authSlice';
import Link from 'next/link';
import { toast } from 'react-toastify';

/**
 * Login Page Component
 *
 * Handles user authentication (login/register) with proper error handling,
 * form validation, and integration with the API gateway.
 *
 * Features:
 * - Toggle between login and registration modes
 * - Form validation with real-time feedback
 * - Loading states and error handling
 * - Automatic redirect after successful authentication
 * - Integration with Redux for state management
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  // Form state management
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    name: '',
  });

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || '/products';
      router.replace(redirectTo);
    }
  }, [isAuthenticated, router, searchParams]); // ✅ FIXED ESLINT WARNING

  /**
   * Handle input field changes with validation
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific errors on change
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }

    // Clear global error when user starts typing
    if (error) {
      dispatch(clearError());
    }
  };

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const errors = {
      email: '',
      password: '',
      name: '',
    };

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Name validation (only for registration)
    if (!isLogin && !formData.name.trim()) {
      errors.name = 'Full name is required';
    }

    setFormErrors(errors);

    // Return true if no errors
    return !Object.values(errors).some(error => error !== '');
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
      if (isLogin) {
        // Handle login
        const result = await dispatch(
          login({
            email: formData.email.trim(),
            password: formData.password
          })
        ).unwrap();

        if (result.session_id) {
          console.log('Login successful');
          const redirectTo = searchParams.get('redirect') || '/products';
          router.replace(redirectTo);
        }
      } else {
        // Handle registration
        await dispatch(register({
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name.trim(),
        })).unwrap();

        // Registration successful
        toast.success('🎉 Registration successful! Please login with your credentials.', {
          position: 'top-right',
          autoClose: 4000,
        });
        setIsLogin(true);

        // Clear form
        setFormData({
          email: '',
          password: '',
          name: '',
        });
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
    }
  };

  /**
   * Toggle between login and registration modes
   */
  const toggleMode = () => {
    setIsLogin(!isLogin);
    dispatch(clearError());
    setFormErrors({
      email: '',
      password: '',
      name: '',
    });
  };

  return (
    <div className="container-custom py-12">
      <div className="max-w-md mx-auto">
        <div className="card">
          <h1 className="text-3xl font-bold text-center text-gray-300 mb-6">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h1>

          {/* Global Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Login/Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name Field (Registration only) */}
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input ${formErrors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="John Doe"
                  required={!isLogin}
                  disabled={loading}
                  aria-describedby={formErrors.name ? "name-error" : undefined}
                  aria-invalid={!!formErrors.name}
                />
                {formErrors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                    {formErrors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input ${formErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                placeholder="you@example.com"
                required
                disabled={loading}
                aria-describedby={formErrors.email ? "email-error" : undefined}
                aria-invalid={!!formErrors.email}
                autoComplete="email"
              />
              {formErrors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input ${formErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
                aria-describedby={formErrors.password ? "password-error" : undefined}
                aria-invalid={!!formErrors.password}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              {formErrors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              aria-describedby={loading ? "loading-status" : undefined}
            >
              {loading ? (
                <span className="flex items-center justify-center" id="loading-status">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24" aria-hidden="true">
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
                  Processing...
                </span>
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Mode Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              disabled={loading}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600 text-center">
              <strong>Demo credentials:</strong><br />
              Email: demo@example.com<br />
              Password: demo123
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-600 hover:text-gray-300 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
