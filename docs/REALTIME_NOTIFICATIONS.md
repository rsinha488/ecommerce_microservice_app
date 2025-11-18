# Real-Time Notification System

## Overview

The e-commerce platform now features a **global real-time notification system** that delivers Socket.IO events to users and admins across all pages, regardless of where they are in the application. This ensures that important updates are never missed.

## Key Features

✅ **Global WebSocket Connection** - Single persistent connection shared across all pages
✅ **Real-Time Toast Notifications** - Instant visual feedback for all events
✅ **Notification Center** - Persistent notification history accessible from any page
✅ **Unread Badge Counter** - Visual indicator in header showing unread notifications
✅ **User & Admin Support** - Different notification streams for users and administrators
✅ **Automatic Reconnection** - Handles disconnections gracefully
✅ **Redux State Management** - Notifications persist across page navigation

---

## Architecture

### Component Hierarchy

```
Root Layout (app/layout.tsx)
└── StoreProvider (Redux)
    └── WebSocketProvider (Global Socket Connection)
        ├── ConditionalLayout (User/Admin Routing)
        │   ├── Header (with Notification Bell)
        │   └── Page Content
        ├── WebSocketIndicator (Connection Status)
        ├── NotificationCenter (Notification Dropdown)
        └── ToastContainer (Toast Notifications)
```

### Core Components

#### 1. **WebSocketProvider** (`/components/WebSocketProvider.tsx`)

- Establishes single WebSocket connection on user authentication
- Listens to all Socket.IO events globally
- Dispatches notifications to Redux store
- Shows toast notifications for important events
- Automatically subscribes to user or admin channels based on role

**Events Handled:**

**User Events:**
- `order:created` - New order placed
- `order:updated` - Order status changed
- `order:cancelled` - Order cancelled
- `inventory:updated` - Stock levels changed
- `notification` - Generic notifications

**Admin Events:**
- `admin:order:created` - New order from customer
- `admin:order:updated` - Order status changed
- `admin:order:cancelled` - Order cancelled
- `admin:inventory:updated` - Inventory changed
- `admin:product:created` - New product added
- `admin:product:updated` - Product modified
- `admin:alert` - System alerts (low stock, out of stock)

#### 2. **NotificationCenter** (`/components/NotificationCenter.tsx`)

- Dropdown panel accessible from header bell icon
- Displays notification history (last 100 notifications)
- Color-coded by severity (success, info, warning, error)
- "Mark as read" and "Clear all" functionality
- Click outside to close
- Shows relative timestamps ("2m ago", "5h ago")

#### 3. **Notification Redux Slice** (`/lib/redux/slices/notificationSlice.ts`)

**State:**
```typescript
{
  items: Notification[],      // Array of notifications
  unreadCount: number,         // Count of unread notifications
  isOpen: boolean             // Notification center open/closed
}
```

**Notification Type:**
```typescript
{
  id: string,                 // Auto-generated unique ID
  type: 'order' | 'inventory' | 'admin' | 'system',
  severity: 'success' | 'info' | 'warning' | 'error',
  title: string,              // Notification title
  message: string,            // Notification body
  timestamp: number,          // Unix timestamp
  read: boolean,              // Read status
  data?: any                  // Optional event data
}
```

**Actions:**
- `addNotification` - Add new notification
- `markAsRead` - Mark single notification as read
- `markAllAsRead` - Mark all as read
- `removeNotification` - Remove single notification
- `clearAllNotifications` - Clear all notifications
- `toggleNotificationCenter` - Open/close dropdown
- `closeNotificationCenter` - Close dropdown

#### 4. **WebSocket Context** (`/contexts/WebSocketContext.tsx`)

Provides global access to WebSocket status:

```typescript
{
  isConnected: boolean,       // Connection status
  socketId: string | null,    // Socket ID from server
  error: string | null,       // Connection error if any
  reconnect: () => void       // Manual reconnect function
}
```

---

## User Interface

### Notification Bell Icon

**Location:** Top-right corner of header (both user and admin)

- **Grey Bell** - No new notifications
- **Red Badge** - Shows unread count (e.g., "3")
- **Click** - Opens Notification Center

### Notification Center Dropdown

**Features:**
- Scrollable list of notifications
- Color-coded by severity:
  - 🟢 **Green** - Success
  - 🔵 **Blue** - Info
  - 🟡 **Yellow** - Warning
  - 🔴 **Red** - Error
- **Blue highlight** - Unread notifications
- **Timestamp** - Relative time display
- **Actions:**
  - Click notification → Mark as read
  - "Mark all read" button
  - "Clear all" button
  - "Remove" individual notifications

### Toast Notifications

**Automatic Pop-ups:**
- Appear in top-right corner
- Auto-dismiss after 3 seconds (configurable)
- Can be manually dismissed
- Different colors by type (success/info/warning/error)

---

## How It Works

### Connection Flow

1. **User logs in** → Auth state updated in Redux
2. **WebSocketProvider detects authentication** → Initiates connection
3. **Socket connects** → Server sends `connection:success` event
4. **Provider subscribes** to relevant channels (user or admin)
5. **Events received** → Dispatched to Redux + Toast shown
6. **User navigates** → Connection persists, notifications continue
7. **User logs out** → Connection closed

### Event Processing Pipeline

```
Socket.IO Event
    ↓
WebSocketProvider (event listener)
    ↓
┌─────────────────┬──────────────────┐
│ Redux Dispatch  │  Toast Display   │
│ (Notification)  │  (Visual Alert)  │
└─────────────────┴──────────────────┘
    ↓                      ↓
Notification Center    User sees toast
(Persistent storage)   (Temporary alert)
```

---

## Usage Guide

### For Users

**On Any Page:**
1. Look for notification bell icon in header
2. Badge shows unread count
3. Click bell to see notification history
4. Notifications appear as toasts automatically

**Notification Types You'll See:**
- **Order Created** - "Order #ABC123 created successfully!"
- **Order Updated** - "Order #ABC123 is now SHIPPED"
- **Order Cancelled** - "Order #ABC123 has been cancelled"
- **Stock Updated** - "Product stock updated"

### For Admins

**On Any Page:**
1. Look for notification bell icon in admin header
2. Badge shows unread count
3. Click bell to see notification history
4. Notifications appear as toasts automatically

**Notification Types You'll See:**
- **New Order** - "New order #ABC123 from customer@example.com"
- **Order Update** - "Order #ABC123 status: DELIVERED"
- **Inventory Alert** - "Low stock alert for Product XYZ"
- **Product Created** - "Product 'New Item' created!"
- **Out of Stock** - "Product ABC is out of stock!"

---

## Configuration

### Environment Variables

```bash
# WebSocket server URL (client/.env.local)
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3009
```

### Toast Settings

Modify in `app/layout.tsx`:

```tsx
<ToastContainer
  position="top-right"     // Position on screen
  autoClose={3000}         // Auto-dismiss time (ms)
  hideProgressBar={false}  // Show/hide progress bar
  newestOnTop              // New toasts on top
  closeOnClick             // Click to dismiss
  pauseOnHover             // Pause timer on hover
  theme="light"            // Theme: light/dark
/>
```

### Notification Retention

Currently keeps **last 100 notifications** in memory.
Modify in `notificationSlice.ts`:

```typescript
// Keep only last 100 notifications
if (state.items.length > 100) {
  state.items = state.items.slice(0, 100);
}
```

---

## Development Guide

### Adding New Event Types

**1. Update WebSocketProvider:**

```typescript
// In WebSocketProvider.tsx
const handleNewEvent = useCallback((data: any) => {
  console.log('New event:', data);

  dispatch(addNotification({
    type: 'system',
    severity: 'info',
    title: 'Event Title',
    message: data.message,
    data,
  }));

  toast.info(data.message);
}, [dispatch]);

// In connectWebSocket function:
socketService.on('new:event', handleNewEvent);
```

**2. Update Backend (if needed):**

Emit event from realtime service:

```typescript
// services/realtime/src/realtime/realtime.gateway.ts
this.server.to(`user:${userId}`).emit('new:event', {
  message: 'Event occurred',
  timestamp: Date.now(),
});
```

### Accessing Notifications in Components

```typescript
import { useAppSelector } from '@/lib/redux/hooks';

function MyComponent() {
  const { items, unreadCount } = useAppSelector(
    (state) => state.notifications
  );

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {items.map(notification => (
        <div key={notification.id}>
          {notification.message}
        </div>
      ))}
    </div>
  );
}
```

### Manual Notification Dispatch

```typescript
import { useAppDispatch } from '@/lib/redux/hooks';
import { addNotification } from '@/lib/redux/slices/notificationSlice';

function MyComponent() {
  const dispatch = useAppDispatch();

  const showNotification = () => {
    dispatch(addNotification({
      type: 'system',
      severity: 'success',
      title: 'Success!',
      message: 'Operation completed',
    }));
  };

  return <button onClick={showNotification}>Notify</button>;
}
```

---

## Troubleshooting

### Notifications Not Appearing

**Check:**
1. User is authenticated (`isAuthenticated: true`)
2. WebSocket is connected (look for green dot indicator)
3. Browser console for WebSocket errors
4. Realtime service is running on port 3009

### Connection Issues

**Check:**
1. `NEXT_PUBLIC_WEBSOCKET_URL` is set correctly
2. Realtime service is running: `cd services/realtime && pnpm dev`
3. No CORS errors in browser console
4. Network tab shows successful WebSocket upgrade

### Missing Events

**Check:**
1. Event is emitted from backend to correct room
2. Event name matches exactly in provider
3. User is subscribed to correct channel
4. Console logs show event received

---

## Testing

### Test Real-Time Notifications

**User Side:**
1. Login as a user
2. Open browser console
3. Create an order via API or UI
4. Should see:
   - Toast notification appear
   - Notification in center
   - Badge count increase

**Admin Side:**
1. Login as admin
2. Open browser console
3. User creates order (or simulate via backend)
4. Should see:
   - Toast: "New order #ABC123 received!"
   - Notification in admin center
   - Badge count increase

### Manual Event Trigger (Testing)

```typescript
// In browser console (when WebSocketProvider is active)
import { store } from '@/lib/redux/store';
import { addNotification } from '@/lib/redux/slices/notificationSlice';

store.dispatch(addNotification({
  type: 'system',
  severity: 'info',
  title: 'Test Notification',
  message: 'This is a test',
}));
```

---

## Migration Notes

### Before (Page-Level WebSocket)

```typescript
// Each page managed its own connection
function OrdersPage() {
  const { isConnected } = useWebSocket(); // Connected only on this page
  // ...
}
```

**Problem:** Connection lost when navigating away

### After (Global WebSocket)

```typescript
// WebSocketProvider in layout manages single connection
// All pages receive events automatically
function OrdersPage() {
  const { isConnected } = useWebSocket(); // Just reads global status
  // Events handled globally, no need for page-level logic
}
```

**Benefit:** Connection persists across all pages

---

## Backend Integration

### Realtime Service Structure

```
services/realtime/
├── src/
│   ├── realtime/
│   │   ├── realtime.gateway.ts       # Socket.IO gateway
│   │   ├── order-events.consumer.ts  # Kafka order consumer
│   │   └── inventory-events.consumer.ts  # Kafka inventory consumer
│   └── main.ts
```

### Event Flow

```
Microservice (Order/Inventory/Product)
    ↓
Kafka Topic
    ↓
Realtime Service Consumer
    ↓
Socket.IO Gateway
    ↓
Client WebSocketProvider
    ↓
User/Admin sees notification
```

---

## Performance Considerations

- **Single Connection** - No duplicate connections per page
- **Event Throttling** - Kafka consumers handle high throughput
- **Memory Management** - Only last 100 notifications kept
- **Lazy Rendering** - Notification center only renders when open
- **Efficient Updates** - Redux prevents unnecessary re-renders

---

## Security

- **Authentication Required** - Socket connection only for authenticated users
- **User Isolation** - Users only receive their own order events
- **Admin Channel** - Admin events only sent to admin role users
- **Token Validation** - Backend validates JWT tokens (TODO: currently placeholder)

---

## Future Enhancements

🔮 **Potential Improvements:**
- Notification persistence to database
- Mark as read sync across devices
- Notification preferences (enable/disable types)
- Sound alerts for critical notifications
- Desktop browser notifications (Notification API)
- Email/SMS fallback for offline users
- Notification categories and filtering
- Rich notification templates with actions

---

## Related Files

### Frontend
- `/client/components/WebSocketProvider.tsx` - Global socket manager
- `/client/components/NotificationCenter.tsx` - Notification UI
- `/client/contexts/WebSocketContext.tsx` - Context definition
- `/client/lib/redux/slices/notificationSlice.ts` - State management
- `/client/hooks/useWebSocket.ts` - Legacy hook (now uses context)
- `/client/app/layout.tsx` - Provider integration
- `/client/components/Header.tsx` - User notification bell
- `/client/app/admin/components/AdminHeader.tsx` - Admin notification bell

### Backend
- `/services/realtime/src/realtime/realtime.gateway.ts` - Socket.IO server
- `/services/realtime/src/realtime/order-events.consumer.ts` - Order events
- `/services/realtime/src/realtime/inventory-events.consumer.ts` - Inventory events

---

## Summary

The new **Global Real-Time Notification System** ensures that users and admins receive important updates instantly, no matter which page they're on. By centralizing WebSocket management in a global provider, we've eliminated connection issues during navigation and provided a seamless real-time experience across the entire application.

**Key Benefits:**
✅ Never miss important updates
✅ Persistent connection across pages
✅ Visual feedback (toasts + notification center)
✅ Notification history with unread tracking
✅ Role-based event streams (user vs admin)
✅ Automatic reconnection handling

---

**Last Updated:** 2025-01-18
**Version:** 1.0.0
**Maintainer:** Development Team
