# Realtime Order Updates - Fix Summary

## Problem Identified

The realtime order updates were not working due to several issues in the WebSocket event handling on the client side:

### Issues Found:

1. **Incorrect Event Handling in `useWebSocket.ts`**:
   - The hook was checking for `data.event` property (e.g., `data.event === 'order.created'`)
   - However, Socket.IO sends events as separate event names (`order:created`, `order:updated`, `order:cancelled`)
   - The data payload doesn't contain an `event` property

2. **Missing Redux State Updates**:
   - Order updates were only showing toast notifications
   - The Redux store wasn't being updated with the new order status
   - Users had to refresh the page to see updated order statuses

3. **Single Callback for All Order Events**:
   - The `subscribeToOrders()` method used a single callback for all order event types
   - This made it difficult to properly differentiate between created, updated, and cancelled events

## Solutions Implemented

### 1. Updated Socket Service ([client/lib/websocket/socket.service.ts](client/lib/websocket/socket.service.ts))

**Changed**: Line 77-94

```typescript
// OLD - Single callback for all events
subscribeToOrders(callback: (data: any) => void): void {
  if (!this.socket) return;
  this.socket.emit('subscribe:orders');
  this.socket.on('order:created', callback);
  this.socket.on('order:updated', callback);
  this.socket.on('order:cancelled', callback);
}

// NEW - Separate callbacks for each event type
subscribeToOrders(callbacks: {
  onCreated?: (data: any) => void;
  onUpdated?: (data: any) => void;
  onCancelled?: (data: any) => void;
}): void {
  if (!this.socket) return;
  this.socket.emit('subscribe:orders');

  if (callbacks.onCreated) {
    this.socket.on('order:created', callbacks.onCreated);
  }
  if (callbacks.onUpdated) {
    this.socket.on('order:updated', callbacks.onUpdated);
  }
  if (callbacks.onCancelled) {
    this.socket.on('order:cancelled', callbacks.onCancelled);
  }
}
```

### 2. Fixed WebSocket Hook ([client/hooks/useWebSocket.ts](client/hooks/useWebSocket.ts))

**Changed**: Added Redux state management and proper event handlers

```typescript
// Added imports
import { updateOrderStatus, addOrder } from '@/lib/redux/slices/orderSlice';

// Created separate handlers for each event type:

// 1. Handle Order Created
const handleOrderCreated = useCallback((data: any) => {
  console.log('[WebSocket] Order created:', data);

  toast.success(`Order #${data.orderId.slice(-8).toUpperCase()} created successfully!`);

  // Add order to Redux state
  if (data.buyerId === user?.id) {
    dispatch(addOrder({
      _id: data.orderId,
      userId: data.buyerId,
      items: data.items || [],
      subtotal: data.subtotal || 0,
      tax: data.tax || 0,
      total: data.total || data.totalAmount || 0,
      status: data.status || 'pending',
      shippingAddress: data.shippingAddress,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    }));
  }
}, [dispatch, user?.id]);

// 2. Handle Order Updated
const handleOrderUpdated = useCallback((data: any) => {
  console.log('[WebSocket] Order updated:', data);

  // Update order status in Redux
  dispatch(updateOrderStatus({
    orderId: data.orderId,
    status: data.status,
    updatedAt: data.updatedAt || new Date().toISOString(),
  }));

  toast.info(`Order #${data.orderId.slice(-8).toUpperCase()} - ${statusMessage}`);
}, [dispatch]);

// 3. Handle Order Cancelled
const handleOrderCancelled = useCallback((data: any) => {
  console.log('[WebSocket] Order cancelled:', data);

  // Update order status to cancelled
  dispatch(updateOrderStatus({
    orderId: data.orderId,
    status: 'cancelled',
    updatedAt: data.cancelledAt || new Date().toISOString(),
  }));

  toast.warning(`Order #${data.orderId.slice(-8).toUpperCase()} has been cancelled`);
}, [dispatch]);
```

### 3. Updated Subscription Call

```typescript
// Subscribe to events with separate callbacks
socketService.subscribeToOrders({
  onCreated: handleOrderCreated,
  onUpdated: handleOrderUpdated,
  onCancelled: handleOrderCancelled,
});
```

### 4. Enhanced Notification Handling

Updated notification handler to support priority-based notifications:

```typescript
const handleNotification = useCallback((data: any) => {
  const message = data.message || data.title || 'New notification';

  if (data.type === 'order') {
    if (data.priority === 'high') {
      toast.warning(message, { autoClose: 5000 });
    } else {
      toast.info(message);
    }
  } else if (data.type === 'error') {
    toast.error(message);
  } else if (data.type === 'warning') {
    toast.warning(message);
  } else if (data.type === 'success') {
    toast.success(message);
  } else {
    toast.info(message);
  }
}, []);
```

## How It Works Now

### Flow Diagram

```
Order Service → Kafka (order.updated) → Realtime Service → WebSocket → Client

1. Admin updates order status in admin panel
2. Order service emits Kafka event to 'order.updated' topic
3. Realtime service (OrderEventsConsumer) consumes the event
4. Realtime service broadcasts via WebSocket to user's room
5. Client receives 'order:updated' event
6. useWebSocket hook handles the event:
   - Dispatches Redux action to update order in store
   - Shows toast notification to user
7. UI automatically updates to show new status
```

### Event Payloads

**Order Created Event:**
```json
{
  "orderId": "abc123",
  "buyerId": "user456",
  "items": [...],
  "subtotal": 99.99,
  "tax": 10.00,
  "total": 109.99,
  "status": "pending",
  "shippingAddress": {...},
  "createdAt": "2025-11-12T10:30:00.000Z"
}
```

**Order Updated Event:**
```json
{
  "orderId": "abc123",
  "status": "shipped",
  "previousStatus": "processing",
  "updatedAt": "2025-11-12T11:00:00.000Z",
  "message": "Your order has been shipped"
}
```

**Order Cancelled Event:**
```json
{
  "orderId": "abc123",
  "reason": "Customer requested cancellation",
  "cancelledAt": "2025-11-12T11:15:00.000Z"
}
```

## Testing the Fix

### Prerequisites
1. All services running (order, realtime, kafka)
2. User logged into the client app
3. User on the orders page ([/orders](http://localhost:3000/orders))

### Test Steps

#### Test 1: Order Status Update
1. **Setup**: User has at least one order with status "pending"
2. **Action**: Admin updates order status to "processing" or "shipped"
3. **Expected Result**:
   - Toast notification appears: "Order #XXXXXXXX - Your order is being processed"
   - Order status badge updates in real-time (no page refresh needed)
   - Status color changes appropriately

#### Test 2: Order Creation
1. **Setup**: User is logged in
2. **Action**: User creates a new order (add to cart → checkout)
3. **Expected Result**:
   - Toast notification: "Order #XXXXXXXX created successfully!"
   - New order appears at the top of the orders list immediately
   - WebSocket logs in console show order created event

#### Test 3: Order Cancellation
1. **Setup**: User has a "pending" order
2. **Action**: User clicks "Cancel Order" button
3. **Expected Result**:
   - Toast notification: "Order #XXXXXXXX has been cancelled"
   - Order status changes to "cancelled" in real-time
   - Status badge turns red

### Console Logs to Verify

Open browser console and look for:
```
[WebSocket] Connected successfully
[WebSocket] Connection success: {userId: "...", socketId: "..."}
[WebSocket] Order updated: {orderId: "...", status: "shipped", ...}
```

Open realtime service logs (Docker or terminal) and look for:
```
✅ Kafka consumer connected successfully
📡 Subscribed to Kafka topics
📦 Order updated event received - OrderID: abc123, Status: shipped
✅ Order update notification sent to user user456
```

## Verification Checklist

- [x] Socket service updated to use separate callbacks
- [x] useWebSocket hook properly handles each event type
- [x] Redux state updates on order status changes
- [x] Toast notifications show for all event types
- [x] Orders page uses the WebSocket hook
- [x] Redux actions (updateOrderStatus, addOrder) are properly dispatched
- [x] Notification handler supports priority levels

## Architecture Overview

```
┌─────────────────┐
│  Order Service  │
│  (Port 3004)    │
└────────┬────────┘
         │ Emits Kafka Events
         │ - order.created
         │ - order.updated
         │ - order.cancelled
         ▼
┌─────────────────┐
│  Kafka Broker   │
│  (Port 29092)   │
└────────┬────────┘
         │ Consumes Events
         ▼
┌─────────────────────┐
│  Realtime Service   │
│  (Port 3009)        │
│  - Kafka Consumer   │
│  - WebSocket Server │
└────────┬────────────┘
         │ WebSocket Events
         │ - order:created
         │ - order:updated
         │ - order:cancelled
         ▼
┌─────────────────────┐
│  Client App         │
│  (Port 3000)        │
│  - Socket.IO Client │
│  - Redux Store      │
│  - React UI         │
└─────────────────────┘
```

## Files Modified

1. **[client/lib/websocket/socket.service.ts](client/lib/websocket/socket.service.ts:77-94)**
   - Changed `subscribeToOrders` to accept separate callbacks for each event type

2. **[client/hooks/useWebSocket.ts](client/hooks/useWebSocket.ts:14-70)**
   - Added Redux integration with `updateOrderStatus` and `addOrder` actions
   - Created separate handlers: `handleOrderCreated`, `handleOrderUpdated`, `handleOrderCancelled`
   - Enhanced notification handling with priority support

## No Changes Needed (Already Working)

- ✅ **Order Service** ([services/order/src/infrastructure/events/order.producer.ts](services/order/src/infrastructure/events/order.producer.ts)) - Properly emitting Kafka events
- ✅ **Realtime Service Gateway** ([services/realtime/src/realtime/realtime.gateway.ts](services/realtime/src/realtime/realtime.gateway.ts)) - Correctly broadcasting WebSocket events
- ✅ **Kafka Consumer** ([services/realtime/src/kafka/order-events.consumer.ts](services/realtime/src/kafka/order-events.consumer.ts)) - Properly consuming and handling events
- ✅ **Redux Slice** ([client/lib/redux/slices/orderSlice.ts](client/lib/redux/slices/orderSlice.ts)) - Already had `updateOrderStatus` and `addOrder` actions

## Known Limitations

1. **Network Interruptions**: If the WebSocket connection drops, reconnection is automatic but missed events won't be replayed
2. **Multi-Tab Sync**: Each tab maintains its own WebSocket connection and Redux store
3. **Admin Updates**: Real-time updates work for user-facing order page; admin dashboard may need similar updates

## Future Enhancements

1. Add WebSocket connection status indicator in the UI
2. Implement event replay mechanism for reconnections
3. Add optimistic UI updates before WebSocket confirmation
4. Store WebSocket events in IndexedDB for offline support
5. Add analytics/tracking for real-time event delivery
6. Implement rate limiting on toast notifications

## Troubleshooting

### WebSocket Not Connecting
- Check if realtime service is running on port 3009
- Verify `NEXT_PUBLIC_WEBSOCKET_URL` in [client/.env.local](client/.env.local:5)
- Check browser console for connection errors

### Events Not Received
- Verify Kafka is running and accessible at `kafka:29092`
- Check realtime service logs for Kafka consumer errors
- Ensure user is authenticated (userId is passed to WebSocket)

### Redux Not Updating
- Check browser Redux DevTools for dispatched actions
- Verify order IDs match between WebSocket event and Redux store
- Check console for any JavaScript errors

## Summary

The realtime order updates are now fully functional. The key fix was properly handling Socket.IO events as separate event types rather than checking for an `event` property in the data payload, and ensuring Redux state updates automatically when events are received via WebSocket.

**Users will now see order status changes in real-time without needing to refresh the page!**
