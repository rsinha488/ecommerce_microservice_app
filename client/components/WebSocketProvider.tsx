'use client';

import { useEffect, useState, ReactNode, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { WebSocketContext } from '@/contexts/WebSocketContext';
import { socketService } from '@/lib/websocket/socket.service';
import { setWebSocketStatus } from '@/lib/redux/slices/authSlice';
import { addOrder, updateOrderStatus } from '@/lib/redux/slices/orderSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';
import { RootState } from '@/lib/redux/store';

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOrderCreated = useCallback((data: any) => {
    console.log('Order created:', data);

    if (!user?.id) {
      console.warn('User not available for order created event');
      return;
    }

    // Backend sends orderId, status, totalAmount, items directly
    const order = {
      _id: data.orderId,
      userId: user.id,
      items: data.items || [],
      subtotal: data.totalAmount || 0,
      tax: 0,
      total: data.totalAmount || 0,
      status: data.status || 'pending',
      shippingAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };

    dispatch(addOrder(order));
    dispatch(addNotification({
      type: 'order',
      severity: 'success',
      title: 'Order Created',
      message: data.message || `Order #${data.orderId} has been created successfully!`,
      data: order,
    }));
    toast.success(data.message || `Order #${data.orderId} created successfully!`);
  }, [dispatch, user]);

  const handleOrderUpdated = useCallback((data: any) => {
    console.log('🔔 [USER] Order updated event received:', data);

    const status = data.status || 'unknown';
    const statusUpper = status.toUpperCase();
    const orderId = data.orderId;

    console.log(`📦 Order ${orderId} status changed to: ${status} (uppercase: ${statusUpper})`);

    // Update Redux store
    dispatch(updateOrderStatus({
      orderId: orderId,
      status: status,
      updatedAt: data.updatedAt || new Date().toISOString(),
    }));

    // Determine severity and toast type based on status
    // Backend statuses: 'pending' | 'processing' | 'paid' | 'cancelled' | 'shipped' | 'delivered'
    let severity: 'success' | 'info' | 'warning' | 'error' = 'info';
    let toastType: 'success' | 'info' | 'warning' = 'info';

    if (statusUpper === 'CANCELLED') {
      severity = 'warning';
      toastType = 'warning';
      console.log('🟡 Toast type: WARNING (cancelled)');
    } else if (statusUpper === 'DELIVERED') {
      severity = 'success';
      toastType = 'success';
      console.log('🟢 Toast type: SUCCESS (delivered)');
    } else if (statusUpper === 'PAID') {
      severity = 'success';
      toastType = 'success';
      console.log('🟢 Toast type: SUCCESS (paid)');
    } else {
      // All other statuses: pending, processing, shipped, confirmed, etc.
      severity = 'info';
      toastType = 'info';
      console.log(`🔵 Toast type: INFO (${status})`);
    }

    const message = data.message || `Your order #${orderId} is now ${status}`;

    // Add to notification center
    dispatch(addNotification({
      type: 'order',
      severity,
      title: 'Order Status Updated',
      message,
      data,
    }));
    console.log('✅ Notification added to center');

    // ALWAYS show toast for EVERY status change
    console.log(`🔔 Showing toast notification: "${message}"`);
    switch (toastType) {
      case 'success':
        toast.success(message);
        console.log('✅ SUCCESS toast displayed');
        break;
      case 'warning':
        toast.warning(message);
        console.log('⚠️ WARNING toast displayed');
        break;
      default:
        toast.info(message);
        console.log('ℹ️ INFO toast displayed');
    }
  }, [dispatch]);

  const handleOrderCancelled = useCallback((data: any) => {
    console.log('Order cancelled:', data);
    dispatch(updateOrderStatus({
      orderId: data.orderId,
      status: 'CANCELLED',
      updatedAt: data.cancelledAt || new Date().toISOString(),
    }));
    dispatch(addNotification({
      type: 'order',
      severity: 'warning',
      title: 'Order Cancelled',
      message: data.message || `Order #${data.orderId} has been cancelled`,
      data,
    }));
    toast.warning(data.message || `Order #${data.orderId} has been cancelled`);
  }, [dispatch]);

  const handleInventoryUpdated = useCallback((data: any) => {
    console.log('Inventory updated:', data);
    dispatch(addNotification({
      type: 'inventory',
      severity: 'info',
      title: 'Stock Updated',
      message: `${data.productName || 'Product'} stock updated`,
      data,
    }));
    toast.info(`Stock updated for ${data.productName || 'product'}`);
  }, [dispatch]);

  const handleAdminOrderCreated = useCallback((data: any) => {
    console.log('Admin - New order:', data);

    if (!user?.id) {
      console.warn('User not available for admin order created event');
      return;
    }

    // Backend sends orderId, status, totalAmount, items directly (same as user events)
    const order = {
      _id: data.orderId,
      userId: data.buyerId || user.id,
      items: data.items || [],
      subtotal: data.totalAmount || 0,
      tax: 0,
      total: data.totalAmount || 0,
      status: data.status || 'pending',
      shippingAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };

    dispatch(addOrder(order));
    dispatch(addNotification({
      type: 'admin',
      severity: 'success',
      title: 'New Order Received',
      message: data.message || `New order #${data.orderId} received`,
      data,
    }));
    toast.success(data.message || `New order #${data.orderId} received!`);
  }, [dispatch, user]);

  const handleAdminOrderUpdated = useCallback((data: any) => {
    console.log('🔔 [ADMIN] Order updated event received:', data);

    const status = data.status || 'unknown';
    const statusUpper = status.toUpperCase();
    const orderId = data.orderId;

    console.log(`📦 [ADMIN] Order ${orderId} status changed to: ${status} (uppercase: ${statusUpper})`);

    // Update Redux store
    dispatch(updateOrderStatus({
      orderId: orderId,
      status: status,
      updatedAt: data.updatedAt || new Date().toISOString(),
    }));

    // Determine toast type - similar to user side
    let severity: 'success' | 'info' | 'warning' | 'error' = 'info';
    let toastType: 'success' | 'info' | 'warning' = 'info';

    if (statusUpper === 'CANCELLED') {
      severity = 'warning';
      toastType = 'warning';
      console.log('🟡 [ADMIN] Toast type: WARNING (cancelled)');
    } else if (statusUpper === 'DELIVERED' || statusUpper === 'PAID') {
      severity = 'success';
      toastType = 'success';
      console.log(`🟢 [ADMIN] Toast type: SUCCESS (${status})`);
    } else {
      severity = 'info';
      toastType = 'info';
      console.log(`🔵 [ADMIN] Toast type: INFO (${status})`);
    }

    const message = data.message || `Order #${orderId} status: ${status}`;

    // Add to notification center
    dispatch(addNotification({
      type: 'admin',
      severity,
      title: 'Order Status Changed',
      message,
      data,
    }));
    console.log('✅ [ADMIN] Notification added to center');

    // ALWAYS show toast for EVERY status change
    console.log(`🔔 [ADMIN] Showing toast notification: "${message}"`);
    switch (toastType) {
      case 'success':
        toast.success(message);
        console.log('✅ [ADMIN] SUCCESS toast displayed');
        break;
      case 'warning':
        toast.warning(message);
        console.log('⚠️ [ADMIN] WARNING toast displayed');
        break;
      default:
        toast.info(message);
        console.log('ℹ️ [ADMIN] INFO toast displayed');
    }
  }, [dispatch]);

  const handleAdminOrderCancelled = useCallback((data: any) => {
    console.log('Admin - Order cancelled:', data);
    dispatch(updateOrderStatus({
      orderId: data.orderId,
      status: 'CANCELLED',
      updatedAt: data.cancelledAt || new Date().toISOString(),
    }));
    dispatch(addNotification({
      type: 'admin',
      severity: 'warning',
      title: 'Order Cancelled',
      message: data.message || `Order #${data.orderId} was cancelled`,
      data,
    }));
    toast.warning(data.message || `Order #${data.orderId} has been cancelled`);
  }, [dispatch]);

  const handleAdminInventoryUpdated = useCallback((data: any) => {
    console.log('Admin - Inventory updated:', data);
    dispatch(addNotification({
      type: 'admin',
      severity: 'info',
      title: 'Inventory Updated',
      message: `Stock levels changed for ${data.productName || 'product'}`,
      data,
    }));
  }, [dispatch]);

  const handleAdminAlert = useCallback((data: any) => {
    console.log('Admin alert:', data);
    const severity = data.type === 'LOW_STOCK' ? 'warning' : 'error';
    dispatch(addNotification({
      type: 'admin',
      severity,
      title: data.type === 'LOW_STOCK' ? 'Low Stock Alert' : 'Out of Stock Alert',
      message: data.message,
      data,
    }));

    if (severity === 'error') {
      toast.error(data.message);
    } else {
      toast.warning(data.message);
    }
  }, [dispatch]);

  const handleProductCreated = useCallback((data: any) => {
    console.log('Admin - Product created:', data);
    dispatch(addNotification({
      type: 'admin',
      severity: 'success',
      title: 'Product Created',
      message: `New product "${data.product?.name}" has been added`,
      data: data.product,
    }));
    toast.success(`Product "${data.product?.name}" created!`);
  }, [dispatch]);

  const handleProductUpdated = useCallback((data: any) => {
    console.log('Admin - Product updated:', data);
    dispatch(addNotification({
      type: 'admin',
      severity: 'info',
      title: 'Product Updated',
      message: `Product "${data.product?.name}" has been updated`,
      data: data.product,
    }));
  }, [dispatch]);

  const handleNotification = useCallback((data: any) => {
    console.log('General notification:', data);
    dispatch(addNotification({
      type: 'system',
      severity: data.severity || 'info',
      title: data.title || 'Notification',
      message: data.message,
      data,
    }));
  }, [dispatch]);

  const connectWebSocket = useCallback(() => {
    if (!isAuthenticated || !user) {
      console.log('WebSocket: User not authenticated, skipping connection');
      return;
    }

    console.log('WebSocket: Connecting...', { userId: user.id, role: user.role });

    try {
      socketService.connect({
        userId: user.id,
        token: 'authenticated',
        role: user.role === 'admin' ? 'admin' : 'user',
      });

      // Connection success handler
      socketService.on('connection:success', (data: any) => {
        console.log('WebSocket connected:', data);
        setIsConnected(true);
        setSocketId(data.socketId);
        setError(null);
        dispatch(setWebSocketStatus({
          connected: true,
          socketId: data.socketId,
          error: undefined,
        }));
        toast.success('Connected to real-time updates');
      });

      // Disconnect handler
      socketService.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setSocketId(null);
        dispatch(setWebSocketStatus({
          connected: false,
          socketId: undefined,
          error: 'Disconnected',
        }));
      });

      // Error handler
      socketService.on('connect_error', (err: Error) => {
        console.error('WebSocket connection error:', err);
        setError(err.message);
        dispatch(setWebSocketStatus({
          connected: false,
          socketId: undefined,
          error: err.message,
        }));
      });

      // Subscribe to user events
      socketService.on('order:created', handleOrderCreated);
      socketService.on('order:updated', handleOrderUpdated);
      socketService.on('order:cancelled', handleOrderCancelled);
      socketService.on('inventory:updated', handleInventoryUpdated);
      socketService.on('notification', handleNotification);

      // Subscribe to admin events if user is admin
      if (user.role === 'admin') {
        console.log('WebSocket: Subscribing to admin events');
        socketService.on('admin:order:created', handleAdminOrderCreated);
        socketService.on('admin:order:updated', handleAdminOrderUpdated);
        socketService.on('admin:order:cancelled', handleAdminOrderCancelled);
        socketService.on('admin:inventory:updated', handleAdminInventoryUpdated);
        socketService.on('admin:product:created', handleProductCreated);
        socketService.on('admin:product:updated', handleProductUpdated);
        socketService.on('admin:alert', handleAdminAlert);

        // Subscribe to admin dashboard
        socketService.emit('subscribe:admin');
      }

      // Subscribe to order and inventory updates
      socketService.emit('subscribe:orders');
      socketService.emit('subscribe:inventory');

    } catch (err: any) {
      console.error('Error connecting to WebSocket:', err);
      setError(err.message);
      toast.error('Failed to connect to real-time updates');
    }
  }, [
    isAuthenticated,
    user,
    dispatch,
    handleOrderCreated,
    handleOrderUpdated,
    handleOrderCancelled,
    handleInventoryUpdated,
    handleNotification,
    handleAdminOrderCreated,
    handleAdminOrderUpdated,
    handleAdminOrderCancelled,
    handleAdminInventoryUpdated,
    handleProductCreated,
    handleProductUpdated,
    handleAdminAlert,
  ]);

  const reconnect = useCallback(() => {
    console.log('WebSocket: Manual reconnect triggered');
    socketService.disconnect();
    setIsConnected(false);
    setSocketId(null);
    setError(null);
    setTimeout(() => {
      connectWebSocket();
    }, 500);
  }, [connectWebSocket]);

  // Connect on mount when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      connectWebSocket();
    }

    // Cleanup on unmount
    return () => {
      console.log('WebSocket: Cleaning up');
      socketService.disconnect();
    };
  }, [isAuthenticated, user, connectWebSocket]);

  const contextValue = {
    isConnected,
    socketId,
    error,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};
