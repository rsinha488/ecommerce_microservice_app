/**
 * Legacy useWebSocket Hook
 *
 * This hook has been deprecated in favor of the global WebSocketProvider.
 * The WebSocketProvider now handles all WebSocket connections and event subscriptions
 * globally across the entire application, ensuring real-time notifications work
 * on all pages regardless of where the user is.
 *
 * This hook is kept for backward compatibility but now simply returns the connection
 * status from the global context instead of managing its own connection.
 *
 * @deprecated Use the global WebSocketProvider instead (already configured in layout)
 * @see /components/WebSocketProvider.tsx
 * @see /contexts/WebSocketContext.tsx
 */

import { useContext } from 'react';
import { WebSocketContext } from '@/contexts/WebSocketContext';

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);

  // If context is not available, return default values
  // This can happen during SSR or before the provider is mounted
  if (!context) {
    return {
      isConnected: false,
      socketId: null,
      error: null,
      reconnect: () => {},
      // Legacy compatibility
      socket: null,
    };
  }

  const { isConnected, socketId, error, reconnect } = context;

  return {
    isConnected,
    socketId,
    error,
    reconnect,
    // Legacy compatibility
    socket: null, // Socket instance no longer exposed to prevent misuse
  };
};
