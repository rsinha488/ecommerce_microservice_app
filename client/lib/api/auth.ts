import { authClient } from './client';

/**
 * Authentication API interfaces and client
 *
 * This module provides type-safe API calls for authentication operations
 * through the API gateway. All requests are routed through the gateway
 * for proper service discovery and load balancing.
 */

// Request/Response interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * Login response now includes full user data from backend
 * No need to make additional session call
 */
export interface LoginResponse {
  session_id: string;
  user_id: string;
  success: boolean;
  user: UserInfoResponse;
}

export interface RegisterResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    profile: { name: string };
  };
}

export interface UserInfoResponse {
  id: string;
  email: string;
  profile: { name: string };
  role?: string;
  sub?: string;
}

export interface SessionResponse {
  valid: boolean;
  session: {
    user: UserInfoResponse;
    sessionId: string;
  };
}

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

/**
 * Authentication API client
 *
 * Provides methods for user authentication operations with proper error handling
 * and type safety. All methods communicate through the API gateway.
 */
export const authApi = {
  /**
   * Authenticate user with email and password
   * @param credentials - User login credentials
   * @returns Promise resolving to login response with session info
   * @throws ApiError on authentication failure
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await authClient.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      // Transform error to consistent format
      const apiError: ApiError = {
        message: error.response?.data?.message || 'Login failed',
        statusCode: error.response?.status,
        error: error.response?.data?.error,
      };
      throw apiError;
    }
  },

  /**
   * Register a new user account
   * @param userData - User registration data
   * @returns Promise resolving to registration response
   * @throws ApiError on registration failure
   */
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    try {
      const response = await authClient.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      // Transform error to consistent format
      const apiError: ApiError = {
        message: error.response?.data?.message || 'Registration failed',
        statusCode: error.response?.status,
        error: error.response?.data?.error,
      };
      throw apiError;
    }
  },

  /**
   * Get current user session information
   * @returns Promise resolving to session validation response
   * @throws ApiError on session validation failure
   */
  getSession: async (): Promise<SessionResponse> => {
    try {
      const response = await authClient.get('/auth/session');
      return response.data;
    } catch (error: any) {
      // Transform error to consistent format
      const apiError: ApiError = {
        message: error.response?.data?.message || 'Session validation failed',
        statusCode: error.response?.status,
        error: error.response?.data?.error,
      };
      throw apiError;
    }
  },

  /**
   * Logout current user by destroying session
   * @returns Promise resolving when logout is complete
   * @throws ApiError on logout failure
   */
  logout: async (): Promise<void> => {
    try {
      await authClient.post('/auth/logout');
    } catch (error: any) {
      // Transform error to consistent format
      const apiError: ApiError = {
        message: error.response?.data?.message || 'Logout failed',
        statusCode: error.response?.status,
        error: error.response?.data?.error,
      };
      throw apiError;
    }
  },
};
