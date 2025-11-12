import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { socketService } from '@/lib/websocket/socket.service';
import { RootState } from '@/lib/redux/store';
import { setWebSocketStatus } from '@/lib/redux/slices/authSlice';
import { updateOrderStatus, addOrder } from '@/lib/redux/slices/orderSlice';
import { toast } from 'react-toastify';


export const useWebSocket = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleOrderCreated = useCallback((data: any) => {
    console.log('[WebSocket] Order created:', data);

    // Show toast notification
    toast.success(`Order #${data.orderId.slice(-8).toUpperCase()} created successfully!`);

    // Add order to Redux state if it's for this user
    if (data.buyerId === user?.id) {
      dispatch(addOrder({
        _id: data.orderId,
        userId: data.buyerId,
        items: data.items || [],
        subtotal: data.subtotal || 0,
        tax: data.tax || 0,
        total: data.total || data.totalAmount || 0,
        status: data.status || 'pending',
        shippingAddress: data.shippingAddress || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      }));
    }
  }, [dispatch, user?.id]);

  const handleOrderUpdated = useCallback((data: any) => {
    console.log('[WebSocket] Order updated:', data);

    // Update order status in Redux
    dispatch(updateOrderStatus({
      orderId: data.orderId,
      status: data.status,
      updatedAt: data.updatedAt || new Date().toISOString(),
    }));

    // Show toast notification
    const statusMessage = data.message || `Order status: ${data.status}`;
    toast.info(`Order #${data.orderId.slice(-8).toUpperCase()} - ${statusMessage}`);
  }, [dispatch]);

  const handleOrderCancelled = useCallback((data: any) => {
    console.log('[WebSocket] Order cancelled:', data);

    // Update order status in Redux
    dispatch(updateOrderStatus({
      orderId: data.orderId,
      status: 'cancelled',
      updatedAt: data.cancelledAt || new Date().toISOString(),
    }));

    // Show toast notification
    toast.warning(`Order #${data.orderId.slice(-8).toUpperCase()} has been cancelled`);
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

    // Priority-based notification handling
    const message = data.message || data.title || 'New notification';

    if (data.type === 'order') {
      // Order-related notifications
      if (data.priority === 'high') {
        toast.warning(message, { autoClose: 5000 });
      } else {
        toast.info(message);
      }
    } else if (data.type === 'error') {
      toast.error(message);
    } else if (data.type === 'warning') {
      toast.warning(message);
    } else if (data.type === 'success') {
      toast.success(message);
    } else {
      toast.info(message);
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
    socketService.subscribeToOrders({
      onCreated: handleOrderCreated,
      onUpdated: handleOrderUpdated,
      onCancelled: handleOrderCancelled,
    });
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
  }, [isAuthenticated, user, handleOrderCreated, handleOrderUpdated, handleOrderCancelled, handleInventoryUpdate, handleAdminUpdate, handleNotification, dispatch]);
  return {
    isConnected: socketService.isConnected(),
    socket: socketService.getSocket(),
  };
};
