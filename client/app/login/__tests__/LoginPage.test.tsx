import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/lib/redux/slices/authSlice';
import LoginPage from '../LoginPage';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock Redux hooks
jest.mock('@/lib/redux/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

describe('LoginPage', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
    jest.clearAllMocks();
    (require('@/lib/redux/hooks').useAppDispatch as jest.Mock).mockReturnValue(jest.fn());
    (require('@/lib/redux/hooks').useAppSelector as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      isAuthenticated: false,
    });
  });

  const renderLoginPage = () => {
    return render(
      <Provider store={store}>
        <LoginPage />
      </Provider>
    );
  };

  describe('Initial Render', () => {
    it('renders login form by default', () => {
      renderLoginPage();

      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders registration form when toggled', () => {
      renderLoginPage();

      const toggleButton = screen.getByText(/don't have an account\?/i);
      fireEvent.click(toggleButton);

      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows email validation error for empty email', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('shows email validation error for invalid email format', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('shows password validation error for short password', async () => {
      renderLoginPage();

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
    });

    it('shows name validation error for empty name in registration', async () => {
      renderLoginPage();

      // Switch to registration mode
      const toggleButton = screen.getByText(/don't have an account\?/i);
      fireEvent.click(toggleButton);

      const nameInput = screen.getByLabelText(/full name/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls login dispatch with correct data', async () => {
      const mockDispatch = jest.fn();
      (require('@/lib/redux/hooks').useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    it('calls register dispatch with correct data', async () => {
      const mockDispatch = jest.fn();
      (require('@/lib/redux/hooks').useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);

      renderLoginPage();

      // Switch to registration
      const toggleButton = screen.getByText(/don't have an account\?/i);
      fireEvent.click(toggleButton);

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });
  });

  describe('Mode Toggle', () => {
    it('switches between login and registration modes', () => {
      renderLoginPage();

      // Start in login mode
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();

      // Switch to registration
      const toggleButton = screen.getByText(/don't have an account\?/i);
      fireEvent.click(toggleButton);

      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();

      // Switch back to login
      const toggleBackButton = screen.getByText(/already have an account\?/i);
      fireEvent.click(toggleBackButton);

      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('clears form errors when toggling modes', async () => {
      renderLoginPage();

      // Create an error first
      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      // Toggle mode
      const toggleButton = screen.getByText(/don't have an account\?/i);
      fireEvent.click(toggleButton);

      // Error should be cleared
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('disables form inputs and button when loading', () => {
      (require('@/lib/redux/hooks').useAppSelector as jest.Mock).mockReturnValue({
        loading: true,
        error: null,
        isAuthenticated: false,
      });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /processing/i });

      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Processing...');
    });

    it('disables toggle button when loading', () => {
      (require('@/lib/redux/hooks').useAppSelector as jest.Mock).mockReturnValue({
        loading: true,
        error: null,
        isAuthenticated: false,
      });

      renderLoginPage();

      const toggleButton = screen.getByText(/don't have an account\?/i);
      expect(toggleButton).toBeDisabled();
    });
  });

  describe('Error Display', () => {
    it('displays global error message', () => {
      (require('@/lib/redux/hooks').useAppSelector as jest.Mock).mockReturnValue({
        loading: false,
        error: 'Login failed',
        isAuthenticated: false,
      });

      renderLoginPage();

      expect(screen.getByText('Login failed')).toBeInTheDocument();
    });
  });

  describe('Demo Credentials', () => {
    it('displays demo credentials', () => {
      renderLoginPage();

      expect(screen.getByText('Demo credentials:')).toBeInTheDocument();
      expect(screen.getByText(/Email: demo@example\.com/)).toBeInTheDocument();
      expect(screen.getByText(/Password: demo123/)).toBeInTheDocument();
    });
  });
});
