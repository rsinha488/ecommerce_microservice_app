'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchOrders } from '@/lib/redux/slices/orderSlice';
import { useWebSocket } from '@/hooks/useWebSocket';
import Link from 'next/link';

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const { orders, loading, error } = useAppSelector((state) => state.order);
  const { isAuthenticated, websocket } = useAppSelector((state) => state.auth);


  // Initialize WebSocket connection for real-time order updates
  useWebSocket();

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchOrders());
    }
  }, [dispatch, isAuthenticated]);

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

      {orders.length === 0 ? (
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
          {orders.map((order) => (
            <div key={order._id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-300">
                    Order #{order._id.slice(-8)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-300 mb-2">Items:</h4>
                <ul className="space-y-2">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.productName} x {item.quantity}
                      </span>
                      <span className="text-gray-300 font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t mt-4 pt-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-xl font-bold text-gray-300">
                    ${order.total.toFixed(2)}
                  </p>
                </div>
                <Link
                  href={`/orders/${order._id}`}
                  className="btn-outline"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

