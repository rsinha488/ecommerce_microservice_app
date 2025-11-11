import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi, ApiError, LoginResponse } from '@/lib/api/auth';

/**
 * User interface representing authenticated user data
 */
export interface User {
  id: string;
  email: string;
  profile: { name: string };
  role?: string;
}

/**
 * WebSocket connection status interface
 */
export interface WebSocketStatus {
  connected: boolean;
  socketId?: string;
  error?: string;
}

/**
 * Authentication state interface
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  websocket: WebSocketStatus;
}

/**
 * Initial authentication state
 */
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  websocket: {
    connected: false,
    socketId: undefined,
    error: undefined,
  },
};

/**
 * Async thunk for user login
 * Handles authentication through API gateway with proper error handling
 *
 * The backend now returns full user data in the login response,
 * so no additional session fetch is needed.
 */
export const login = createAsyncThunk<
  LoginResponse,
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      return response;
    } catch (error: any) {
      // Handle API errors consistently
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message || 'Login failed');
    }
  }
);

/**
 * Async thunk for user registration
 * Creates new user account through API gateway
 */
export const register = createAsyncThunk(
  'auth/register',
  async (userData: { email: string; password: string; name: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.register(userData);
      return response;
    } catch (error: any) {
      // Handle API errors consistently
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message || 'Registration failed');
    }
  }
);

/**
 * Async thunk for user logout
 * Destroys user session on server and clears client state
 */
export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authApi.logout();
  } catch (error: any) {
    // Even if logout fails on server, we should clear client state
    const apiError = error as ApiError;
    console.warn('Logout API call failed:', apiError.message);
    // Don't reject - allow client-side logout to proceed
  }
});

/**
 * Async thunk for authentication status check
 * Validates current session and refreshes user data
 */
export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  try {
    const response = await authApi.getSession();
    return { user: response.session.user };
  } catch (error: any) {
    // Handle API errors consistently
    const apiError = error as ApiError;
    return rejectWithValue(apiError.message || 'Authentication check failed');
  }
});

/**
 * Authentication slice with reducers and actions
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Set user credentials manually (used for development/testing)
     */
    setCredentials: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;
    },

    /**
     * Clear authentication error messages
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Reset authentication state (force logout)
     */
    resetAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.websocket = {
        connected: false,
        socketId: undefined,
        error: undefined,
      };
    },

    /**
     * Set WebSocket connection status
     */
    setWebSocketStatus: (state, action: PayloadAction<Partial<WebSocketStatus>>) => {
      state.websocket = {
        ...state.websocket,
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.error = null;
        // Store user data if available from session
        if (action.payload.user) {
          state.user = action.payload.user;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })

      // Register cases
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        // Registration successful - user needs to login
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Logout cases
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.websocket = {
          connected: false,
          socketId: undefined,
          error: undefined,
        };
      })
      .addCase(logout.rejected, (state) => {
        // Even if logout API fails, clear client state
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.websocket = {
          connected: false,
          socketId: undefined,
          error: undefined,
        };
      })

      // Check Auth cases
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null; // Don't show error for auth check failures
      });
  },
});

// Export actions and reducer
export const { setCredentials, clearError, resetAuth, setWebSocketStatus } = authSlice.actions;
export default authSlice.reducer;
