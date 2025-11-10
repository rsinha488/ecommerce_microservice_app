import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  login,
  register,
  logout,
  checkAuth,
  setCredentials,
  clearError,
  resetAuth,
} from '../authSlice';
import { authApi } from '@/lib/api/auth';

// Mock the auth API
jest.mock('@/lib/api/auth', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getSession: jest.fn(),
  },
}));

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state).toEqual({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    });
  });

  describe('setCredentials', () => {
    it('should set user credentials and mark as authenticated', () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };

      store.dispatch(setCredentials({ user }));

      const state = store.getState().auth;
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      // First set an error
      store.dispatch({ type: 'auth/login/rejected', payload: 'Login failed' });

      // Clear the error
      store.dispatch(clearError());

      const state = store.getState().auth;
      expect(state.error).toBeNull();
    });
  });

  describe('resetAuth', () => {
    it('should reset authentication state', () => {
      // First set some authenticated state
      store.dispatch(setCredentials({
        user: { id: '1', email: 'test@example.com', name: 'Test User' }
      }));

      // Reset auth
      store.dispatch(resetAuth());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('login async thunk', () => {
    const loginCredentials = { email: 'test@example.com', password: 'password123' };
    const mockResponse = { session_id: 'session123', user_id: 'user123' };

    it('should handle login success', async () => {
      mockAuthApi.login.mockResolvedValueOnce(mockResponse);

      await store.dispatch(login(loginCredentials));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      // Note: User data is not stored in Redux state after login
      // as it's handled by session cookies and checkAuth
    });

    it('should handle login pending', () => {
      mockAuthApi.login.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      store.dispatch(login(loginCredentials));

      const state = store.getState().auth;
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle login failure', async () => {
      const errorMessage = 'Invalid credentials';
      mockAuthApi.login.mockRejectedValueOnce({ message: errorMessage });

      await store.dispatch(login(loginCredentials));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('register async thunk', () => {
    const registerData = { email: 'test@example.com', password: 'password123', name: 'Test User' };

    it('should handle register success', async () => {
      mockAuthApi.register.mockResolvedValueOnce({});

      await store.dispatch(register(registerData));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle register pending', () => {
      mockAuthApi.register.mockImplementationOnce(() => new Promise(() => {}));

      store.dispatch(register(registerData));

      const state = store.getState().auth;
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle register failure', async () => {
      const errorMessage = 'Registration failed';
      mockAuthApi.register.mockRejectedValueOnce({ message: errorMessage });

      await store.dispatch(register(registerData));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('logout async thunk', () => {
    beforeEach(() => {
      // Set up authenticated state
      store.dispatch(setCredentials({
        user: { id: '1', email: 'test@example.com', name: 'Test User' }
      }));
    });

    it('should handle logout success', async () => {
      mockAuthApi.logout.mockResolvedValueOnce({});

      await store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle logout failure gracefully', async () => {
      mockAuthApi.logout.mockRejectedValueOnce(new Error('Logout failed'));

      await store.dispatch(logout());

      const state = store.getState().auth;
      // Should still clear client state even if API call fails
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('checkAuth async thunk', () => {
    const mockSessionResponse = {
      session: {
        user: { id: '1', email: 'test@example.com', name: 'Test User' }
      }
    };

    it('should handle checkAuth success', async () => {
      mockAuthApi.getSession.mockResolvedValueOnce(mockSessionResponse);

      await store.dispatch(checkAuth());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(mockSessionResponse.session.user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle checkAuth pending', () => {
      mockAuthApi.getSession.mockImplementationOnce(() => new Promise(() => {}));

      store.dispatch(checkAuth());

      const state = store.getState().auth;
      expect(state.loading).toBe(true);
    });

    it('should handle checkAuth failure', async () => {
      mockAuthApi.getSession.mockRejectedValueOnce({ message: 'Session expired' });

      await store.dispatch(checkAuth());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull(); // Auth check failures don't show errors
    });
  });
});
