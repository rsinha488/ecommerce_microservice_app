'use client';

import { useRef, useEffect } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '@/lib/redux/store';
import { checkAuth } from '@/lib/redux/slices/authSlice';

/**
 * AuthInitializer Component
 *
 * Checks authentication status on app mount to restore user session.
 * This ensures users stay logged in after page refresh.
 */
function AuthInitializer() {
  const storeRef = useRef<AppStore>();

  useEffect(() => {
    // Get store instance
    if (!storeRef.current && typeof window !== 'undefined') {
      const stores = document.querySelectorAll('[data-store]');
      if (stores.length > 0) {
        // Store reference exists, trigger auth check
        const checkAuthStatus = async () => {
          try {
            // Dispatch checkAuth to validate session
            await (window as any).__REDUX_STORE__?.dispatch(checkAuth());
          } catch (error) {
            // Silent fail - user will remain logged out
            console.debug('Session validation failed on mount');
          }
        };
        checkAuthStatus();
      }
    }
  }, []);

  return null;
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>();

  if (!storeRef.current) {
    storeRef.current = makeStore();
    // Make store available globally for auth check
    if (typeof window !== 'undefined') {
      (window as any).__REDUX_STORE__ = storeRef.current;
    }
  }

  useEffect(() => {
    // Check auth on mount
    if (storeRef.current) {
      storeRef.current.dispatch(checkAuth());
    }
  }, []);

  return (
    <Provider store={storeRef.current}>
      <AuthInitializer />
      {children}
    </Provider>
  );
}

