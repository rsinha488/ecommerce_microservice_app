# Admin Real-Time Updates - Correct Implementation

## What Admin Does (NOT create orders!)

Admin can only:
- ✅ **View** all orders from all users
- ✅ **Update** order status (pending → processing → shipped → delivered)
- ✅ **Receive notifications** when users create orders
- ✅ **See real-time updates** when users cancel orders

## Fix for admin/orders/page.tsx

### 1. Remove the broken code (lines 64-65):

**REMOVE THESE LINES:**
```typescript
addItem,
updateItem,
```

**KEEP ONLY:**
```typescript
const {
  items: orders,
  loading,
  error: scrollError,
  hasMore,
  setLastElementRef,
  reset,
  refetch,
} = useInfiniteScroll<Order>(fetchOrders, 1, 20);
```

### 2. Add Real-Time Support

**Add these imports at the top:**
```typescript
import { useAppDispatch } from '@/lib/redux/hooks';
import { addOrder, updateOrderStatus as updateOrderStatusRedux } from '@/lib/redux/slices/orderSlice';
import { useWebSocket } from '@/hooks/useWebSocket';
import { socketService } from '@/lib/websocket/socket.service';
```

**Add after line 29 (inside component):**
```typescript
const dispatch = useAppDispatch();
const { isConnected } = useWebSocket();
const [localOrders, setLocalOrders] = useState<Order[]>([]);

// Sync with fetched orders
useEffect(() => {
  setLocalOrders(orders);
}, [orders]);
```

**Add WebSocket listeners (after the redirect useEffect around line 88):**
```typescript
// Real-time updates for admin
useEffect(() => {
  if (!isAuthenticated || !user || !isConnected) return;
  
  const socket = socketService.getSocket();
  if (!socket) return;

  // When USER creates an order → Admin sees it
  const handleNewOrder = (data: any) => {
    console.log('[Admin] New order from user:', data);
    
    const newOrder: Order = {
      _id: data.orderId,
      userId: data.buyerId || data.userId,
      items: data.items || [],
      subtotal: data.subtotal || 0,
      tax: data.tax || 0,
      total: data.total || data.totalAmount || 0,
      status: data.status || 'pending',
      shippingAddress: data.shippingAddress || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };

    // Add to top of list
    setLocalOrders(prev => [newOrder, ...prev]);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      pending: prev.pending + 1,
      totalRevenue: prev.totalRevenue + newOrder.total,
    }));

    // Show notification
    toast.success(`New order #${data.orderId.slice(-8).toUpperCase()} from customer!`, {
      position: 'top-right',
      autoClose: 5000,
    });
  };

  // When USER cancels an order → Admin sees it
  const handleOrderCancelled = (data: any) => {
    console.log('[Admin] User cancelled order:', data);
    
    setLocalOrders(prev =>
      prev.map(order =>
        order._id === data.orderId
          ? { ...order, status: 'cancelled', updatedAt: data.cancelledAt || new Date().toISOString() }
          : order
      )
    );

    // Refresh stats
    fetchStats();

    toast.warning(`Order #${data.orderId.slice(-8).toUpperCase()} was cancelled by customer`);
  };

  socket.on('admin:order:created', handleNewOrder);
  socket.on('admin:order:cancelled', handleOrderCancelled);

  return () => {
    socket.off('admin:order:created');
    socket.off('admin:order:cancelled');
  };
}, [isAuthenticated, user, isConnected]);
```

### 3. Update filteredOrders to use localOrders

**Change line ~91:**
```typescript
const filteredOrders = useMemo(() => {
  let filtered = localOrders; // Changed from: orders
  
  if (statusFilter !== 'all') {
    filtered = filtered.filter((order) => order.status === statusFilter);
  }

  if (searchTerm) {
    filtered = filtered.filter(
      (order) =>
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return filtered;
}, [localOrders, statusFilter, searchTerm]); // Changed dependency
```

### 4. Update handleUpdateStatus to update local state

**Replace the function around line 126:**
```typescript
const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
  try {
    setUpdatingStatus(orderId);
    await orderApi.updateOrderStatus(orderId, newStatus);
    toast.success(`Order status updated to ${newStatus}`);

    // Update local state immediately (optimistic update)
    setLocalOrders(prev =>
      prev.map(order =>
        order._id === orderId
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
          : order
      )
    );

    if (selectedOrder?._id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    // Refresh stats
    fetchStats();
  } catch (err: any) {
    console.error('Error updating status:', err);
    toast.error(err.message || 'Failed to update order status');
    
    // Revert on error
    refetch();
  } finally {
    setUpdatingStatus(null);
  }
};
```

### 5. Add connection indicator to header

**Replace header section around line 193:**
```typescript
<div className="mb-8">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
      <p className="text-gray-600">Manage and track all customer orders</p>
    </div>
    {/* Real-time connection status */}
    <div className="flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`}
        title={isConnected ? 'Real-time updates active' : 'Disconnected'}
      />
      <span className="text-sm text-gray-600">
        {isConnected ? 'Live Updates' : 'Offline'}
      </span>
    </div>
  </div>
</div>
```

### 6. Update all references to 'orders' in JSX to 'localOrders'

Find and replace in the JSX section:
- Line ~302: `{filteredOrders.length === 0` (already using filteredOrders, good!)
- Line ~388: `{hasMore && !loading && localOrders.length > 0 &&`
- Line ~395: `{loading && localOrders.length > 0 &&`
- Line ~403: `{!hasMore && localOrders.length > 0 && !loading &&`

## Summary

Admin CANNOT create orders. Admin can only:
1. **View** orders (fetched from API on page load)
2. **Update status** when they change the dropdown
3. **Receive real-time notifications** when:
   - Users create new orders → shows at top of list
   - Users cancel orders → status updates automatically

The user orders page ALREADY works with real-time updates when admin changes status!

