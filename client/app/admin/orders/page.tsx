'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { orderApi } from '@/lib/api/order';
import { Order } from '@/lib/redux/slices/orderSlice';
import { addOrder, updateOrderStatus as updateOrderStatusRedux } from '@/lib/redux/slices/orderSlice';
import { toast } from 'react-toastify';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useWebSocket } from '@/hooks/useWebSocket';
import { socketService } from '@/lib/websocket/socket.service';

/**
 * Admin Orders Management Page
 *
 * Comprehensive order management dashboard for administrators.
 * Allows viewing all orders, updating statuses, and monitoring order flow.
 *
 * Features:
 * - View all orders across all users
 * - Filter orders by status
 * - Update order status
 * - Order statistics dashboard
 * - Real-time updates via WebSocket
 * - Search and pagination
 *
 * @returns Admin orders management page
 */
export default function AdminOrdersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading: authLoading } = useAppSelector((state) => state.auth);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  });

  // Initialize WebSocket connection for real-time updates
  const { isConnected } = useWebSocket();

  // Local orders state for real-time updates (admin sees new orders from users)
  const [localOrders, setLocalOrders] = useState<Order[]>([]);

  // Infinite scroll for orders
  const fetchOrders = async (page: number, pageSize: number) => {
    const orders = await orderApi.getOrders({ page, limit: pageSize });
    return orders;
  };

  const {
    items: orders,
    loading,
    error: scrollError,
    hasMore,
    setLastElementRef,
    reset,
    refetch,
  } = useInfiniteScroll<Order>(fetchOrders, 1, 20);

  const [error, setError] = useState<string | null>(scrollError);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    // Check if user is admin
    const isAdmin = user?.email?.toLowerCase().includes('admin') || user?.role === 'admin';
    if (!authLoading && isAuthenticated && !isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      router.push('/products');
      return;
    }

    // Fetch stats when authenticated as admin
    if (isAuthenticated && isAdmin) {
      fetchStats();
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Update error state when scroll error occurs
  useEffect(() => {
    if (scrollError) {
      setError(scrollError);
    }
  }, [scrollError]);

  // Sync local orders with fetched orders
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  // Real-time WebSocket listeners for admin
  useEffect(() => {
    if (!isAuthenticated || !user || !isConnected) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    // When a USER creates an order → Admin sees it in real-time
    const handleNewOrderFromUser = (data: any) => {
      console.log('[Admin] New order created by user:', data);

      const newOrder: Order = {
        _id: data.orderId,
        userId: data.buyerId || data.userId,
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
      };

      // Add new order to top of list
      setLocalOrders(prev => [newOrder, ...prev]);

      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        pending: prev.pending + 1,
        totalRevenue: prev.totalRevenue + newOrder.total,
      }));

      // Show notification
      toast.success(`New order #${data.orderId.slice(-8).toUpperCase()} from customer!`, {
        position: 'top-right',
        autoClose: 5000,
      });
    };

    // When a USER cancels an order → Admin sees it in real-time
    const handleOrderCancelledByUser = (data: any) => {
      console.log('[Admin] Order cancelled by user:', data);

      setLocalOrders(prev =>
        prev.map(order =>
          order._id === data.orderId
            ? { ...order, status: 'cancelled', updatedAt: data.cancelledAt || new Date().toISOString() }
            : order
        )
      );

      // Refresh stats
      fetchStats();

      toast.warning(`Order #${data.orderId.slice(-8).toUpperCase()} was cancelled by customer`);
    };

    // Subscribe to admin-specific events
    socket.on('admin:order:created', handleNewOrderFromUser);
    socket.on('admin:order:cancelled', handleOrderCancelledByUser);

    return () => {
      socket.off('admin:order:created');
      socket.off('admin:order:cancelled');
    };
  }, [isAuthenticated, user, isConnected]);

  // Apply client-side filters
  const filteredOrders = useMemo(() => {
    let filtered = localOrders;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.userId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [localOrders, statusFilter, searchTerm]);

  /**
   * Fetch order statistics
   */
  const fetchStats = async () => {
    try {
      const statistics = await orderApi.getOrderStats();
      setStats(statistics);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  /**
   * Handle order status update
   */
  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingStatus(orderId);
      await orderApi.updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);

      // Update local state immediately (optimistic update - no page refresh!)
      setLocalOrders(prev =>
        prev.map(order =>
          order._id === orderId
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        )
      );

      if (selectedOrder?._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      // Refresh stats
      fetchStats();
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error(err.message || 'Failed to update order status');

      // Revert on error
      refetch();
    } finally {
      setUpdatingStatus(null);
    }
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Show loading state
  if (authLoading || (loading && localOrders.length === 0)) {
    return (
      <div className="container-custom py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
            <p className="text-gray-600">Manage and track all customer orders</p>
          </div>
          {/* Real-time connection status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
              title={isConnected ? 'Real-time updates active' : 'Disconnected'}
            />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Live Updates' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
            </div>
            <div className="bg-yellow-600 p-3 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Delivered</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.delivered}</p>
            </div>
            <div className="bg-green-600 p-3 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-purple-600 p-3 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by Order ID or User ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
              disabled={statusFilter === 'delivered' || statusFilter === 'cancelled'}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button onClick={() => reset()} className="btn-secondary whitespace-nowrap">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{order._id.slice(-8).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.userId.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.items.length} items</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">${order.total.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order._id, e.target.value as Order['status'])}
                        disabled={updatingStatus === order._id || order.status === 'delivered' || order.status === 'cancelled'}
                        className={`text-sm font-semibold rounded-full px-3 py-1 ${getStatusColor(order.status)} disabled:opacity-50`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        {selectedOrder?._id === order._id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && !loading && localOrders.length > 0 && (
        <div ref={setLastElementRef} className="py-8 text-center">
          <div className="animate-pulse text-gray-600">Loading more orders...</div>
        </div>
      )}

      {/* Loading More Indicator */}
      {loading && localOrders.length > 0 && (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading more orders...</p>
        </div>
      )}

      {/* No More Items */}
      {!hasMore && localOrders.length > 0 && !loading && (
        <div className="py-8 text-center text-gray-500">
          <p>No more orders to load</p>
        </div>
      )}

      {/* Selected Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Order #{selectedOrder._id.slice(-8).toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items && Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item?.name || 'Unknown Item'}</p>
                          <p className="text-sm text-gray-600">
                            ${(item?.unitPrice || 0).toFixed(2)} × {item?.quantity || 0}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          ${((item?.unitPrice || 0) * (item?.quantity || 0)).toFixed(2)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No items in this order</p>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress ? (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Shipping Address</h4>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-gray-900">{selectedOrder.shippingAddress.street}</p>
                    <p className="text-gray-600">
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{' '}
                      {selectedOrder.shippingAddress.zipCode}
                    </p>
                    <p className="text-gray-600">{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Shipping Address</h4>
                  <p className="text-sm text-gray-500">No shipping address provided</p>
                </div>
              )}
              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal:</span>
                    <span>${(selectedOrder.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax (10%):</span>
                    <span>${(selectedOrder.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                    <span>Total Amount:</span>
                    <span className="text-primary-600">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
