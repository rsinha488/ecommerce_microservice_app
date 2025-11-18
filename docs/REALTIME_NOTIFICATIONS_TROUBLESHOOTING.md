# Real-Time Notifications - Troubleshooting & Testing Guide

## Issue Fixed: Real-Time Updates Not Showing

### Problem
Users and admins were not receiving real-time socket notifications when:
- User creates an order
- Admin updates order status
- User cancels an order

### Root Cause
The frontend WebSocketProvider event handlers were expecting incorrect data structures from the backend. There was a mismatch between:
- **Backend payload structure**: `{ orderId, status, totalAmount, items, message, ... }`
- **Frontend expectations**: `{ order: { id, status, ... } }`

### Solution
Updated all event handlers in [WebSocketProvider.tsx](../client/components/WebSocketProvider.tsx) to correctly parse the backend payload structure.

---

## Fixed Event Handlers

### 1. User Events

#### `order:created`
**Before:**
```typescript
dispatch(addOrder(data.order)); // ❌ data.order doesn't exist
toast.success(`Order #${data.order.id} created`); // ❌ undefined
```

**After:**
```typescript
const order = {
  _id: data.orderId,          // ✅ Backend sends orderId directly
  userId: user.id,
  items: data.items || [],
  total: data.totalAmount || 0,
  status: data.status || 'pending',
  // ... full order structure
};
dispatch(addOrder(order)); // ✅ Correct structure
toast.success(data.message || `Order #${data.orderId} created`); // ✅ Works
```

#### `order:updated`
**Before:**
```typescript
dispatch(updateOrderStatus({
  orderId: data.orderId,    // ✅ Already correct
  status: data.status,       // ✅ Already correct
  updatedAt: data.updatedAt, // ✅ Already correct
}));
// But notification and toast used data.order ❌
```

**After:**
```typescript
dispatch(updateOrderStatus({
  orderId: data.orderId,
  status: data.status,
  updatedAt: data.updatedAt || new Date().toISOString(),
}));
// Fixed notification and toast to use data directly ✅
toast.info(data.message || `Order #${data.orderId} updated`);
```

#### `order:cancelled`
**Before:**
```typescript
dispatch(updateOrderStatus({
  orderId: data.order.id,  // ❌ data.order doesn't exist
  status: 'CANCELLED',
}));
```

**After:**
```typescript
dispatch(updateOrderStatus({
  orderId: data.orderId,   // ✅ Correct field
  status: 'CANCELLED',
  updatedAt: data.cancelledAt || new Date().toISOString(),
}));
```

### 2. Admin Events

#### `admin:order:created`
**Before:**
```typescript
dispatch(addOrder(data.order)); // ❌ data.order doesn't exist
toast.success(`New order #${data.order.id} received!`); // ❌ undefined
```

**After:**
```typescript
const order = {
  _id: data.orderId,          // ✅ Backend sends orderId directly
  userId: data.buyerId,       // ✅ For admin, use buyerId
  items: data.items || [],
  total: data.totalAmount || 0,
  status: data.status || 'pending',
  // ... full order structure
};
dispatch(addOrder(order)); // ✅ Correct structure
toast.success(`New order #${data.orderId} received!`); // ✅ Works
```

#### `admin:order:updated`
**Fixed same as user `order:updated`** - Now uses `data.orderId` instead of `data.order.id`

#### `admin:order:cancelled`
**Fixed same as user `order:cancelled`** - Now uses `data.orderId` instead of `data.order.id`

---

## Backend Payload Reference

### Order Events Payload Structure

Based on [order-events.consumer.ts](../services/realtime/src/kafka/order-events.consumer.ts):

#### `order:created` / `admin:order:created`
```typescript
{
  orderId: string,         // Order ID
  status: string,          // 'pending', 'processing', etc.
  totalAmount: number,     // Total order amount
  items: Array<any>,       // Order items
  createdAt: string,       // ISO timestamp
  message: string,         // User-friendly message
  timestamp: string        // Added by gateway
}
```

#### `order:updated` / `admin:order:updated`
```typescript
{
  orderId: string,         // Order ID
  status: string,          // New status
  previousStatus: string,  // Previous status
  updatedAt: string,       // ISO timestamp
  message: string,         // User-friendly message
  timestamp: string        // Added by gateway
}
```

#### `order:cancelled` / `admin:order:cancelled`
```typescript
{
  orderId: string,         // Order ID
  reason: string,          // Cancellation reason
  refundAmount: number,    // Refund amount (if any)
  cancelledAt: string,     // ISO timestamp
  message: string,         // User-friendly message
  timestamp: string        // Added by gateway
}
```

---

## Testing Real-Time Notifications

### Prerequisites

1. **Start Realtime Service:**
   ```bash
   cd services/realtime
   pnpm install
   pnpm run dev
   ```
   Should run on: `http://localhost:3009`

2. **Start Kafka & Zookeeper:**
   ```bash
   docker-compose up -d kafka zookeeper
   ```

3. **Start Order Service:**
   ```bash
   cd services/order
   pnpm install
   pnpm run dev
   ```

4. **Start Client:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

### Test Case 1: User Creates Order

**Steps:**
1. Login as a user
2. Add products to cart
3. Go to checkout and create order
4. Open browser console

**Expected Results:**
- ✅ Toast notification: "Order #ABC123 created successfully!"
- ✅ Notification bell shows red badge with count
- ✅ Click bell → See "Order Created" notification
- ✅ Console log: "Order created: { orderId: '...', status: 'pending', ... }"

**If Admin is Logged In (Different Browser):**
- ✅ Admin sees toast: "New order #ABC123 received!"
- ✅ Admin notification bell updates
- ✅ Admin sees "New Order Received" notification

### Test Case 2: Admin Updates Order Status

**Steps:**
1. Login as admin
2. Go to Admin → Orders
3. Select an order
4. Change status (e.g., "pending" → "processing")

**Expected Results (Admin Side):**
- ✅ Toast: "Order #ABC123 updated to processing"
- ✅ Notification bell updates
- ✅ See "Order Status Changed" notification

**Expected Results (User Side - If Logged In):**
- ✅ Toast: "Order #ABC123 is now processing"
- ✅ Notification bell updates
- ✅ See "Order Updated" notification
- ✅ Orders page automatically refreshes status

### Test Case 3: User Cancels Order

**Steps:**
1. Login as user
2. Go to Orders page
3. Click "Cancel" on an order

**Expected Results (User Side):**
- ✅ Toast: "Order #ABC123 has been cancelled"
- ✅ Notification bell updates
- ✅ See "Order Cancelled" notification
- ✅ Order status updates in list

**Expected Results (Admin Side - If Logged In):**
- ✅ Toast: "Order #ABC123 has been cancelled"
- ✅ Admin notification bell updates
- ✅ Admin sees "Order Cancelled" notification

### Test Case 4: Navigation Persistence

**Steps:**
1. Login as user
2. Create an order (see notification)
3. Navigate to Products page
4. Admin updates your order
5. Stay on Products page

**Expected Results:**
- ✅ Toast notification appears on Products page
- ✅ Notification bell updates (even on Products page)
- ✅ Click bell → See notification history
- ✅ Navigate to Orders → See updated status

### Test Case 5: WebSocket Reconnection

**Steps:**
1. Login as user
2. Stop realtime service: `Ctrl+C`
3. Wait 5 seconds
4. Start realtime service again: `pnpm run dev`

**Expected Results:**
- ✅ Green WebSocket indicator turns red when disconnected
- ✅ Automatically reconnects within a few seconds
- ✅ Green indicator returns
- ✅ Toast: "Connected to real-time updates"

---

## Debugging

### Check WebSocket Connection

**Browser Console:**
```javascript
// Check if socket is connected
window.__REDUX_STORE__?.getState().auth.websocket
// Should show: { connected: true, socketId: '...', error: null }

// Check notifications
window.__REDUX_STORE__?.getState().notifications
// Should show: { items: [...], unreadCount: 2, isOpen: false }
```

### Enable Detailed Logging

**Frontend (Browser Console):**
```javascript
localStorage.setItem('debug', 'socket.io-client:*');
// Refresh page
```

**Backend (Realtime Service Terminal):**
- Already enabled by default
- Look for logs like:
  - `📦 Order created event received - OrderID: ...`
  - `✅ Order created notification sent to user ...`

### Common Issues

#### 1. "WebSocket connection failed"
**Check:**
- Realtime service is running on port 3009
- No firewall blocking port 3009
- `NEXT_PUBLIC_WEBSOCKET_URL` in `.env.local` is correct

**Fix:**
```bash
# client/.env.local
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3009
```

#### 2. "No notifications appearing"
**Check:**
- User is authenticated
- WebSocket indicator is green
- Browser console shows: `WebSocket connected: { socketId: '...' }`
- Backend logs show event received

**Debug:**
```javascript
// In browser console
window.__REDUX_STORE__?.getState().auth.isAuthenticated // Should be true
window.__REDUX_STORE__?.getState().auth.websocket.connected // Should be true
```

#### 3. "Admin not receiving user events"
**Check:**
- Admin user has `role: 'admin'` in auth state
- Backend logs show: `WebSocket: Subscribing to admin events`
- Admin has subscribed to `admin:dashboard`

**Debug:**
```javascript
// In admin browser console
window.__REDUX_STORE__?.getState().auth.user.role // Should be 'admin'
```

#### 4. "Events received but Redux not updating"
**Check:**
- Console logs show: "Order created: { orderId: '...' }"
- But order doesn't appear in list

**Possible causes:**
- Order ID format mismatch (`_id` vs `id`)
- User ID doesn't match
- Redux action payload incorrect

**Fix:**
- Check browser console for errors
- Verify payload structure matches Redux expectations

---

## Architecture Flow

```
User Action (Create Order)
    ↓
Order Service
    ↓
Kafka Topic (order.created)
    ↓
Realtime Service (Kafka Consumer)
    ↓
Socket.IO Emit (order:created)
    ↓
Client WebSocketProvider (Event Listener)
    ↓
┌─────────────────┬──────────────────┐
│ Redux Dispatch  │  Toast Display   │
│ (Add Order)     │  (Success Toast) │
└─────────────────┴──────────────────┘
    ↓                      ↓
Orders Page Updates    User sees toast
Notification Center    Notification badge
```

---

## Key Files Modified

### Frontend
1. **[WebSocketProvider.tsx](../client/components/WebSocketProvider.tsx)** - Fixed all event handlers to match backend payload
2. **[useWebSocket.ts](../client/hooks/useWebSocket.ts)** - Added safe defaults for SSR
3. **[WebSocketContext.tsx](../client/contexts/WebSocketContext.tsx)** - Graceful fallback instead of error

### Backend (Reference)
- **[order-events.consumer.ts](../services/realtime/src/kafka/order-events.consumer.ts)** - Defines payload structure
- **[realtime.gateway.ts](../services/realtime/src/realtime/realtime.gateway.ts)** - Emits socket events

---

## Summary

The real-time notification system now works correctly with the following improvements:

✅ **User events** properly parsed from backend payload
✅ **Admin events** correctly handled with same structure
✅ **Toast notifications** appear on all pages
✅ **Notification center** persists across navigation
✅ **Redux state** updates correctly
✅ **SSR-safe** context handling

**Result:** Users and admins now receive instant real-time updates regardless of which page they're on!

---

**Last Updated:** 2025-01-18
**Version:** 1.1.0
**Status:** ✅ Fixed and Tested
