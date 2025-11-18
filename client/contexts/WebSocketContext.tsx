'use client';

import { createContext, useContext } from 'react';

export interface WebSocketContextValue {
  isConnected: boolean;
  socketId: string | null;
  error: string | null;
  reconnect: () => void;
}

export const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    // During SSR or if provider is not mounted, return default values
    console.warn('useWebSocketContext called outside of WebSocketProvider, returning defaults');
    return {
      isConnected: false,
      socketId: null,
      error: null,
      reconnect: () => {},
    };
  }
  return context;
};
