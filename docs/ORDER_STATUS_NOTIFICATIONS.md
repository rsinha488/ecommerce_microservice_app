# Order Status Notifications Reference

## Overview

Users now receive **toast notifications for EVERY order status change** made by admins, regardless of which page they're on.

---

## Status Change Behavior

### All Status Changes Show Notifications

The system now shows toast notifications for **all** status transitions:

| Status | Toast Type | Color | Example Message |
|--------|-----------|-------|-----------------|
| **PENDING** | Info | Blue | "Your order #ABC123 is now pending" |
| **CONFIRMED** | Info | Blue | "Your order #ABC123 is now confirmed" |
| **PROCESSING** | Info | Blue | "Your order #ABC123 is now processing" |
| **SHIPPED** | Info | Blue | "Your order #ABC123 is now shipped" |
| **DELIVERED** | Success | Green | "Your order #ABC123 is now delivered" |
| **CANCELLED** | Warning | Yellow | "Your order #ABC123 is now cancelled" |

---

## User Experience Flow

### Scenario: Admin Changes Order Status

**Setup:**
- User is logged in and browsing products page
- Admin is logged in on admin dashboard

**Steps:**
1. Admin goes to Orders → Selects an order
2. Admin changes status from "PENDING" → "PROCESSING"
3. **User side (on any page):**
   - ✅ Toast notification appears: "Your order #ABC123 is now processing"
   - ✅ Bell icon badge increments
   - ✅ Notification added to notification center

4. Admin changes status again: "PROCESSING" → "SHIPPED"
5. **User side:**
   - ✅ Toast notification appears: "Your order #ABC123 is now shipped"
   - ✅ Bell icon badge increments
   - ✅ Another notification in center

6. Admin changes status: "SHIPPED" → "DELIVERED"
7. **User side:**
   - ✅ **Green success toast**: "Your order #ABC123 is now delivered"
   - ✅ Bell icon badge increments
   - ✅ Another notification in center

**Result:** User sees ALL status changes in real-time with visual feedback!

---

## Technical Implementation

### Event Handler: `handleOrderUpdated`

**Location:** [WebSocketProvider.tsx:65-116](../client/components/WebSocketProvider.tsx#L65-L116)

**Logic:**
```typescript
const handleOrderUpdated = useCallback((data: any) => {
  const status = data.status || 'UNKNOWN';
  const statusUpper = status.toUpperCase();

  // Update Redux state
  dispatch(updateOrderStatus({
    orderId: data.orderId,
    status: status,
    updatedAt: data.updatedAt || new Date().toISOString(),
  }));

  // Determine toast type based on status
  let toastType: 'success' | 'info' | 'warning' = 'info';

  if (statusUpper === 'CANCELLED') {
    toastType = 'warning';      // Yellow warning toast
  } else if (statusUpper === 'DELIVERED') {
    toastType = 'success';      // Green success toast
  } else {
    toastType = 'info';         // Blue info toast (ALL other statuses)
  }

  const message = data.message || `Your order #${data.orderId} is now ${status}`;

  // Add to notification center
  dispatch(addNotification({
    type: 'order',
    severity: toastType === 'warning' ? 'warning' : toastType === 'success' ? 'success' : 'info',
    title: 'Order Status Updated',
    message,
    data,
  }));

  // ALWAYS show toast for EVERY status change
  switch (toastType) {
    case 'success':
      toast.success(message);   // Green toast
      break;
    case 'warning':
      toast.warning(message);   // Yellow toast
      break;
    default:
      toast.info(message);      // Blue toast (PENDING, PROCESSING, CONFIRMED, SHIPPED, etc.)
  }
}, [dispatch]);
```

**Key Points:**
- ✅ **No status is excluded** - All changes trigger a toast
- ✅ **Different colors** for different importance levels
- ✅ **Notification center** always updated
- ✅ **Redux state** always updated

---

## Testing Each Status

### Test Case 1: PENDING Status Change

**Steps:**
1. Login as user (Browser 1)
2. Login as admin (Browser 2 - Incognito)
3. Admin: Go to Orders → Change order to "PENDING"

**User Should See:**
- ✅ Blue info toast: "Your order #ABC123 is now pending"
- ✅ Bell badge count increases
- ✅ Notification in center

### Test Case 2: CONFIRMED Status Change

**Steps:**
1. Admin changes order to "CONFIRMED"

**User Should See:**
- ✅ Blue info toast: "Your order #ABC123 is now confirmed"
- ✅ Bell badge count increases
- ✅ Notification in center

### Test Case 3: PROCESSING Status Change

**Steps:**
1. Admin changes order to "PROCESSING"

**User Should See:**
- ✅ Blue info toast: "Your order #ABC123 is now processing"
- ✅ Bell badge count increases
- ✅ Notification in center

### Test Case 4: SHIPPED Status Change

**Steps:**
1. Admin changes order to "SHIPPED"

**User Should See:**
- ✅ Blue info toast: "Your order #ABC123 is now shipped"
- ✅ Bell badge count increases
- ✅ Notification in center

### Test Case 5: DELIVERED Status Change

**Steps:**
1. Admin changes order to "DELIVERED"

**User Should See:**
- ✅ **Green success toast**: "Your order #ABC123 is now delivered"
- ✅ Bell badge count increases
- ✅ Notification in center

### Test Case 6: CANCELLED Status Change

**Steps:**
1. Admin changes order to "CANCELLED"

**User Should See:**
- ✅ **Yellow warning toast**: "Your order #ABC123 is now cancelled"
- ✅ Bell badge count increases
- ✅ Notification in center

---

## Status Transition Examples

### Complete Order Lifecycle

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
   ↓         ↓            ↓           ↓          ↓
 (Blue)    (Blue)       (Blue)      (Blue)    (Green)
  Info      Info         Info        Info     Success
```

### Cancelled Order

```
PENDING → CONFIRMED → CANCELLED
   ↓         ↓            ↓
 (Blue)    (Blue)      (Yellow)
  Info      Info       Warning
```

---

## Notification Center Display

**After multiple status changes, notification center shows:**

```
┌─────────────────────────────────────────┐
│ Notifications               [Clear all] │
├─────────────────────────────────────────┤
│ ✓ Order Status Updated      5m ago     │
│   Your order #ABC123 is now delivered   │
│                                  [Remove]│
├─────────────────────────────────────────┤
│ ℹ Order Status Updated      15m ago    │
│   Your order #ABC123 is now shipped     │
│                                  [Remove]│
├─────────────────────────────────────────┤
│ ℹ Order Status Updated      25m ago    │
│   Your order #ABC123 is now processing  │
│                                  [Remove]│
├─────────────────────────────────────────┤
│ ℹ Order Status Updated      35m ago    │
│   Your order #ABC123 is now pending     │
│                                  [Remove]│
└─────────────────────────────────────────┘
```

---

## Backend Payload

### Order Updated Event

**Event:** `order:updated` (user) / `admin:order:updated` (admin)

**Payload Structure:**
```typescript
{
  orderId: "abc123...",
  status: "processing",           // Can be any status
  previousStatus: "pending",
  updatedAt: "2025-01-18T...",
  message: "Your order is being processed",  // Optional custom message
  timestamp: "2025-01-18T..."
}
```

---

## Debugging Status Changes

### Check if Event is Received

**Browser Console:**
```javascript
// This will log when order is updated
// Look for: "Order updated: { orderId: '...', status: '...', ... }"
```

### Manually Trigger Status Change Notification

**Browser Console:**
```javascript
const store = window.__REDUX_STORE__;

store.dispatch({
  type: 'notifications/addNotification',
  payload: {
    type: 'order',
    severity: 'info',
    title: 'Order Status Updated',
    message: 'Your order #TEST123 is now pending'
  }
});

// Should show blue info toast
```

### Check All Notifications

**Browser Console:**
```javascript
const notifications = window.__REDUX_STORE__?.getState().notifications.items;
console.table(notifications);
```

---

## Common Issues

### Issue 1: "Only seeing notifications for DELIVERED/CANCELLED"

**This was the old behavior (before fix)**

**Fixed:** Now ALL statuses show notifications (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)

### Issue 2: "Toast not showing for PENDING status"

**Check:**
1. WebSocket is connected (green indicator)
2. Console shows: `Order updated: { orderId: '...', status: 'pending', ... }`
3. No JavaScript errors in console

**Debug:**
```javascript
// Check if event handler is registered
window.__REDUX_STORE__?.getState().auth.websocket.connected
// Should be: true
```

### Issue 3: "Status changes not appearing on Orders page"

**This is separate from notifications!**

Notifications show on ALL pages, but the Orders page might not auto-refresh.

**Solution:** The Redux state is updated, so the Orders page should reflect the change when you navigate to it.

---

## Summary

✅ **Before Fix:** Only SHIPPED, DELIVERED, CANCELLED showed toasts
✅ **After Fix:** ALL status changes show toasts (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)

✅ **Toast Types:**
- **Green (Success):** DELIVERED
- **Yellow (Warning):** CANCELLED
- **Blue (Info):** PENDING, CONFIRMED, PROCESSING, SHIPPED, and any other status

✅ **User Experience:**
- User gets notified on **every single status change**
- Notifications work on **all pages** (not just orders page)
- Notification history saved in notification center
- Bell badge shows unread count

---

**Last Updated:** 2025-01-18
**Version:** 1.2.0
**Status:** ✅ All Status Changes Now Show Notifications
