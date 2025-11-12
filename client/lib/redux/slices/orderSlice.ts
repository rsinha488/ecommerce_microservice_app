import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { orderApi } from '@/lib/api/order';

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  selectedOrder: null,
  loading: false,
  error: null,
};

// Async thunks
export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (
    orderData: {
      buyerId: string;
      items: OrderItem[];
      shippingAddress?: Order['shippingAddress'];
      currency?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await orderApi.createOrder(orderData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

export const fetchOrders = createAsyncThunk('order/orders', async (_, { rejectWithValue }) => {
  try {
    const response = await orderApi.getOrders();
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
  }
});

export const fetchOrderById = createAsyncThunk(
  'order/orders/',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await orderApi.getOrderById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    /**
     * Update order status from WebSocket event
     */
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: string; updatedAt: string }>) => {
      const { orderId, status, updatedAt } = action.payload;

      // Update in orders list
      const orderIndex = state.orders.findIndex(order => order._id === orderId);
      if (orderIndex !== -1) {
        state.orders[orderIndex].status = status as Order['status'];
        state.orders[orderIndex].updatedAt = updatedAt;
      }

      // Update selected order if it matches
      if (state.selectedOrder?._id === orderId) {
        state.selectedOrder.status = status as Order['status'];
        state.selectedOrder.updatedAt = updatedAt;
      }
    },
    /**
     * Add new order from WebSocket event (admin)
     */
    addOrder: (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedOrder, clearError, updateOrderStatus, addOrder } = orderSlice.actions;
export default orderSlice.reducer;

