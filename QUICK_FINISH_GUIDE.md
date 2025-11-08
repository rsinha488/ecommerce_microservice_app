# Quick Finish Guide - Remaining Services

## Services Already Built ✅
1. **Order Service** - ✅ Built and ready
2. **Product Service** - ✅ Built and ready (import issues fixed)

## Services Ready to Build (Just need @nestjs/cli)

### Inventory Service
```powershell
cd services/inventory
npm install --save-dev @nestjs/cli
npm run build
```

### Auth Service
```powershell
cd services/auth
npm install --save-dev @nestjs/cli
npm run build
```

### User Service
```powershell
cd services/user
npm install --save-dev @nestjs/cli
npm run build
```

## To Start All Services (After Installing Docker)

### Step 1: Start Infrastructure
```powershell
cd services/inventory
docker-compose up -d
```

This starts:
- MongoDB (localhost:27017)
- Redis (localhost:6379)
- Kafka (localhost:9092)
- Zookeeper (localhost:2181)
- Kafka UI (localhost:8080)

### Step 2: Start Services in Separate Terminals

**Terminal 1 - Order Service:**
```powershell
cd services/order
$env:MONGO_URI="mongodb://localhost:27017/order-service"
$env:PORT="5003"
npm run start:dev
```

**Terminal 2 - Product Service:**
```powershell
cd services/product
$env:MONGO_URI="mongodb://localhost:27017/product-service"
$env:PORT="3002"
$env:KAFKA_BROKERS="localhost:9092"
npm run start:dev
```

**Terminal 3 - Inventory Service:**
```powershell
cd services/inventory
$env:MONGO_URI="mongodb://localhost:27017/inventory-service"
$env:PORT="3003"
$env:KAFKA_BROKER="localhost:9092"
$env:REDIS_HOST="localhost"
npm run start:dev
```

**Terminal 4 - Auth Service:**
```powershell
cd services/auth
$env:MONGO_URI="mongodb://localhost:27017/auth-service"
$env:AUTH_PORT="4000"
$env:REDIS_HOST="localhost"
$env:JWT_ISS="http://localhost:4000"
npm run start:dev
```

**Terminal 5 - User Service:**
```powershell
cd services/user
$env:MONGO_URI="mongodb://localhost:27017/user-service"
$env:PORT="3001"
$env:REDIS_HOST="localhost"
npm run start:dev
```

## Access Points

Once all services are running:

- **Order API Docs**: http://localhost:5003/docs
- **Product API Docs**: http://localhost:3002/api
- **Inventory API Docs**: http://localhost:3003/api
- **Auth OIDC Config**: http://localhost:4000/.well-known/openid-configuration
- **User API**: http://localhost:3001/users
- **Kafka UI**: http://localhost:8080

## Testing Event Flow

1. **Create a Product** (Product Service):
```bash
curl -X POST http://localhost:3002/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "sku": "TEST-001",
    "description": "Test",
    "price": 100,
    "stock": 50,
    "category": "test",
    "images": []
  }'
```

2. **Create Inventory Item** (Inventory Service):
```bash
curl -X POST http://localhost:3003/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "TEST-001",
    "stock": 50,
    "reserved": 0
  }'
```

3. **Create Order** (Order Service):
```bash
curl -X POST http://localhost:5003/orders \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "user-123",
    "currency": "USD",
    "items": [
      {
        "sku": "TEST-001",
        "name": "Test Product",
        "quantity": 2,
        "unitPrice": 100
      }
    ]
  }'
```

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure Docker is running and MongoDB container is up:
```powershell
docker ps | findstr mongo
```

### Kafka Connection Error
```
Error: KafkaJSConnectionError
```
**Solution**: Check Kafka is running:
```powershell
docker ps | findstr kafka
```

### Redis Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution**: Check Redis is running:
```powershell
docker ps | findstr redis
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5003
```
**Solution**: Kill the process using the port or use a different port:
```powershell
# Find process
netstat -ano | findstr :5003
# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

## Code Issues Fixed

✅ **Product Service Import Paths** - Fixed 4 files with incorrect `src/` imports
✅ **Product Service Config** - Made environment variables optional with defaults
✅ **Order Service** - Built successfully
✅ **All Services** - Dependencies installed for Order, Product, Inventory, Auth, User

## What's Missing

❌ **Cart Service** - Only package.json exists, no implementation
❌ **Payment Service** - Only package.json exists, no implementation
❌ **WebSocket Service** - Code exists but is commented out

## Next Development Tasks

1. Implement Cart Service functionality
2. Implement Payment Service functionality
3. Uncomment and configure WebSocket Service
4. Add comprehensive tests
5. Add API Gateway (consider using Kong, Ambassador, or NestJS Gateway)
6. Add service discovery (Consul, Eureka)
7. Add distributed tracing (Jaeger, Zipkin)
8. Add monitoring (Prometheus + Grafana)

