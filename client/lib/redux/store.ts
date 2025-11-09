import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { productReducer } from './slices/productSlice';
import cartReducer from './slices/cartSlice';
import orderReducer from './slices/orderSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      product: productReducer,
      cart: cartReducer,
      order: orderReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

