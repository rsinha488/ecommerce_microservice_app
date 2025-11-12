import { orderClient } from './client';
import { Order, OrderItem } from '../redux/slices/orderSlice';
import { ApiError } from './auth';

/**
 * Order API interfaces and client
 *
 * Provides type-safe API calls for order management operations.
 * All requests are routed through the API gateway.
 */

export interface CreateOrderRequest {
  buyerId: string;
  items: OrderItem[];
  shippingAddress?: Order['shippingAddress'];
  currency?: string;
}

export interface FilterOrderQuery {
  buyerId?: string;
  status?: Order['status'];
  page?: number;
  limit?: number;
}

/**
 * Order API Client
 *
 * Provides methods for order management with proper error handling
 * and type safety. All methods communicate through the API gateway.
 */
export const orderApi = {
  /**
   * Get all orders (admin) or filtered orders
   * @param filters - Optional filter parameters
   * @returns Promise resolving to list of orders
   * @throws ApiError on fetch failure
   */
  getOrders: async (filters?: FilterOrderQuery): Promise<Order[]> => {
    try {
      const response = await orderClient.get('/order/orders', {
        params: filters,
      });
      // Backend returns array directly
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.response?.data?.message || 'Failed to fetch orders',
        statusCode: error.response?.status,
        error: error.response?.data?.error,
      };
      throw apiError;
    }
  },

  /**
   * Get order by ID
   * @param id - Order ID
   * @returns Promise resolving to order details
   * @throws ApiError on fetch failure
   */
  getOrderById: async (id: string): Promise<Order> => {
    try {
      const response = await orderClient.get(`/order/orders/${id}`);
      return response.data;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.response?.data?.message || 'Failed to fetch order',
        statusCode: error.response?.status,
        error: error.response?.data?.error,
      };
      throw apiError;
    }
  },

  /**
   * Get orders for a specific user (buyer)
   * @param buyerId - User/Buyer ID
   * @returns Promise resolving to user's orders
   * @throws ApiError on fetch failure
   */
  getUserOrders: async (buyerId: string): Promise<Order[]> => {
    try {
      const response = await orderClient.get('/order/orders', {
        params: { buyerId },
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.response?.data?.message || 'Failed to fetch user orders',
        statusCode: error.response?.status,
        error: error.response?.data?.error,
      };
      throw apiError;
    }
  },

  /**
   * Create a new order
   * @param orderData - Order creation data
   * @returns Promise resolving to created order
   * @throws ApiError on creation failure
   */
  createOrder: async (orderData: CreateOrderRequest): Promise<Order> => {
    try {
      const response = await orderClient.post('/order/orders', orderData);
      return response.data;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.response?.data?.message || 'Failed to create order',
        statusCode: error.response?.status,
        error: error.response?.data?.error,
      };
      throw apiError;
    }
  },

  /**
   * Update order status (Admin only)
   * @param id - Order ID
   * @param status - New order status
   * @returns Promise resolving to updated order
   * @throws ApiError on update failure
   */
  updateOrderStatus: async (id: string, status: Order['status']): Promise<Order> => {
    try {
      const response = await orderClient.patch(`/order/orders/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.response?.data?.message || 'Failed to update order status',
        statusCode: error.response?.status,
        error: error.response?.data?.error,
      };
      throw apiError;
    }
  },

  /**
   * Cancel an order
   * @param id - Order ID
   * @returns Promise resolving to cancelled order
   * @throws ApiError on cancellation failure
   */
  cancelOrder: async (id: string): Promise<Order> => {
    try {
      const response = await orderClient.patch(`/order/orders/${id}/status`, {
        status: 'cancelled',
      });
      return response.data;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.response?.data?.message || 'Failed to cancel order',
        statusCode: error.response?.status,
        error: error.response?.data?.error,
      };
      throw apiError;
    }
  },

  /**
   * Get order statistics (Admin only)
   * @returns Promise resolving to order statistics
   * @throws ApiError on fetch failure
   */
  getOrderStats: async (): Promise<{
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
  }> => {
    try {
      const orders = await orderApi.getOrders();
      const stats = {
        total: orders.length,
        pending: orders.filter((o) => o.status === 'pending').length,
        processing: orders.filter((o) => o.status === 'processing').length,
        shipped: orders.filter((o) => o.status === 'shipped').length,
        delivered: orders.filter((o) => o.status === 'delivered').length,
        cancelled: orders.filter((o) => o.status === 'cancelled').length,
        totalRevenue: orders
          .filter((o) => o.status === 'delivered')
          .reduce((sum, o) => sum + o.total, 0),
      };
      return stats;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.response?.data?.message || 'Failed to fetch order statistics',
        statusCode: error.response?.status,
        error: error.response?.data?.error,
      };
      throw apiError;
    }
  },
};

