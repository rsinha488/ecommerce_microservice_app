import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'order' | 'inventory' | 'admin' | 'system';
  severity: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  data?: any;
}

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  isOpen: boolean;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  isOpen: false,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        read: false,
      };

      state.items.unshift(notification);
      state.unreadCount += 1;

      // Keep only last 100 notifications
      if (state.items.length > 100) {
        state.items = state.items.slice(0, 100);
      }
    },

    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllAsRead: (state) => {
      state.items.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.items = state.items.filter(n => n.id !== action.payload);
    },

    clearAllNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },

    toggleNotificationCenter: (state) => {
      state.isOpen = !state.isOpen;
    },

    closeNotificationCenter: (state) => {
      state.isOpen = false;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
  toggleNotificationCenter,
  closeNotificationCenter,
} = notificationSlice.actions;

export default notificationSlice.reducer;
