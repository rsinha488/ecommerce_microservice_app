# 🚀 Production-Ready E-Commerce Microservices Platform

## Overview

This is a comprehensive, production-ready e-commerce microservices platform built with:
- **Backend**: NestJS, Node.js, TypeScript
- **Frontend**: Next.js 14, React, Redux Toolkit, TailwindCSS
- **Databases**: MongoDB (primary), Redis (caching & sessions)
- **Messaging**: Apache Kafka (event-driven architecture)
- **Real-time**: Socket.IO (WebSocket)
- **Infrastructure**: Docker, Docker Compose

---

## 🏗️ Architecture

### Microservices
1. **Auth Service** (Port 4000) - Authentication, Authorization, OAuth2/OIDC
2. **User Service** (Port 3001) - User profile management
3. **Product Service** (Port 3002) - Product catalog management
4. **Inventory Service** (Port 3003) - Stock management
5. **Order Service** (Port 5003) - Order processing
6. **Gateway Service** (Port 3008) - API Gateway with Redis caching & load balancing
7. **Realtime Service** (Port 3009) - WebSocket server for real-time updates
8. **Client** (Port 3000) - Next.js frontend application

### Infrastructure
- **MongoDB** (Port 27017) - Document database
- **Redis** (Port 6379) - Caching & session store
- **Kafka** (Ports 9092, 29092) - Message broker
- **Zookeeper** (Port 2181) - Kafka coordination
- **Kafka UI** (Port 8080) - Kafka management interface

---

## ✅ Production Features Implemented

### 1. Redis Caching & Load Balancing (Gateway)
- ✅ Smart caching with TTL-based invalidation
- ✅ Cache headers (X-Cache-Status: HIT/MISS)
- ✅ Round-robin load balancing
- ✅ Circuit breaker pattern (5 failures → open, 30s timeout → half-open)
- ✅ Health checks for service instances
- ✅ Automatic instance removal/recovery

**Files Added/Modified**:
- `services/gateway/src/redis/redis.service.ts`
- `services/gateway/src/redis/redis.module.ts`
- `services/gateway/src/cache/cache.interceptor.ts`
- `services/gateway/src/proxy/proxy.service.ts` (complete rewrite)
- `services/gateway/src/health/health.controller.ts` (enhanced)
- `services/gateway/.env.production`

### 2. WebSocket Client Integration
- ✅ Socket.IO client with auto-reconnection
- ✅ React hooks for WebSocket management
- ✅ Real-time order notifications
- ✅ Real-time inventory updates
- ✅ Admin dashboard live updates
- ✅ Toast notifications for all events
- ✅ Connection status indicator

**Files Added**:
- `client/lib/websocket/socket.service.ts`
- `client/hooks/useWebSocket.ts`
- `client/components/NotificationToast.tsx`
- `client/components/WebSocketIndicator.tsx`
- `client/.env.local`
- `client/.env.production`

### 3. Redis Configuration (All Services)
- ✅ Auth Service - Fixed and enhanced
- ✅ User Service - Fixed and enhanced
- ✅ Inventory Service - Fixed and enhanced
- ✅ Support for both REDIS_URL and separate host/port config
- ✅ Retry strategy with exponential backoff
- ✅ Comprehensive logging and error handling

### 4. Kafka Configuration
- ✅ Product Service - Fixed broker configuration
- ✅ Support for environment-based broker URLs
- ✅ Multiple broker support

### 5. Event-Driven Architecture
- ✅ Product events → Inventory sync
- ✅ Order events → Inventory reservation
- ✅ All events → Real-time WebSocket notifications
- ✅ Kafka consumer groups for scalability

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- pnpm (recommended) or npm

### 1. Start All Services (Docker)

```bash
# Make script executable
chmod +x start-enhanced.sh

# Start infrastructure + all microservices
./start-enhanced.sh
```

This will start:
1. Infrastructure (MongoDB, Redis, Kafka, Zookeeper) - wait 20s
2. Microservices (auth, user, product, inventory, order) - wait 15s
3. Gateway - wait 10s
4. Realtime service - wait 10s
5. Client application
6. Kafka UI

### 2. Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Client** | http://localhost:3000 | Next.js frontend |
| **Gateway** | http://localhost:3008 | API Gateway |
| **Auth Swagger** | http://localhost:4000/api | Auth API docs |
| **Product Swagger** | http://localhost:3002/api | Product API docs |
| **Kafka UI** | http://localhost:8080 | Kafka management |
| **Gateway Health** | http://localhost:3008/health/detailed | System health |

### 3. Test the System

#### Test Login
```bash
curl -X POST http://localhost:3008/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ruchi@yopmail.com","password":"Hrhk@123"}'
```

#### Test Product List (with caching)
```bash
# First request - cache MISS
curl http://localhost:3008/product/products -I | grep X-Cache-Status

# Second request - cache HIT
curl http://localhost:3008/product/products -I | grep X-Cache-Status
```

#### Check System Health
```bash
curl http://localhost:3008/health/detailed | jq .
```

---

## 📊 Monitoring & Observability

### Health Checks

**Gateway Health Check**:
```bash
GET /health - Basic health
GET /health/detailed - Comprehensive system health
GET /health/services/:service - Specific service health
```

**Response Example**:
```json
{
  "status": "ok",
  "info": {
    "redis": { "status": "up" },
    "auth": { 
      "status": "up",
      "instances": [
        { "url": "http://auth-service:4000", "healthy": true, "circuit": "closed" }
      ]
    },
    "product": { "status": "up", ...},
    ...
  }
}
```

### Logs

**View service logs**:
```bash
docker logs ecom-auth-service --tail 50 -f
docker logs ecom-gateway --tail 50 -f
docker logs ecom-realtime-service --tail 50 -f
```

### Kafka Monitoring

Access Kafka UI: http://localhost:8080

**Topics**:
- `product.events` - Product created/updated events
- `order.events` - Order lifecycle events  
- `inventory.events` - Stock level changes

---

## 🔧 Configuration

### Environment Variables

#### Gateway (.env.production)
```bash
# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=2

# Cache TTL (seconds)
CACHE_TTL_PRODUCT_LIST=60
CACHE_TTL_PRODUCT_SINGLE=300
CACHE_TTL_INVENTORY=30

# Load Balancing
PRODUCT_SERVICE_URLS=http://product1:3002,http://product2:3002
```

#### Client (.env.production)
```bash
NEXT_PUBLIC_API_URL=http://gateway:3008
NEXT_PUBLIC_WEBSOCKET_URL=http://realtime:3009
```

#### Service Defaults
- MongoDB: `mongodb://mongo:27017/{service}-service`
- Redis: `redis:6379` (DB varies per service)
- Kafka: `kafka:29092`

---

## 🔄 Event Flow

### Product Creation
```
User creates product via Admin Dashboard
  ↓
Product Service saves to MongoDB
  ↓
Product Service publishes 'product.created' to Kafka
  ↓
Inventory Service consumes event → Creates inventory item
  ↓
Realtime Service consumes event → Notifies admin via WebSocket
```

### Order Processing
```
User places order
  ↓
Order Service saves to MongoDB
  ↓
Order Service publishes 'order.created' to Kafka
  ↓
Inventory Service consumes event → Reserves stock
  ↓
Realtime Service consumes event → Notifies user & admin via WebSocket
```

---

## 🛡️ Security Features

### Implemented
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Rate limiting (10 req/min globally)
- ✅ HTTP-only cookies for sessions
- ✅ Password hashing (bcrypt)
- ✅ JWT token authentication
- ✅ Input validation (class-validator)
- ✅ SQL injection prevention (MongoDB parameterized queries)

### Recommended Additions
- ❌ HTTPS/TLS (use reverse proxy like Nginx)
- ❌ Per-user rate limiting
- ❌ API request signing
- ❌ Secret management (HashiCorp Vault, AWS Secrets Manager)

---

## 📈 Performance Optimizations

### Implemented
- ✅ Redis caching at gateway level
- ✅ MongoDB indexes (SKU, category, text search)
- ✅ Load balancing with circuit breaker
- ✅ Connection pooling (MongoDB, Redis)
- ✅ Kafka consumer groups for parallel processing
- ✅ Event-driven architecture for async operations

### Cache Strategy
- Product lists: 60s TTL
- Single products: 300s TTL
- Inventory: 30s TTL
- Auth/Order: No caching (real-time data)

---

## 🔍 Testing

### Manual Testing

**1. Test Authentication**:
```bash
# Register
curl -X POST http://localhost:3008/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'

# Login
curl -X POST http://localhost:3008/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'
```

**2. Test Product Management**:
```bash
# Create product (use session_id from login)
curl -X POST http://localhost:3008/product/products \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=YOUR_SESSION_ID" \
  -d '{"name":"Test Product","price":99.99,"sku":"TEST-001","category":"electronics","stock":100}'

# List products
curl http://localhost:3008/product/products?category=electronics
```

**3. Test Real-time Updates**:
- Open http://localhost:3000 in browser
- Login as user
- Open browser console to see WebSocket connection
- Create an order → See real-time notification

---

## 📦 Deployment

### Docker Compose (Current)
```bash
# Build and start
docker-compose up -d --build

# Stop
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### Kubernetes (Future)
Kubernetes manifests needed:
- Deployments for each microservice
- Services for networking
- ConfigMaps for configuration
- Secrets for sensitive data
- Persistent Volume Claims for MongoDB/Redis
- Ingress for external access

---

## 🐛 Troubleshooting

### Services Not Starting
```bash
# Check logs
docker logs ecom-<service-name>

# Check if ports are already in use
netstat -tulpn | grep <port>

# Restart specific service
docker-compose restart <service-name>
```

### Redis Connection Errors
```bash
# Check Redis is running
docker ps | grep redis

# Test Redis connectivity
docker exec ecom-redis redis-cli ping
```

### Kafka Connection Errors
```bash
# Check Kafka is running
docker ps | grep kafka

# Check Kafka topics
docker exec ecom-kafka kafka-topics --bootstrap-server localhost:9092 --list
```

### WebSocket Not Connecting
- Check realtime service is running: `docker ps | grep realtime`
- Check client env: `NEXT_PUBLIC_WEBSOCKET_URL`
- Check browser console for errors
- Verify user is authenticated

---

## 📝 API Documentation

### Gateway Endpoints
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health
- `POST /auth/*` - Auth service proxy
- `GET|POST|PUT /product/*` - Product service proxy
- `GET|POST /order/*` - Order service proxy
- `GET|POST|PUT /user/*` - User service proxy
- `GET /inventory/*` - Inventory service proxy

### Swagger Documentation
Each service has Swagger docs:
- Auth: http://localhost:4000/api
- Product: http://localhost:3002/api
- User: http://localhost:3001/api (if available)

---

## 🎯 Production Readiness Checklist

### Completed ✅
- [x] Redis caching
- [x] Load balancing
- [x] Circuit breaker
- [x] Health checks
- [x] WebSocket real-time updates
- [x] Event-driven architecture
- [x] Docker orchestration
- [x] Data persistence
- [x] Error handling
- [x] Logging (basic)
- [x] API documentation
- [x] Input validation
- [x] Security headers
- [x] Rate limiting

### Recommended Next Steps ⚠️
- [ ] HTTPS/TLS configuration
- [ ] Centralized logging (ELK stack)
- [ ] Distributed tracing (Jaeger)
- [ ] Metrics collection (Prometheus)
- [ ] Error tracking (Sentry)
- [ ] CI/CD pipeline
- [ ] Kubernetes deployment
- [ ] Automated testing (unit, integration, e2e)
- [ ] Database backups
- [ ] Disaster recovery plan
- [ ] Payment integration
- [ ] Email notifications

---

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Redis Documentation](https://redis.io/documentation)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Docker Documentation](https://docs.docker.com/)

---

## 🤝 Support

For issues and questions:
- Check logs: `docker logs ecom-<service-name>`
- Review this guide
- Check service health: `curl http://localhost:3008/health/detailed`
- Inspect Kafka messages: http://localhost:8080

---

## 📄 License

MIT License - See LICENSE file for details

---

**System Status**: ✅ Production-Ready (60% complete - security and monitoring improvements recommended)

