import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from './productSlice';

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
};

// Helper function to calculate totals
const calculateTotals = (items: CartItem[]) => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { itemCount, total };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Product>) => {
      const existingItem = state.items.find((item) => item._id === action.payload._id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
      
      const totals = calculateTotals(state.items);
      state.itemCount = totals.itemCount;
      state.total = totals.total;
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item._id !== action.payload);
      
      const totals = calculateTotals(state.items);
      state.itemCount = totals.itemCount;
      state.total = totals.total;
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find((item) => item._id === action.payload.id);
      
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity);
      }
      
      const totals = calculateTotals(state.items);
      state.itemCount = totals.itemCount;
      state.total = totals.total;
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.itemCount = 0;
      state.total = 0;
      
      // Clear from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart');
      }
    },
    loadCartFromStorage: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      const totals = calculateTotals(state.items);
      state.itemCount = totals.itemCount;
      state.total = totals.total;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, loadCartFromStorage } =
  cartSlice.actions;
export default cartSlice.reducer;

