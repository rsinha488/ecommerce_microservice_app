# Testing Real-Time Order Updates on User Dashboard

## Quick Start Guide

This guide will help you verify that real-time order status updates are working correctly on the user dashboard.

---

## Prerequisites

Make sure the following services are running:

### 1. Infrastructure Services
```bash
# Start Kafka, Zookeeper, MongoDB, etc.
docker-compose up -d
```

### 2. Realtime Service
```bash
cd services/realtime
pnpm run dev
```

**Expected Output:**
```
[NestFactory] Starting Nest application...
🔄 Initializing order event handlers...
✅ Order event handlers registered (order.created, order.updated, order.processing, order.shipped, order.paid, order.delivered, order.cancelled)
[RealtimeGateway] WebSocket server initialized on port 3009
```

**✅ Verify:** You should see **ALL 7 topics** listed in the registration message.

### 3. Order Service
```bash
cd services/order
pnpm run dev
```

### 4. Client (Frontend)
```bash
cd client
npm run dev
```

---

## Test Setup

### Browser 1: User Dashboard (Main Test Browser)

1. **Open:** http://localhost:3000
2. **Login as User:**
   - Email: `test@example.com` (or any user account)
   - Password: Your password

3. **Navigate to Orders Page:**
   - Click "Orders" in navigation
   - Or go directly to: http://localhost:3000/orders

4. **Open Developer Console:**
   - Press `F12` (or Right-click → Inspect)
   - Go to "Console" tab
   - Keep this open during testing

5. **Verify WebSocket Connection:**
   - Look for green indicator in bottom-right corner
   - Console should show: `✅ [WEBSOCKET] Connected to realtime service`

### Browser 2: Admin Dashboard (Incognito/Private Window)

1. **Open Incognito Window:**
   - Chrome: `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac)
   - Firefox: `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)

2. **Open:** http://localhost:3000/admin

3. **Login as Admin:**
   - Email: Your admin account
   - Password: Your admin password

4. **Navigate to Orders:**
   - Go to: http://localhost:3000/admin/orders

---

## Test Cases

### Test 1: Pending → Processing

**Goal:** Verify user sees real-time update when order changes to "Processing"

**Steps:**

1. **Admin Browser:**
   - Find an order with status "Pending"
   - Click on the status dropdown
   - Select "Processing"
   - Click "Update Status"

2. **User Browser - Expected Behavior:**

   **Within 1 second:**

   a) **Console Output:**
   ```
   🔔 [USER] Order updated event received: { orderId: "...", status: "processing", ... }
   📦 Order abc123 status changed to: processing (uppercase: PROCESSING)
   🔵 Toast type: INFO (processing)
   🔄 [ORDERS PAGE] Real-time status updates detected for orders: ['abc123']
   ```

   b) **Visual Changes:**
   - 🔵 Blue toast appears: "Your order #abc123 is now processing"
   - 📦 Order card gets blue ring around it
   - 🎨 Status badge changes from yellow "Pending" to blue "Processing"
   - 📏 Card scales up slightly (1.02x)
   - 🔔 Notification bell shows red badge

   **After 3 seconds:**
   - Blue ring fades out
   - Card returns to normal size
   - Status badge stays blue "Processing"

**✅ Test Passes If:**
- Console logs appear
- Toast notification shows
- Status badge updates
- Highlight animation visible

---

### Test 2: Processing → Shipped

**Steps:**

1. **Admin:** Change status from "Processing" to "Shipped"

2. **User Browser - Expected:**
   - 🔵 Blue toast: "Your order #abc123 is now shipped"
   - Status badge: Blue → Purple "Shipped"
   - Highlight animation for 3 seconds
   - Console logs show update

**✅ Test Passes If:** All visual updates occur within 1 second

---

### Test 3: Shipped → Paid

**Steps:**

1. **Admin:** Change status from "Shipped" to "Paid"

2. **User Browser - Expected:**
   - 🟢 Green success toast: "Your order #abc123 is now paid"
   - Status badge: Purple → Green "Paid"
   - Highlight animation for 3 seconds

**✅ Test Passes If:** Green success toast appears (not blue)

---

### Test 4: Paid → Delivered

**Steps:**

1. **Admin:** Change status from "Paid" to "Delivered"

2. **User Browser - Expected:**
   - 🟢 Green success toast: "Your order #abc123 is now delivered"
   - Status badge: Green "Paid" → Green "Delivered"
   - Highlight animation

**✅ Test Passes If:** Final status shows "Delivered" with green badge

---

### Test 5: Any Status → Cancelled

**Steps:**

1. **Admin:** Change any order to "Cancelled"

2. **User Browser - Expected:**
   - 🟡 Yellow warning toast: "Your order #abc123 is now cancelled"
   - Status badge: Any color → Red "Cancelled"
   - Highlight animation

**✅ Test Passes If:** Warning toast (not info/success) and red badge

---

## Advanced Tests

### Test 6: Multi-Tab Support

**Goal:** Verify updates work across multiple tabs

**Steps:**

1. **User Browser - Tab 1:** Stay on Orders page
2. **User Browser - Tab 2:** Open new tab → Go to Products page
3. **User Browser - Tab 3:** Open new tab → Stay on Homepage

4. **Admin:** Change any order status

**Expected Result:**
- **Tab 1 (Orders):** ✅ List updates + highlight + toast
- **Tab 2 (Products):** ✅ Toast appears
- **Tab 3 (Homepage):** ✅ Toast appears
- **All tabs:** 🔔 Bell badge updates

**✅ Test Passes If:** All tabs receive notification

---

### Test 7: User on Different Page

**Goal:** Verify user doesn't need to be on Orders page

**Steps:**

1. **User Browser:** Navigate to Products page (http://localhost:3000/products)
2. **Keep Console Open**
3. **Admin:** Change order status

**Expected Result:**
- Console shows: `🔔 [USER] Order updated event received`
- Toast appears on Products page
- Bell badge updates

**Then:**
1. **User:** Navigate back to Orders page
2. **Check:** Order status should already be updated (no refresh needed)

**✅ Test Passes If:** Status already updated when returning to Orders page

---

### Test 8: Rapid Status Changes

**Goal:** Test multiple rapid updates

**Steps:**

1. **Admin:** Quickly change order status:
   - Pending → Processing (wait 2 seconds)
   - Processing → Shipped (wait 2 seconds)
   - Shipped → Paid (wait 2 seconds)

2. **User Browser - Expected:**
   - Three separate toasts appear (may stack)
   - Highlight animation resets with each update
   - Final status badge shows "Paid"

**✅ Test Passes If:** All 3 status changes visible, no crashes

---

### Test 9: Multiple Orders

**Goal:** Verify updates work when user has multiple orders

**Setup:**
- User has at least 3 orders

**Steps:**

1. **Admin:** Change status of Order A
2. **Verify:** User sees update for Order A
3. **Admin:** Change status of Order B
4. **Verify:** User sees update for Order B (Order A stays updated)

**✅ Test Passes If:** Each order updates independently

---

## Debugging Failed Tests

### If No Toast Appears

**Check WebSocket Connection:**
```javascript
// In user browser console:
window.__REDUX_STORE__?.getState().auth.websocket
// Should show: { connected: true, socketId: "...", error: undefined }
```

**If `connected: false`:**
1. Check realtime service is running on port 3009
2. Check environment variable: `NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3009`
3. Restart client: `cd client && npm run dev`

---

### If Status Badge Doesn't Update

**Check Redux Store:**
```javascript
// In user browser console:
const orders = window.__REDUX_STORE__?.getState().order.orders;
console.log(orders.find(o => o._id === 'abc123')); // Replace with actual order ID
// Should show updated status
```

**If Redux updated but UI didn't:**
- Refresh the page
- Check for React errors in console

---

### If Console Shows Event But No Visual Update

**Check ToastContainer:**
```javascript
// In user browser console:
document.querySelector('.Toastify')
// Should return: <div class="Toastify">...</div>
```

**If `null`:**
- ToastContainer not mounted
- Check [layout.tsx](../client/app/layout.tsx) includes `<ToastContainer />`

---

### If Only Some Statuses Work

**Check Realtime Service Logs:**

Look for this on startup:
```
✅ Order event handlers registered (order.created, order.updated, order.processing, order.shipped, order.paid, order.delivered, order.cancelled)
```

**If missing topics:**
1. Restart realtime service: `cd services/realtime && pnpm run dev`
2. Verify [order-events.consumer.ts](../services/realtime/src/kafka/order-events.consumer.ts) has all handlers

---

## Expected Service Logs

### Realtime Service (When Admin Changes Status)

```
📦 Order updated event received - OrderID: abc123, Status: processing
✅ Order update notification sent to user user123
```

### Order Service (When Admin Changes Status)

```
Updating order abc123 status from pending to processing
📤 Order processing event emitted for order abc123
```

---

## Success Criteria

**✅ All tests pass if:**

1. **Real-Time Updates:** Status changes appear within 1 second (no page refresh)
2. **Toast Notifications:** Correct toast color and message for each status
3. **Status Badges:** Badge color and text update automatically
4. **Highlight Animation:** Blue ring appears for 3 seconds on updated orders
5. **Bell Badge:** Notification count increases with each update
6. **Console Logs:** All expected logs appear in browser console
7. **Multi-Tab:** Updates work across all tabs of same user
8. **Cross-Page:** Updates work even when user not on Orders page
9. **Persistence:** Status remains updated after navigation

---

## Performance Benchmarks

**Expected Response Times:**

| Action | Expected Time | Acceptable Range |
|--------|--------------|------------------|
| Admin changes status → User sees toast | < 500ms | < 1000ms |
| WebSocket event → Redux update | < 50ms | < 100ms |
| Redux update → UI re-render | < 50ms | < 100ms |
| Highlight animation start → end | 3000ms | Exactly 3000ms |
| Total end-to-end (Admin click → User sees) | < 1000ms | < 2000ms |

---

## Common Issues

### Issue: "Highlight animation doesn't disappear"

**Cause:** `setTimeout` cleanup issue

**Solution:** Navigate away and back, or refresh page

---

### Issue: "Toast appears but order list doesn't update"

**Cause:** Redux not connected properly

**Solution:**
1. Check console for errors
2. Verify `useAppSelector` is reading `state.order.orders`
3. Refresh page

---

### Issue: "Updates work but delay is 5+ seconds"

**Cause:** Network or Kafka lag

**Solution:**
1. Check Kafka is running: `docker ps | grep kafka`
2. Check realtime service logs for delays
3. Check network latency between services

---

## Cleanup After Testing

1. **Stop Services:**
   ```bash
   # Stop realtime service (Ctrl+C)
   # Stop order service (Ctrl+C)
   # Stop client (Ctrl+C)
   ```

2. **Stop Infrastructure:**
   ```bash
   docker-compose down
   ```

3. **Close Browsers**

---

## Next Steps

**If all tests pass:**
- ✅ Real-time order updates are working correctly
- ✅ System is production-ready for this feature

**If tests fail:**
- Review [DEBUG_REALTIME_NOTIFICATIONS.md](./DEBUG_REALTIME_NOTIFICATIONS.md)
- Check [REALTIME_ORDER_UPDATES.md](./REALTIME_ORDER_UPDATES.md) for architecture details
- Review service logs for errors

---

**Last Updated:** 2025-01-18
**Version:** 1.0.0
**Status:** ✅ Complete Testing Guide
