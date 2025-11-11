import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { socketService } from '@/lib/websocket/socket.service';
import { RootState } from '@/lib/redux/store';
import { setWebSocketStatus } from '@/lib/redux/slices/authSlice';
import { toast } from 'react-toastify';


export const useWebSocket = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const handleOrderUpdate = useCallback((data: any) => {
    console.log('[WebSocket] Order update:', data);

    if (data.event === 'order.created') {
      toast.success(`Order #${data.orderId} created successfully!`);
    } else if (data.event === 'order.updated') {
      toast.info(`Order #${data.orderId} status: ${data.status}`);
    } else if (data.event === 'order.cancelled') {
      toast.warning(`Order #${data.orderId} has been cancelled`);
    }
  }, [dispatch]);

  const handleInventoryUpdate = useCallback((data: any) => {
    console.log('[WebSocket] Inventory update:', data);
  }, [dispatch]);

  const handleAdminUpdate = useCallback((event: string, data: any) => {
    console.log('[WebSocket] Admin event:', event, data);

    if (event === 'order:created') {
      toast.info(`New order received: #${data.orderId}`);
    }
  }, []);

  const handleNotification = useCallback((data: any) => {
    console.log('[WebSocket] Notification:', data);

    if (data.type === 'success') {
      toast.success(data.message);
    } else if (data.type === 'error') {
      toast.error(data.message);
    } else if (data.type === 'warning') {
      toast.warning(data.message);
    } else {
      toast.info(data.message);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Connect to WebSocket with user info
    socketService.connect({
      userId: user.id,
      token: 'authenticated', // Token is already in cookies from login
      role: user.role === "admin" ? "admin" : "user",
    });

    // Update Redux state when connected
    if (socketService.isConnected()) {
      dispatch(setWebSocketStatus({ connected: true }));
    }

    // Subscribe to events
    socketService.subscribeToOrders(handleOrderUpdate);
    socketService.subscribeToInventory(handleInventoryUpdate);
    socketService.subscribeToNotifications(handleNotification);

    // Subscribe to admin events if user is admin
    if (user.role === 'admin') {
      socketService.subscribeToAdmin(handleAdminUpdate);
    }

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
      dispatch(setWebSocketStatus({ connected: false }));
    };
  }, [isAuthenticated, user, handleOrderUpdate, handleInventoryUpdate, handleAdminUpdate, handleNotification, dispatch]);
  return {
    isConnected: socketService.isConnected(),
    socket: socketService.getSocket(),
  };
};
