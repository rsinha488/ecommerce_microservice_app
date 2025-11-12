# E-Commerce Microservices Startup Guide

## Overview
This guide explains how to start your e-commerce microservices platform in different ways.

---

## Quick Start (All Services via Docker)

### Method 1: Enhanced Startup Script (RECOMMENDED)
```bash
./start-enhanced.sh
```

This script will:
- Clean up all existing Docker containers and volumes
- Check Docker daemon health
- Build all services from scratch
- Start services in correct dependency order
- Perform health checks
- Display all service URLs

### Method 2: Original Startup Script
```bash
./start.sh
```

### Method 3: Manual Docker Compose
```bash
# Clean up first
docker-compose down --volumes --remove-orphans
docker system prune -f

# Start all services
docker-compose up --build -d

# View logs
docker-compose logs -f
```

---

## Development Mode (Individual Services)

### Prerequisites
For local development outside Docker, you need:

1. **MongoDB** (Port 27017)
   ```bash
   docker run -d -p 27017:27017 --name mongo mongo:7
   ```

2. **Redis** (Port 6379)
   ```bash
   docker run -d -p 6379:6379 --name redis redis:7
   ```

3. **Kafka + Zookeeper**
   ```bash
   # Use docker-compose for just infrastructure
   docker-compose up -d mongo redis zookeeper kafka kafka-ui
   ```

### Start Individual Services

#### Auth Service
```bash
cd services/auth
./start-dev.sh
# Or manually:
pnpm install
pnpm run start:dev
```
Access: http://localhost:4000

#### Product Service
```bash
cd services/product
./start-dev.sh
# Or manually:
pnpm install
pnpm run start:dev
```
Access: http://localhost:3002

#### User Service
```bash
cd services/user
./start-dev.sh
# Or manually:
pnpm install
pnpm run start:dev
```
Access: http://localhost:3001

#### Inventory Service
```bash
cd services/inventory
./start-dev.sh
# Or manually:
pnpm install
pnpm run start:dev
```
Access: http://localhost:3003

#### Order Service
```bash
cd services/order
./start-dev.sh
# Or manually:
pnpm install
pnpm run start:dev
```
Access: http://localhost:5003

#### Gateway Service
```bash
cd services/gateway
./start-dev.sh
# Or manually:
npm install
npm run start:dev
```
Access: http://localhost:3008

#### Client Application
```bash
cd client
./start-dev.sh
# Or manually:
npm install --legacy-peer-deps
npm run dev
```
Access: http://localhost:3000

---

## Service Dependency Tree

```
Infrastructure Layer:
├── MongoDB (27017)
├── Redis (6379)
└── Kafka + Zookeeper (9092, 29092, 2181)

Microservices Layer (depends on infrastructure):
├── Auth Service (4000)
├── User Service (3001)
├── Product Service (3002)
├── Inventory Service (3003)
└── Order Service (5003)

Gateway Layer (depends on microservices):
└── API Gateway (3008)

Client Layer (depends on gateway):
└── Next.js Client (3000)

Monitoring:
└── Kafka UI (8080)
```

---

## Service URLs

### Infrastructure
- **MongoDB**: `mongodb://localhost:27017`
- **Redis**: `redis://localhost:6379`
- **Kafka**: `localhost:9092` (host) / `kafka:29092` (container)
- **Kafka UI**: http://localhost:8080

### Microservices
- **Auth Service**: http://localhost:4000
  - Swagger: http://localhost:4000/api
- **User Service**: http://localhost:3001
  - Swagger: http://localhost:3001/api
- **Product Service**: http://localhost:3002
  - Swagger: http://localhost:3002/api
- **Inventory Service**: http://localhost:3003
  - Swagger: http://localhost:3003/api
- **Order Service**: http://localhost:5003
  - Swagger: http://localhost:5003/api

### Gateway & Client
- **API Gateway**: http://localhost:3008
  - Swagger: http://localhost:3008/api
- **Client Application**: http://localhost:3000

---

## Docker Commands Reference

### View Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service
docker-compose logs -f gateway
docker-compose logs -f client

# Last 100 lines
docker-compose logs --tail=100 -f
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart auth-service
docker-compose restart gateway
```

### Stop Services
```bash
# Stop all
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down --volumes --remove-orphans
```

### Rebuild Services
```bash
# Rebuild all
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache auth-service

# Rebuild and restart
docker-compose up --build -d auth-service
```

### Access Container Shell
```bash
# Access running container
docker exec -it ecom-auth-service sh
docker exec -it ecom-gateway sh
docker exec -it ecom-client sh

# Access MongoDB
docker exec -it ecom-mongo mongosh

# Access Redis
docker exec -it ecom-redis redis-cli
```

---

## Troubleshooting

### Issue: Containers in "Created" state but not running
**Solution:**
```bash
docker-compose down --volumes
docker system prune -f
docker-compose up --build -d
```

### Issue: Port already in use
**Solution:**
```bash
# Find process using port (e.g., 4000)
lsof -i :4000
# Or
netstat -nlp | grep 4000

# Kill process
kill -9 <PID>
```

### Issue: MongoDB connection failed
**Solution:**
- Check if MongoDB container is healthy: `docker-compose ps mongo`
- Check logs: `docker-compose logs mongo`
- Verify connection string in service .env files

### Issue: Gateway cannot connect to services
**Solution:**
- Ensure gateway environment variables use container names (not localhost)
- Fixed in docker-compose.yml:
  - `AUTH_SERVICE_URL=http://auth-service:4000` ✓
  - NOT `http://localhost:4000` ✗

### Issue: Kafka connection issues
**Solution:**
- Ensure services use `kafka:29092` (internal Docker network)
- For host access use `localhost:9092`
- Check Kafka health: `docker-compose logs kafka`

### Issue: Build fails with npm/pnpm errors
**Solution:**
```bash
# For NestJS services (auth, product, user, etc.)
cd services/auth  # or other service
rm -rf node_modules package-lock.json pnpm-lock.yaml
pnpm install

# For Gateway
cd services/gateway
rm -rf node_modules package-lock.json
npm install

# For Client
cd client
rm -rf node_modules package-lock.json .next
npm install --legacy-peer-deps
```

---

## Environment Configuration

### Docker Environment
Services use container names for inter-service communication:
- MongoDB: `mongodb://mongo:27017`
- Redis: `redis:6379`
- Kafka: `kafka:29092`

### Local Development Environment
Services use localhost:
- MongoDB: `mongodb://localhost:27017`
- Redis: `localhost:6379`
- Kafka: `localhost:9092`

**Note:** Each service may need its own `.env` file for local development. Check `services/<service-name>/.env` files.

---

## Best Practices

### 1. Always Clean Before Starting
```bash
docker-compose down --volumes --remove-orphans
docker system prune -f
```

### 2. Check Logs Regularly
```bash
docker-compose logs -f --tail=50
```

### 3. Monitor Resource Usage
```bash
docker stats
```

### 4. Use Health Checks
```bash
# Check infrastructure health
docker-compose ps mongo redis kafka

# Test service endpoints
curl http://localhost:4000/health  # Auth
curl http://localhost:3008/health  # Gateway
```

### 5. Development Workflow
```bash
# 1. Start infrastructure only
docker-compose up -d mongo redis zookeeper kafka

# 2. Develop specific service locally
cd services/auth
./start-dev.sh

# 3. Test with other services in Docker
docker-compose up -d user-service product-service

# 4. Start gateway and client
docker-compose up -d gateway client
```

---

## Production Considerations

For production deployment, consider:

1. **Remove development flags**
   - Change `NODE_ENV=production`
   - Use `start:prod` scripts

2. **Use proper secrets management**
   - Don't commit `.env` files
   - Use Docker secrets or env variables

3. **Add proper health checks**
   - Implement `/health` endpoints
   - Configure Docker healthcheck intervals

4. **Scale services**
   ```bash
   docker-compose up -d --scale product-service=3
   ```

5. **Use external managed services**
   - MongoDB Atlas for database
   - Redis Cloud for caching
   - Confluent Cloud for Kafka

6. **Set resource limits**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```

---

## Summary

**Recommended approach for development:**
1. Use `./start-enhanced.sh` for full stack testing
2. Use individual `start-dev.sh` scripts when developing specific services
3. Use Docker for infrastructure, local Node.js for services you're actively developing

**Recommended approach for production:**
1. Use Docker Compose with production environment variables
2. Deploy to Kubernetes or container orchestration platform
3. Use managed services for databases and message queues
