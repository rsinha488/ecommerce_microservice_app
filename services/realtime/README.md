# Real-Time WebSocket Service 🔌

Professional real-time notification service for the e-commerce platform. Provides WebSocket-based live updates for orders, inventory, and user notifications.

## Features

### Core Functionality
- **WebSocket Server** - Socket.IO implementation with auto-reconnection
- **Event-Driven Architecture** - Kafka consumer for order and inventory events
- **User-Specific Channels** - Private rooms for personalized notifications
- **Admin Dashboard** - Real-time updates for administrators
- **Connection Management** - Track multiple devices per user
- **Health Checks** - Kubernetes/Docker compatible health endpoints

### Real-Time Events

#### Order Events
- `order:created` - New order placed
- `order:updated` - Order status changed
- `order:cancelled` - Order cancelled

#### Inventory Events
- `inventory:updated` - Stock levels changed
- `product:created` - New product added
- `product:updated` - Product details modified

#### User Events
- `notification` - Generic user notification

#### Admin Events
- `admin:order:created` - New order (admin view)
- `admin:order:updated` - Order status change (admin view)
- `admin:inventory:updated` - Inventory change (admin view)
- `admin:alert` - System alerts

## Architecture

```
┌─────────────────┐
│  Kafka Topics   │
│  - order.*      │
│  - inventory.*  │
│  - product.*    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Kafka Consumer Service        │
│   - OrderEventsConsumer          │
│   - InventoryEventsConsumer      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   WebSocket Gateway (Socket.IO)  │
│   - Connection Management        │
│   - Room/Channel System          │
│   - Event Broadcasting           │
└────────┬────────────────────────┘
         │
         ▼
    ┌────┴────┐
    │ Clients  │
    │ - Web    │
    │ - Mobile │
    └──────────┘
```

## API Documentation

### Swagger/OpenAPI
Access interactive API documentation at: `http://localhost:3009/api/docs`

### REST Endpoints

#### GET /health
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "service": "realtime-service",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345
}
```

#### GET /realtime/stats
Get WebSocket connection statistics.

**Response:**
```json
{
  "totalConnections": 42,
  "uniqueUsers": 35,
  "userConnections": [
    { "userId": "user-123", "connectionCount": 2 }
  ]
}
```

#### POST /realtime/broadcast/order
Manually trigger an order update broadcast.

**Request:**
```json
{
  "userId": "user-123",
  "orderId": "order-456",
  "status": "shipped",
  "previousStatus": "processing"
}
```

#### POST /realtime/broadcast/inventory
Manually trigger an inventory update broadcast.

**Request:**
```json
{
  "productId": "prod-789",
  "stock": 5,
  "previousStock": 10,
  "sku": "SKU-001",
  "productName": "Premium Headphones"
}
```

## WebSocket Client Usage

### Frontend (React/Next.js)

```typescript
import { io, Socket } from 'socket.io-client';

// Initialize connection
const socket: Socket = io('http://localhost:3009', {
  query: {
    userId: 'user-123',          // Required
    token: 'auth-token-here'     // Optional (for future auth)
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to real-time service');
});

socket.on('connection:success', (data) => {
  console.log('Connection confirmed:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected from real-time service');
});

// Subscribe to order updates
socket.emit('subscribe:orders', { userId: 'user-123' });

// Listen for order events
socket.on('order:created', (data) => {
  console.log('New order:', data);
  // Update UI
});

socket.on('order:updated', (data) => {
  console.log('Order status changed:', data);
  // Show notification
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log('Notification:', data);
  // Show toast/notification
});

// Clean up on unmount
return () => {
  socket.disconnect();
};
```

### Admin Dashboard

```typescript
// Connect as admin
const socket = io('http://localhost:3009', {
  query: {
    userId: 'admin@example.com',
    token: 'admin-token'
  }
});

// Subscribe to admin events
socket.emit('subscribe:admin');

// Listen for admin events
socket.on('admin:order:created', (data) => {
  console.log('New order received:', data);
  // Update admin dashboard
});

socket.on('admin:alert', (data) => {
  console.log('System alert:', data);
  // Show alert banner
});

// Request statistics
socket.emit('request:stats');
socket.on('stats', (data) => {
  console.log('Current stats:', data);
});
```

## Integration with Other Services

### Order Service
When an order status changes, publish to Kafka:

```typescript
// services/order/src/somewhere.ts
await kafkaProducer.send({
  topic: 'order.updated',
  messages: [{
    value: JSON.stringify({
      orderId: order._id,
      buyerId: order.buyerId,
      status: order.status,
      previousStatus: 'processing',
      updatedAt: new Date().toISOString(),
    })
  }]
});
```

### Inventory Service
When stock changes, publish to Kafka:

```typescript
// services/inventory/src/somewhere.ts
await kafkaProducer.send({
  topic: 'inventory.updated',
  messages: [{
    value: JSON.stringify({
      productId: product._id,
      stock: product.stock,
      previousStock: 50,
      sku: product.sku,
      productName: product.name,
    })
  }]
});
```

## Environment Variables

```env
# Service Configuration
NODE_ENV=production
REALTIME_PORT=3009

# CORS
CORS_ORIGIN=*

# Kafka
KAFKA_BROKER=kafka:29092
KAFKA_CONSUMER_GROUP=realtime-service-group

# Authentication
JWT_SECRET=your-secret-key-change-in-production

# WebSocket
WS_PING_INTERVAL=25000
WS_PING_TIMEOUT=20000

# Logging
LOG_LEVEL=log
```

## Development

### Local Development
```bash
# Install dependencies
pnpm install

# Start in development mode (with hot reload)
pnpm run start:dev

# Build for production
pnpm run build

# Start production build
pnpm run start:prod
```

### Docker Development
```bash
# Build Docker image
docker build -t ecom-realtime-service .

# Run container
docker run -p 3009:3009 --env-file .env.production ecom-realtime-service
```

### Full Stack
```bash
# From project root
./start-enhanced.sh
```

## Testing

### Test WebSocket Connection
```bash
# Using curl (won't work for WebSocket, use below instead)

# Using wscat (WebSocket client)
npm install -g wscat
wscat -c "ws://localhost:3009?userId=test-user"
```

### Test via REST API
```bash
# Send test notification
curl -X POST http://localhost:3009/realtime/test/notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "message": "Test notification",
    "title": "Test"
  }'

# Get statistics
curl http://localhost:3009/realtime/stats
```

## Monitoring

### Health Checks
```bash
# Basic health
curl http://localhost:3009/health

# Readiness probe
curl http://localhost:3009/health/ready

# Liveness probe
curl http://localhost:3009/health/live
```

### Metrics
- Total WebSocket connections
- Unique connected users
- Per-user connection count
- Kafka consumer lag (via Kafka UI)

### Kafka UI
Access at `http://localhost:8080` to monitor Kafka topics and consumer groups.

## Production Considerations

### Security
- [ ] Implement JWT token validation
- [ ] Add rate limiting for WebSocket events
- [ ] Implement proper CORS configuration
- [ ] Add authentication middleware
- [ ] Validate user permissions for admin events

### Scalability
- [ ] Use Redis adapter for Socket.IO clustering
- [ ] Implement horizontal pod autoscaling
- [ ] Add connection limits per user
- [ ] Implement backpressure handling
- [ ] Add message queuing for offline users

### Reliability
- [ ] Implement dead letter queue for failed events
- [ ] Add retry logic with exponential backoff
- [ ] Implement circuit breakers
- [ ] Add comprehensive error logging
- [ ] Set up alerting for connection drops

## Troubleshooting

### Connection Issues
```bash
# Check if service is running
docker ps | grep realtime

# Check logs
docker logs ecom-realtime-service

# Check Kafka connectivity
docker logs ecom-realtime-service | grep -i kafka
```

### Event Not Received
1. Verify Kafka topic exists
2. Check consumer group lag in Kafka UI
3. Verify WebSocket connection is established
4. Check user has subscribed to the correct channel
5. Verify event payload format

## License
UNLICENSED - Private

## Author
E-commerce Platform Team

---

**Version:** 1.0.0
**Last Updated:** 2024
**Port:** 3009
**Documentation:** http://localhost:3009/api/docs
