import { orderClient } from './client';
import { Order, OrderItem } from '../redux/slices/orderSlice';

export interface CreateOrderRequest {
  items: OrderItem[];
  shippingAddress: Order['shippingAddress'];
}

export const orderApi = {
  getOrders: async (): Promise<Order[]> => {
    const response = await orderClient.get('/order/orders');
    return response.data;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await orderClient.get(`/order/orders/${id}`);
    return response.data;
  },

  createOrder: async (orderData: CreateOrderRequest): Promise<Order> => {
    const response = await orderClient.post('/order/orders', orderData);
    return response.data;
  },

  updateOrderStatus: async (
    id: string,
    status: Order['status']
  ): Promise<Order> => {
    const response = await orderClient.patch(`/order/orders/${id}/status`, { status });
    return response.data;
  },

  cancelOrder: async (id: string): Promise<Order> => {
    const response = await orderClient.post(`/order/orders/${id}/cancel`);
    return response.data;
  },
};

