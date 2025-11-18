# Quick WebSocket Test Guide

## Quick Start

### 1. Start All Services

```bash
# Terminal 1 - Realtime Service
cd services/realtime
pnpm run dev

# Terminal 2 - Order Service (optional, for full testing)
cd services/order
pnpm run dev

# Terminal 3 - Client
cd client
npm run dev
```

### 2. Open Browser & Check Connection

1. Open http://localhost:3000
2. Login with your credentials
3. Open Browser Console (F12)
4. Look for green dot indicator in bottom-right corner

### 3. Check WebSocket Status

**In Browser Console, run:**
```javascript
// Check connection status
const state = window.__REDUX_STORE__?.getState();
console.log('Auth:', state.auth.isAuthenticated);
console.log('WebSocket:', state.auth.websocket);
console.log('Notifications:', state.notifications);
```

**Expected Output:**
```javascript
Auth: true
WebSocket: { connected: true, socketId: "abc123...", error: undefined }
Notifications: { items: [], unreadCount: 0, isOpen: false }
```

### 4. Test Real-Time Notification (Manual)

**Simulate an order event in browser console:**
```javascript
// Get Redux store
const store = window.__REDUX_STORE__;

// Import actions
const { addNotification } = await import('/lib/redux/slices/notificationSlice');

// Dispatch test notification
store.dispatch({
  type: 'notifications/addNotification',
  payload: {
    type: 'order',
    severity: 'success',
    title: 'Test Notification',
    message: 'This is a test notification!'
  }
});

// Check notification appeared
console.log('Notifications:', store.getState().notifications.items);
```

**Expected Result:**
- Toast notification appears in top-right
- Notification bell shows red badge with "1"
- Click bell to see notification in dropdown

---

## Test Scenarios

### Scenario 1: User Order Creation

**User Side:**
1. Login as user
2. Add product to cart
3. Go to checkout
4. Create order
5. **Watch for toast notification**

**What to Look For:**
- ✅ Toast: "Order #... created successfully!"
- ✅ Bell icon shows badge count
- ✅ Console: `Order created: { orderId: '...', ... }`

### Scenario 2: Admin Sees New Order

**Setup:**
- User browser: Logged in as regular user
- Admin browser: Logged in as admin (separate browser/incognito)

**Steps:**
1. User creates an order
2. **Switch to admin browser**

**What Admin Should See:**
- ✅ Toast: "New order #... received!"
- ✅ Bell icon updates
- ✅ Console: `Admin - New order: { orderId: '...', ... }`

### Scenario 3: User Receives Order Update

**Setup:**
- User browser: Logged in and on any page (not just orders page)
- Admin browser: Logged in as admin

**Steps:**
1. Admin goes to Orders page
2. Admin changes order status
3. **Switch to user browser**

**What User Should See (even on different page):**
- ✅ Toast: "Order #... is now PROCESSING" (or whatever status)
- ✅ Bell icon updates
- ✅ Console: `Order updated: { orderId: '...', status: '...', ... }`

---

## Troubleshooting Commands

### Check if Realtime Service is Running
```bash
curl http://localhost:3009/health
# Should return: {"status":"ok"}
```

### Check WebSocket Connection (Browser)
```javascript
// Connection status
window.__REDUX_STORE__?.getState().auth.websocket.connected

// If false, check error
window.__REDUX_STORE__?.getState().auth.websocket.error
```

### Force Reconnect (Browser)
```javascript
// Get reconnect function
const { useWebSocketContext } = await import('/contexts/WebSocketContext');
// In React component, call: reconnect()
```

### View All Notifications (Browser)
```javascript
const notifications = window.__REDUX_STORE__?.getState().notifications.items;
console.table(notifications);
```

### Clear All Notifications (Browser)
```javascript
window.__REDUX_STORE__?.dispatch({
  type: 'notifications/clearAllNotifications'
});
```

---

## Expected Console Logs

### On Successful Connection:
```
WebSocket: User not authenticated, skipping connection
WebSocket: Connecting... { userId: '123', role: 'user' }
[WebSocket] Connecting to http://localhost:3009...
[WebSocket] Connected successfully
WebSocket connected: { socketId: 'abc123...', message: 'Connection successful' }
```

### On Order Created:
```
Order created: {
  orderId: "abc123",
  status: "pending",
  totalAmount: 99.99,
  items: [...],
  createdAt: "2025-01-18T...",
  message: "Your order has been placed successfully!",
  timestamp: "2025-01-18T..."
}
```

### On Order Updated:
```
Order updated: {
  orderId: "abc123",
  status: "processing",
  previousStatus: "pending",
  updatedAt: "2025-01-18T...",
  message: "Your order is being processed",
  timestamp: "2025-01-18T..."
}
```

---

## Common Issues & Fixes

### Issue 1: "WebSocket indicator is red"

**Cause:** Realtime service not running or wrong URL

**Fix:**
```bash
# Check if service is running
lsof -i :3009

# If not, start it
cd services/realtime && pnpm run dev

# Check client .env.local
cat client/.env.local | grep WEBSOCKET
# Should be: NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3009
```

### Issue 2: "No notifications appearing"

**Check:**
1. User is authenticated
2. WebSocket is connected (green dot)
3. Console shows event received

**Debug:**
```javascript
// Check all states
const state = window.__REDUX_STORE__?.getState();
console.log('Authenticated?', state.auth.isAuthenticated);
console.log('Connected?', state.auth.websocket.connected);
console.log('User Role:', state.auth.user?.role);
```

### Issue 3: "Admin not receiving events"

**Check:**
```javascript
// Verify admin role
window.__REDUX_STORE__?.getState().auth.user?.role
// Should be: "admin"

// Check console for subscription message
// Should see: "WebSocket: Subscribing to admin events"
```

### Issue 4: "Events stop after page navigation"

**This should NOT happen anymore!** The WebSocketProvider is global.

**If it does:**
```javascript
// Check if provider is mounted
const state = window.__REDUX_STORE__?.getState();
console.log('Connection persists?', state.auth.websocket.connected);
// Should still be true after navigation
```

---

## Success Criteria

✅ **WebSocket connects automatically on login**
✅ **Green indicator visible in bottom-right**
✅ **Toast notifications appear for events**
✅ **Bell icon shows unread count**
✅ **Notification center shows history**
✅ **Notifications work on ALL pages (not just orders page)**
✅ **Admin receives new order notifications**
✅ **User receives order status updates**
✅ **Connection persists across page navigation**

---

## Next Steps

If all tests pass:
1. ✅ Real-time notifications are working!
2. Test with real order creation flow
3. Test with multiple users simultaneously
4. Monitor performance under load

If tests fail:
1. Check [REALTIME_NOTIFICATIONS_TROUBLESHOOTING.md](./REALTIME_NOTIFICATIONS_TROUBLESHOOTING.md)
2. Review console logs for errors
3. Verify all services are running
4. Check network tab for WebSocket upgrade

---

**Quick Test Checklist:**
- [ ] Realtime service running on port 3009
- [ ] Client running on port 3000
- [ ] User can login
- [ ] Green WebSocket indicator appears
- [ ] Test notification dispatches successfully
- [ ] Bell icon shows badge
- [ ] Notification center opens on click
- [ ] Notifications persist across page navigation

**Happy Testing! 🎉**
