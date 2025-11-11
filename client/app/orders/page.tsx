'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchOrders } from '@/lib/redux/slices/orderSlice';
import { useWebSocket } from '@/hooks/useWebSocket';
import { orderApi } from '@/lib/api/order';
import { Order } from '@/lib/redux/slices/orderSlice';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const { orders, loading, error } = useAppSelector((state) => state.order);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // Initialize WebSocket connection for real-time order updates
  useWebSocket();

  // Filter orders for current user
  const userOrders = orders.filter(order => order.userId === user?.id);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchOrders());
    }
  }, [dispatch, isAuthenticated]);

  /**
   * Handle order cancellation
   */
  const handleCancelOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this order?\n\nThis action cannot be undone.'
    );

    if (!confirmCancel) return;

    try {
      setCancelling(orderId);
      await orderApi.cancelOrder(orderId);
      toast.success('Order cancelled successfully');

      // Refresh orders
      dispatch(fetchOrders());
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container-custom py-12">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-gray-300 mb-4">
            Please Sign In
          </h1>
          <p className="text-gray-600 mb-8">
            You need to be logged in to view your orders
          </p>
          <Link href="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-custom py-12">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-12">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading orders: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-300 mb-2">My Orders</h1>
            <p className="text-gray-600">View and track your orders</p>
          </div>
          {/* WebSocket Connection Status Indicator */}
          {/* <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                websocket.connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
              title={websocket.connected ? 'Connected to real-time updates' : 'Disconnected'}
            />
            <span className="text-sm text-gray-600">
              {websocket.connected ? 'Live' : 'Offline'}
            </span>
          </div> */}
        </div>
      </div>

      {userOrders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-gray-300 mb-4">
            No Orders Yet
          </h2>
          <p className="text-gray-600 mb-8">
            Start shopping to see your orders here
          </p>
          <Link href="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {userOrders.map((order) => (
            <div
              key={order._id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-300">
                    Order #{order._id.slice(-8).toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : order.status === 'shipped'
                      ? 'bg-purple-100 text-purple-800'
                      : order.status === 'processing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-300 mb-2">Items:</h4>
                <ul className="space-y-2">
                  {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <li key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item?.name || 'Unknown Item'} x {item?.quantity || 0}
                        </span>
                        <span className="text-gray-300 font-semibold">
                          ${((item?.unitPrice || 0) * (item?.quantity || 0)).toFixed(2)}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500">No items</li>
                  )}
                </ul>
              </div>

              {/* Expanded Details */}
              {selectedOrder?._id === order._id && order.shippingAddress && (
                <div className="mt-6 pt-6 border-t">
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Shipping Address</h4>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-gray-900">{order.shippingAddress.street}</p>
                      <p className="text-gray-600">
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                      <p className="text-gray-600">{order.shippingAddress.country}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t mt-4 pt-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-xl font-bold text-gray-300">
                    ${order.total.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={(e) => handleCancelOrder(order._id, e)}
                      disabled={cancelling === order._id}
                      className="btn-secondary disabled:opacity-50"
                    >
                      {cancelling === order._id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                  <Link
                    href={`/orders/${order._id}`}
                    className="btn-outline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

