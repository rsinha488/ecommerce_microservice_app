# Quick Start: Real-Time Order Updates

## What You Get

- **Admin Dashboard**: Sees new orders instantly when users create them
- **User Dashboard**: Sees status updates when admin changes order status (pending → processing → shipped → delivered)
- **Cancellation Flow**: Admin sees real-time when user cancels order
- **No Page Refresh**: Everything updates automatically with toast notifications

## Files to Modify

Apply the changes from `admin-realtime-patch.txt` to:
- `client/app/admin/orders/page.tsx`

User page ([client/app/orders/page.tsx](client/app/orders/page.tsx)) already has WebSocket implemented!

## Quick Test

### 1. Start All Services

```bash
# Terminal 1: Kafka (if not running)
docker-compose up -d kafka

# Terminal 2: Order Service
cd services/order && npm run start:dev

# Terminal 3: Realtime Service (IMPORTANT!)
cd services/realtime && npm run start:dev

# Terminal 4: Gateway
cd services/gateway && npm run start:dev

# Terminal 5: Client
cd client && npm run dev
```

### 2. Test Real-Time Flow

**A. Order Creation (User → Admin)**
1. Open browser: `http://localhost:3000` (login as user)
2. Open another tab: `http://localhost:3000/admin/orders` (login as admin)
3. In user tab: Create an order
4. Watch admin tab: New order appears at top **without refresh**!
5. Toast notification: "New order #XXXXX received!"

**B. Status Update (Admin → User)**
1. Keep both tabs open
2. In admin tab: Change order status to "Processing"
3. Watch user tab `/orders`: Status updates **without refresh**!
4. Toast notification: "Order status: processing"

**C. Cancellation (User → Admin)**
1. In user tab: Click "Cancel Order" on a pending order
2. Watch admin tab: Order status changes to "Cancelled" **without refresh**!
3. Stats update automatically

## Verify WebSocket Connection

Open browser console (F12):
- Look for: `[WebSocket] Connected successfully`
- User should see: Connected with role: "user"
- Admin should see: Connected with role: "admin"

## Troubleshooting

### "WebSocket not connecting"
```bash
# Check if realtime service is running
curl http://localhost:3009/health

# Should return 200 OK
```

### "Not receiving events"
1. Check console for errors
2. Verify Kafka is running: `docker ps | grep kafka`
3. Check realtime service logs for Kafka connection

### "Admin not seeing new orders"
- Verify admin user has `role: 'admin'` or email contains 'admin'
- Check browser console for `[Admin] New order received:` logs
- Verify `subscribe:admin` is called (check Network tab → WS)

## Architecture

```
User Creates Order
       ↓
   Order Service → Kafka (order.created)
       ↓
  Realtime Service (consumes Kafka)
       ↓
   WebSocket Emit
       ↓
   ┌─────────────┬──────────────┐
   ↓             ↓              ↓
User (order:created)  Admin (admin:order:created)
   ↓                     ↓
Redux Update         Redux Update
Toast Notify         Toast Notify
```

## Next Steps

- Add sound notifications for new orders
- Add desktop notifications (Web Notifications API)
- Add order count badge on admin nav
- Add real-time order analytics chart

