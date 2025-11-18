# Debugging Real-Time Notifications

## Issue: User Not Seeing Toast Notifications for Status Changes

If users are not seeing toast notifications when admins change order status to `processing`, `shipped`, `cancelled`, or `paid`, follow this debugging guide.

---

## Quick Diagnostics

### Step 1: Check Browser Console

**User Browser (Open DevTools Console - F12):**

When admin changes order status, you should see these logs:

```
🔔 [USER] Order updated event received: { orderId: '...', status: 'processing', ... }
📦 Order abc123 status changed to: processing (uppercase: PROCESSING)
🔵 Toast type: INFO (processing)
✅ Notification added to center
🔔 Showing toast notification: "Your order #abc123 is now processing"
ℹ️ INFO toast displayed
```

**If you DON'T see these logs:**
- ❌ WebSocket event is not being received
- Go to **Step 2: Check WebSocket Connection**

**If you DO see logs but NO toast appears:**
- ❌ Toast library issue
- Go to **Step 4: Check Toast Container**

---

### Step 2: Check WebSocket Connection

**In User Browser Console:**
```javascript
// Check connection status
const wsState = window.__REDUX_STORE__?.getState().auth.websocket;
console.log('WebSocket Status:', wsState);
```

**Expected Output:**
```javascript
{
  connected: true,
  socketId: "abc123...",
  error: undefined
}
```

**If `connected: false`:**

1. **Check green indicator** - Should be visible in bottom-right corner
2. **Check realtime service** - Should be running on port 3009
   ```bash
   curl http://localhost:3009/health
   # Should return: {"status":"ok"}
   ```
3. **Check environment variable**
   ```bash
   cat client/.env.local | grep WEBSOCKET
   # Should show: NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3009
   ```

---

### Step 3: Verify Event Subscription

**In User Browser Console:**
```javascript
// Check if user is authenticated
const auth = window.__REDUX_STORE__?.getState().auth;
console.log('Authenticated:', auth.isAuthenticated);
console.log('User:', auth.user);
```

**Expected:**
```javascript
Authenticated: true
User: { id: '...', email: '...', role: 'user' }
```

**If not authenticated:**
- WebSocket won't connect
- User needs to login first

---

### Step 4: Check Toast Container

**Look for ToastContainer in page:**
```javascript
// Check if ToastContainer is mounted
document.querySelector('.Toastify');
// Should return: <div class="Toastify">...</div>
```

**If null:**
- Toast container is not mounted
- Check [layout.tsx](../client/app/layout.tsx) includes `<ToastContainer />`

---

### Step 5: Test Event Manually

**Manually trigger a toast notification:**

```javascript
const { toast } = await import('react-toastify');

toast.info('Test notification - Processing');
toast.success('Test notification - Delivered');
toast.warning('Test notification - Cancelled');
```

**If toasts appear:**
- ✅ Toast library works
- ❌ WebSocket event not being received or handler not triggered

**If toasts DON'T appear:**
- ❌ Toast container issue
- Check imports in layout.tsx

---

## Complete Testing Flow

### Test Case: Admin Changes Status to "processing"

**Setup:**
1. **Terminal 1:** Start realtime service
   ```bash
   cd services/realtime
   pnpm run dev
   ```

2. **Terminal 2:** Start client
   ```bash
   cd client
   npm run dev
   ```

3. **Browser 1:** Login as user, open console (F12)
4. **Browser 2 (Incognito):** Login as admin

**Steps:**
1. Admin: Go to Orders → Select order → Change status to "processing"
2. User Console: Watch for logs

**Expected Console Output:**
```
🔔 [USER] Order updated event received: {
  orderId: "abc123",
  status: "processing",
  previousStatus: "pending",
  updatedAt: "2025-01-18T...",
  message: "Your order is being processed",
  timestamp: "2025-01-18T..."
}
📦 Order abc123 status changed to: processing (uppercase: PROCESSING)
🔵 Toast type: INFO (processing)
✅ Notification added to center
🔔 Showing toast notification: "Your order #abc123 is now processing"
ℹ️ INFO toast displayed
```

**Expected UI:**
- 🔵 Blue toast appears in top-right: "Your order #abc123 is now processing"
- 🔔 Bell icon shows red badge
- Click bell → See notification in center

---

## Debugging by Status

### Status: "processing"

**Console Should Show:**
```
🔵 Toast type: INFO (processing)
ℹ️ INFO toast displayed
```

**Toast:** Blue info toast

**If not showing:**
- Check console for the 🔔 event received log
- If event received but no toast, check ToastContainer

---

### Status: "shipped"

**Console Should Show:**
```
🔵 Toast type: INFO (shipped)
ℹ️ INFO toast displayed
```

**Toast:** Blue info toast

---

### Status: "paid"

**Console Should Show:**
```
🟢 Toast type: SUCCESS (paid)
✅ SUCCESS toast displayed
```

**Toast:** Green success toast

---

### Status: "cancelled"

**Console Should Show:**
```
🟡 Toast type: WARNING (cancelled)
⚠️ WARNING toast displayed
```

**Toast:** Yellow warning toast

---

### Status: "delivered"

**Console Should Show:**
```
🟢 Toast type: SUCCESS (delivered)
✅ SUCCESS toast displayed
```

**Toast:** Green success toast

---

## Backend Verification

### Check if Event is Being Sent

**Realtime Service Terminal:**

When admin changes order status, you should see:
```
📦 Order updated event received - OrderID: abc123, Status: processing
✅ Order update notification sent to user 123
```

**If you DON'T see this:**
- Order service might not be publishing to Kafka
- Check order service logs

---

### Check Kafka Event

**Order Service Terminal:**

When admin updates order status:
```
Publishing to Kafka topic: order.updated
Payload: { orderId: 'abc123', status: 'processing', buyerId: '123', ... }
```

**If you DON'T see this:**
- Check order status update endpoint
- Check Kafka connection

---

## Common Issues & Solutions

### Issue 1: "Event received but no toast"

**Symptoms:**
- Console shows: `🔔 [USER] Order updated event received`
- Console shows: `🔔 Showing toast notification`
- But NO toast appears on screen

**Solution:**
```javascript
// Check ToastContainer
document.querySelector('.Toastify');

// If null, ToastContainer not mounted
// Check layout.tsx has <ToastContainer />
```

---

### Issue 2: "No logs at all"

**Symptoms:**
- Admin changes status
- User console shows NOTHING

**Solution:**
1. Check WebSocket connection:
   ```javascript
   window.__REDUX_STORE__?.getState().auth.websocket
   ```
2. If `connected: false`, check realtime service
3. Check network tab for WebSocket upgrade

---

### Issue 3: "Only some statuses show toast"

**Symptoms:**
- `delivered` and `cancelled` work
- `processing`, `shipped`, `paid` don't work

**Solution:**
This was the original issue - should be fixed now. Check:
```javascript
// In WebSocketProvider.tsx line 99-103
// ALL statuses should trigger toast
```

---

### Issue 4: "Toast shows but wrong color"

**Current Color Mapping:**
- 🟢 Green (Success): `delivered`, `paid`
- 🟡 Yellow (Warning): `cancelled`
- 🔵 Blue (Info): `pending`, `processing`, `shipped`

If wrong color, check status value in console log.

---

### Issue 5: "User on different page doesn't see toast"

**This should work!** WebSocket is global.

**Debug:**
1. User stays on Products page
2. Admin changes order status
3. User console should still show event logs
4. Toast should still appear

**If not working:**
- Check WebSocketProvider is in root layout
- Check user is still authenticated

---

## Advanced Debugging

### Enable Socket.IO Debug Logs

**Browser Console:**
```javascript
localStorage.setItem('debug', 'socket.io-client:*');
// Refresh page
```

**You'll see detailed Socket.IO logs:**
```
socket.io-client:socket emitting event "subscribe:orders"
socket.io-client:socket received event "order:updated"
```

---

### Monitor All Events

**Browser Console:**
```javascript
// Listen to all socket events
const socketService = (await import('/lib/websocket/socket.service')).socketService;
const socket = socketService.getSocket();

socket.onAny((event, ...args) => {
  console.log(`🔌 Socket Event: ${event}`, args);
});
```

---

### Check Redux State Updates

**Browser Console:**
```javascript
// Subscribe to Redux changes
const store = window.__REDUX_STORE__;
let prevState = store.getState();

store.subscribe(() => {
  const newState = store.getState();

  // Check if orders changed
  if (prevState.order.orders !== newState.order.orders) {
    console.log('📊 Orders updated in Redux');
  }

  // Check if notifications changed
  if (prevState.notifications.items !== newState.notifications.items) {
    console.log('🔔 Notifications updated:', newState.notifications.items);
  }

  prevState = newState;
});
```

---

## Status Values Reference

**Backend Order Statuses:**
```typescript
type OrderStatus = 'pending' | 'processing' | 'paid' | 'cancelled' | 'shipped' | 'delivered';
```

**All statuses are lowercase in backend!**

Frontend converts to uppercase for comparison:
```typescript
const statusUpper = status.toUpperCase(); // 'processing' → 'PROCESSING'
```

---

## Checklist

Before reporting an issue, verify:

- [ ] Realtime service running on port 3009
- [ ] User is authenticated (logged in)
- [ ] WebSocket connected (green indicator visible)
- [ ] Browser console shows event received logs
- [ ] ToastContainer is mounted
- [ ] Manual toast test works
- [ ] Admin and user are testing different orders (not same order)
- [ ] No JavaScript errors in console
- [ ] `NEXT_PUBLIC_WEBSOCKET_URL` environment variable is set

---

## Expected Behavior Summary

✅ **User should see toast for ALL status changes:**
- `pending` → 🔵 Blue info toast
- `processing` → 🔵 Blue info toast
- `paid` → 🟢 Green success toast
- `shipped` → 🔵 Blue info toast
- `cancelled` → 🟡 Yellow warning toast
- `delivered` → 🟢 Green success toast

✅ **Toasts should appear on ALL pages** (not just orders page)

✅ **Bell icon should update** with unread count

✅ **Notification center should show history**

---

**Last Updated:** 2025-01-18
**Version:** 1.3.0 (With Enhanced Logging)
