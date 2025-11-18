# 📊 Sequence Diagrams - Order & Product Flows

## 1. Complete Order Creation Flow

```mermaid
sequenceDiagram
    participant User as 👤 User Browser
    participant Client as Next.js Client
    participant Gateway as API Gateway :3008
    participant Order as Order Service :3003
    participant Kafka as Apache Kafka :9092
    participant Inventory as Inventory Service :3002
    participant Realtime as Realtime Service :3009
    participant Admin as 👨‍💼 Admin Browser

    User->>Client: Click "Place Order"
    Client->>Gateway: POST /api/orders<br/>{items, shippingAddress}
    Gateway->>Order: POST /orders
    
    Order->>Order: Validate Order
    Order->>Order: Save to MongoDB
    
    Order->>Kafka: Publish "order.created"<br/>{orderId, buyerId, items, total}
    
    par Parallel Processing
        Kafka->>Inventory: Consume "order.created"
        Inventory->>Inventory: Deduct Stock
        Inventory->>Kafka: Publish "inventory.updated"
    and
        Kafka->>Realtime: Consume "order.created"
        Realtime->>User: WebSocket: 'order:created'<br/>✅ Order Confirmation
        Realtime->>Admin: WebSocket: 'admin:order:created'<br/>🔔 New Order Alert!
    end
    
    Order->>Gateway: 201 Created {orderId}
    Gateway->>Client: Order Response
    Client->>User: Show Success Toast
```

## 2. Admin Updates Order Status

```mermaid
sequenceDiagram
    participant Admin as 👨‍💼 Admin Browser
    participant Client as Admin Client
    participant Gateway as API Gateway :3008
    participant Order as Order Service :3003
    participant Kafka as Apache Kafka :9092
    participant Realtime as Realtime Service :3009
    participant User as 👤 User Browser

    Admin->>Client: Change Status to "Processing"
    Client->>Gateway: PATCH /api/orders/:id/status<br/>{status: "processing"}
    Gateway->>Order: PATCH /orders/:id/status
    
    Order->>Order: Update MongoDB<br/>status = "processing"
    
    Order->>Kafka: Publish "order.updated"<br/>{orderId, status, previousStatus}
    
    Order->>Gateway: 200 OK
    Gateway->>Client: Status Updated
    Client->>Admin: Update UI (Optimistic)<br/>✅ No Refresh!
    
    Kafka->>Realtime: Consume "order.updated"
    Realtime->>User: WebSocket: 'order:updated'<br/>📦 "Order is processing"
    User->>User: Update Status Badge<br/>✅ No Refresh!
```

## 3. User Cancels Order

```mermaid
sequenceDiagram
    participant User as 👤 User Browser
    participant Client as User Client
    participant Gateway as API Gateway :3008
    participant Order as Order Service :3003
    participant Kafka as Apache Kafka :9092
    participant Inventory as Inventory Service :3002
    participant Realtime as Realtime Service :3009
    participant Admin as 👨‍💼 Admin Browser

    User->>Client: Click "Cancel Order"
    Client->>Gateway: POST /api/orders/:id/cancel
    Gateway->>Order: POST /orders/:id/cancel
    
    Order->>Order: Update status = "cancelled"
    Order->>Order: Save to MongoDB
    
    Order->>Kafka: Publish "order.cancelled"<br/>{orderId, buyerId, cancelledAt}
    
    par Parallel Processing
        Kafka->>Inventory: Consume "order.cancelled"
        Inventory->>Inventory: Restore Stock
        Inventory->>Kafka: Publish "inventory.updated"
    and
        Kafka->>Realtime: Consume "order.cancelled"
        Realtime->>User: WebSocket: 'order:cancelled'<br/>✅ Cancellation Confirmed
        Realtime->>Admin: WebSocket: 'admin:order:cancelled'<br/>⚠️ Order Cancelled Alert
    end
    
    Order->>Gateway: 200 OK
    Gateway->>Client: Cancelled Successfully
    Client->>User: Show Success Toast
    
    Admin->>Admin: Update Order List<br/>✅ No Refresh!
```

## 4. Product Creation & Inventory Flow

```mermaid
sequenceDiagram
    participant Admin as 👨‍💼 Admin Browser
    participant Client as Admin Client
    participant Gateway as API Gateway :3008
    participant Product as Product Service :3001
    participant Kafka as Apache Kafka :9092
    participant Realtime as Realtime Service :3009

    Admin->>Client: Fill Product Form<br/>Submit "Add Product"
    Client->>Gateway: POST /api/products<br/>{name, sku, price, stock}
    Gateway->>Product: POST /products
    
    Product->>Product: Validate Product Data
    Product->>Product: Save to MongoDB
    
    Product->>Kafka: Publish "product.created"<br/>{productId, name, sku, stock}
    
    Product->>Gateway: 201 Created {productId}
    Gateway->>Client: Product Created
    Client->>Admin: Show Success + Redirect
    
    Kafka->>Realtime: Consume "product.created"
    Realtime->>Admin: WebSocket: 'admin:product:created'<br/>✅ Product Added
    Admin->>Admin: Update Product List<br/>✅ No Refresh!
```

## 5. Stock Deduction After Order

```mermaid
sequenceDiagram
    participant Order as Order Service :3003
    participant Kafka as Apache Kafka :9092
    participant Inventory as Inventory Service :3002
    participant Realtime as Realtime Service :3009
    participant User as 👤 User Browser
    participant Admin as 👨‍💼 Admin Browser

    Order->>Kafka: Publish "order.created"<br/>{items: [{productId, qty}]}
    
    Kafka->>Inventory: Consume "order.created"
    
    loop For each item in order
        Inventory->>Inventory: Find Product by productId
        Inventory->>Inventory: Check: stock >= quantity?
        alt Stock Available
            Inventory->>Inventory: stock -= quantity
            Inventory->>Inventory: Update MongoDB
        else Insufficient Stock
            Inventory->>Inventory: Log Error<br/>(Order already created)
        end
    end
    
    Inventory->>Kafka: Publish "inventory.updated"<br/>{productId, stock, previousStock}
    
    Kafka->>Realtime: Consume "inventory.updated"
    
    par Broadcast to All
        Realtime->>User: WebSocket: 'inventory:updated'<br/>📊 Stock Updated
        Realtime->>Admin: WebSocket: 'admin:inventory:updated'<br/>📊 Stock Level Changed
    end
    
    alt Low Stock Alert (stock < 10)
        Realtime->>Admin: WebSocket: 'admin:alert'<br/>⚠️ LOW STOCK WARNING
    end
    
    User->>User: Update Product Page<br/>"Only X left!"
    Admin->>Admin: Update Inventory Dashboard<br/>See Low Stock Alert
```

## 6. WebSocket Connection Flow

```mermaid
sequenceDiagram
    participant Browser as 🌐 Browser
    participant Client as React Client
    participant Realtime as Realtime Service :3009
    participant Kafka as Apache Kafka :9092

    Browser->>Client: Page Load (Login Complete)
    Client->>Client: Get userId & role from Redux
    
    Client->>Realtime: Connect WebSocket<br/>?userId=xxx&role=user
    Realtime->>Realtime: Create Socket Connection
    Realtime->>Realtime: Join room: `user:${userId}`
    
    alt User is Admin
        Realtime->>Realtime: Join room: 'admin:dashboard'
        Realtime->>Client: Emit 'connection:success'<br/>{role: 'admin'}
    else Regular User
        Realtime->>Client: Emit 'connection:success'<br/>{role: 'user'}
    end
    
    Client->>Realtime: Subscribe to events<br/>emit('subscribe:orders')
    
    alt User is Admin
        Client->>Realtime: emit('subscribe:admin')
        Realtime->>Client: {event: 'subscribed', type: 'admin'}
    end
    
    Note over Client,Realtime: Connection Established ✅
    
    loop Real-time Updates
        Kafka->>Realtime: New Event
        Realtime->>Client: WebSocket Emit
        Client->>Browser: Update UI (No Refresh!)
    end
```

## Key Takeaways

### 🔄 Three Communication Patterns

1. **HTTP/REST (Blue arrows)**
   - Request → Response
   - Synchronous
   - Client ↔ Gateway ↔ Services

2. **Kafka Events (Orange arrows)**
   - Publish → Subscribe
   - Asynchronous
   - Service → Service communication
   - Decoupled & scalable

3. **WebSocket (Green arrows)**
   - Bidirectional
   - Real-time push
   - Server → Client updates
   - No polling needed

### ⚡ Real-Time Magic

All updates happen **WITHOUT PAGE REFRESH** because:
1. Services publish events to Kafka
2. Realtime Service consumes events
3. Realtime Service pushes to connected WebSocket clients
4. React updates UI with new data

### 🎯 Why It Works

- **Scalable**: Multiple services can consume same Kafka event
- **Reliable**: Kafka persists events, replay capability
- **Fast**: WebSocket has low latency (<100ms)
- **Decoupled**: Services don't talk directly to each other
- **Real-time**: Users see updates instantly

