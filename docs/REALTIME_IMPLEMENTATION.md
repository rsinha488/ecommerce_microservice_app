# Real-Time Order Updates Implementation Guide

## System Architecture

Your system already has:
- **Realtime Service** (port 3009): WebSocket server with Socket.IO
- **Order Service**: Emits Kafka events for order lifecycle
- **Client**: WebSocket hook that connects and listens

## Current Flow

### Order Created:
1. User creates order → Order Service
2. Order Service emits `order.created` to Kafka  
3. Realtime Service consumes event
4. Realtime Service emits:
   - `order:created` to user (room: `user:{userId}`)
   - `admin:order:created` to admin (room: `admin:dashboard`)

### Order Status Updated:
1. Admin updates status → Order Service
2. Order Service emits `order.updated` to Kafka
3. Realtime Service consumes event
4. Realtime Service emits:
   - `order:updated` to user
   - `admin:order:updated` to admin

### Order Cancelled:
1. User cancels → Order Service  
2. Order Service emits `order.cancelled` to Kafka
3. Realtime Service emits:
   - `order:cancelled` to user
   - `admin:order:cancelled` to admin

## Implementation Steps

### Step 1: Update Admin Orders Page

Add WebSocket listeners to `/client/app/admin/orders/page.tsx`:

```typescript
// Add to imports
import { socketService } from '@/lib/websocket/socket.service';
import { addOrder, updateOrderStatus as updateOrderStatusRedux } from '@/lib/redux/slices/orderSlice';
import { useAppDispatch } from '@/lib/redux/hooks';

// Inside component
const dispatch = useAppDispatch();
const { isConnected } = useWebSocket();
const [localOrders, setLocalOrders] = useState<Order[]>([]);

// Sync with fetched orders
useEffect(() => {
  setLocalOrders(orders);
}, [orders]);

// Listen to WebSocket events
useEffect(() => {
  if (!isAuthenticated || !user || !isConnected) return;

  const socket = socketService.getSocket();
  if (!socket) return;

  // New order from user
  const handleAdminOrderCreated = (data: any) => {
    const newOrder: Order = {
      _id: data.orderId,
      userId: data.buyerId,
      items: data.items || [],
      subtotal: data.subtotal || 0,
      tax: data.tax || 0,
      total: data.total || 0,
      status: data.status || 'pending',
      shippingAddress: data.shippingAddress,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    // Add to top of list
    setLocalOrders(prev => [newOrder, ...prev]);
    dispatch(addOrder(newOrder));

    // Update stats
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      pending: prev.pending + 1,
      totalRevenue: prev.totalRevenue + newOrder.total,
    }));

    toast.success(`New order #${data.orderId.slice(-8).toUpperCase()}!`);
  };

  // User cancelled order
  const handleAdminOrderCancelled = (data: any) => {
    setLocalOrders(prev =>
      prev.map(order =>
        order._id === data.orderId
          ? { ...order, status: 'cancelled', updatedAt: data.cancelledAt }
          : order
      )
    );

    dispatch(updateOrderStatusRedux({
      orderId: data.orderId,
      status: 'cancelled',
      updatedAt: data.cancelledAt,
    }));

    fetchStats(); // Refresh stats
    toast.warning(`Order #${data.orderId.slice(-8).toUpperCase()} cancelled`);
  };

  socket.on('admin:order:created', handleAdminOrderCreated);
  socket.on('admin:order:cancelled', handleAdminOrderCancelled);

  return () => {
    socket.off('admin:order:created');
    socket.off('admin:order:cancelled');
  };
}, [isAuthenticated, user, isConnected, dispatch]);

// Use localOrders instead of orders in filteredOrders
const filteredOrders = useMemo(() => {
  let filtered = localOrders; // Changed from 'orders'
  // ... rest of filter logic
}, [localOrders, statusFilter, searchTerm]);
```

### Step 2: Update User Orders Page

The user page already has WebSocket implemented correctly at [client/app/orders/page.tsx](client/app/orders/page.tsx#L23). It:
- Uses `useWebSocket()` hook
- Updates Redux when order status changes
- Shows toasts for notifications

### Step 3: Ensure Services are Running

Make sure these services are running:

```bash
# Terminal 1: Realtime service
cd services/realtime
npm run start:dev

# Terminal 2: Order service  
cd services/order
npm run start:dev

# Terminal 3: Gateway
cd services/gateway
npm run start:dev

# Terminal 4: Client
cd client
npm run dev
```

### Step 4: Test the Flow

1. **Test Order Creation:**
   - User creates order
   - Admin dashboard shows new order immediately
   - No refresh needed

2. **Test Status Update:**
   - Admin changes status to "processing"
   - User sees update in real-time
   - Toast notification appears

3. **Test Cancellation:**
   - User cancels order
   - Admin sees status change to "cancelled"
   - Stats update automatically

## WebSocket Events Reference

### Client → Server:
- `subscribe:orders` - Subscribe to order updates
- `subscribe:admin` - Subscribe to admin events (admin only)

### Server → Client (User):
- `order:created` - Order created confirmation
- `order:updated` - Order status changed
- `order:cancelled` - Order cancelled

### Server → Client (Admin):
- `admin:order:created` - New order from any user
- `admin:order:updated` - Order status changed
- `admin:order:cancelled` - Order cancelled by user

## Troubleshooting

### WebSocket not connecting:
- Check realtime service is running on port 3009
- Verify `NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3009` in client `.env`

### Events not received:
- Check browser console for WebSocket errors
- Verify user is authenticated
- For admin, ensure `role === 'admin'` or email contains 'admin'

### Orders not updating:
- Check Redux DevTools to see if actions are dispatched
- Verify Kafka is running and services can connect
- Check realtime service logs for Kafka consumer status

## Environment Variables

### Client (.env.local):
```
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3009
```

### Realtime Service:
```
KAFKA_BROKER=localhost:9092
REALTIME_PORT=3009
CORS_ORIGIN=http://localhost:3000
```

