'use client';

import { useWebSocket } from '@/hooks/useWebSocket';

export default function WebSocketIndicator() {
  const { isConnected } = useWebSocket();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg ${
        isConnected ? 'bg-green-500' : 'bg-red-500'
      } text-white text-sm`}>
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-white animate-pulse' : 'bg-gray-300'
        }`} />
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
    </div>
  );
}
