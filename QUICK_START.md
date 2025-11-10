# Quick Start Guide

## Choose Your Workflow

### Option 1: Full Stack (Docker) - RECOMMENDED FOR TESTING
**Use when**: You want to test the entire system together

```bash
# Clean start everything
./start-enhanced.sh
```

This will:
- Clean up any existing containers
- Start all infrastructure (MongoDB, Redis, Kafka)
- Start all microservices (Auth, User, Product, Inventory, Order)
- Start API Gateway
- Start Next.js Client
- Display all URLs and health status

**Access**:
- Client: http://localhost:3000
- API Gateway: http://localhost:3008
- Kafka UI: http://localhost:8080

---

### Option 2: Local Development - RECOMMENDED FOR CODING
**Use when**: You're actively developing a specific service

#### Step 1: Start Infrastructure Only
```bash
./start-infrastructure.sh
```

This starts MongoDB, Redis, Kafka (not the microservices)

#### Step 2: Start the Service You're Working On
```bash
# Working on Auth Service?
cd services/auth
./start-dev.sh

# Working on Product Service?
cd services/product
./start-dev.sh

# Working on Gateway?
cd services/gateway
./start-dev.sh

# Working on Frontend?
cd client
./start-dev.sh
```

**Benefits**:
- Fast hot reload (no Docker rebuild)
- Direct access to logs
- Easy debugging
- Quick iteration

---

### Option 3: Hybrid Approach
**Use when**: Developing one service, need others running

```bash
# Start infrastructure
./start-infrastructure.sh

# Start microservices in Docker (except the one you're developing)
docker-compose up -d auth-service user-service product-service inventory-service order-service gateway

# Develop your service locally with hot reload
cd services/auth  # or whichever service
./start-dev.sh
```

---

## Quick Commands

### Check Everything is Running
```bash
./status.sh
```

### Stop Everything
```bash
./stop-enhanced.sh
```

### Stop and Clean All Data
```bash
./stop-enhanced.sh -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service
docker-compose logs -f gateway
```

### Restart a Service
```bash
docker-compose restart auth-service
```

---

## Common Scenarios

### "I just cloned the repo, how do I start?"
```bash
# Make sure Docker is running first!
./start-enhanced.sh
```

Wait 2-3 minutes, then open http://localhost:3000

### "I'm developing the Auth service"
```bash
# Terminal 1: Start infrastructure
./start-infrastructure.sh

# Terminal 2: Start other services you need
docker-compose up -d user-service product-service gateway

# Terminal 3: Develop auth service locally
cd services/auth
./start-dev.sh
# Now edit code - it will hot reload!
```

### "I'm working on the frontend"
```bash
# Terminal 1: Start everything except client
docker-compose up -d mongo redis kafka \
  auth-service user-service product-service \
  inventory-service order-service gateway

# Terminal 2: Develop client locally
cd client
./start-dev.sh
# Now edit React/Next.js code - instant updates!
```

### "Something is broken, I need a fresh start"
```bash
# Nuclear option - clean everything
./stop-enhanced.sh -c

# Start fresh
./start-enhanced.sh
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using port 3000 (or any port)
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Docker Not Starting
```bash
# Make sure Docker daemon is running
docker info

# If not, start Docker Desktop
```

### Services Show "Created" but Not "Up"
```bash
# View logs to see the error
docker-compose logs auth-service

# Common fix: clean restart
./stop-enhanced.sh -v
./start-enhanced.sh
```

### MongoDB Connection Failed
```bash
# Check if MongoDB is healthy
docker-compose ps mongo

# Restart it
docker-compose restart mongo

# Check logs
docker-compose logs mongo
```

---

## File Structure Reference

```
Your Project/
├── start-enhanced.sh         # 🚀 Start everything (Docker)
├── start-infrastructure.sh   # 🏗️  Start DB/Redis/Kafka only
├── stop-enhanced.sh          # 🛑 Stop everything
├── status.sh                 # ✅ Check what's running
├── docker-compose.yml        # 🐳 Docker configuration
│
├── services/
│   ├── auth/
│   │   └── start-dev.sh      # 🔧 Dev mode for auth
│   ├── product/
│   │   └── start-dev.sh      # 🔧 Dev mode for product
│   ├── user/
│   │   └── start-dev.sh      # 🔧 Dev mode for user
│   ├── inventory/
│   │   └── start-dev.sh      # 🔧 Dev mode for inventory
│   ├── order/
│   │   └── start-dev.sh      # 🔧 Dev mode for order
│   └── gateway/
│       └── start-dev.sh      # 🔧 Dev mode for gateway
│
├── client/
│   └── start-dev.sh          # 🔧 Dev mode for frontend
│
└── Docs/
    ├── STARTUP_GUIDE.md      # 📖 Detailed guide
    ├── IMPROVEMENTS_SUMMARY.md # 📝 What we changed
    └── QUICK_START.md        # ⚡ This file
```

---

## Next Steps

1. **First Time?** Run `./start-enhanced.sh` to see everything work
2. **Ready to Code?** Use `./start-infrastructure.sh` + service `start-dev.sh`
3. **Need Help?** Check [STARTUP_GUIDE.md](STARTUP_GUIDE.md) for details
4. **Something Wrong?** See troubleshooting section above

---

## Pro Tips

1. **Always check status first**: `./status.sh`
2. **Use multiple terminals**: One for infrastructure, one for service dev
3. **Watch logs in real-time**: `docker-compose logs -f service-name`
4. **Commit often**: Your code is outside Docker, so git works normally
5. **Clean weekly**: `./stop-enhanced.sh -v` to remove old data

---

## Service URLs Cheat Sheet

| Service | URL | Purpose |
|---------|-----|---------|
| Client | http://localhost:3000 | Frontend application |
| Gateway | http://localhost:3008 | API Gateway (main entry) |
| Auth | http://localhost:4000 | Authentication service |
| User | http://localhost:3001 | User management |
| Product | http://localhost:3002 | Product catalog |
| Inventory | http://localhost:3003 | Inventory tracking |
| Order | http://localhost:5003 | Order processing |
| Kafka UI | http://localhost:8080 | Monitor Kafka messages |

---

**Need more details?** See [STARTUP_GUIDE.md](STARTUP_GUIDE.md)

**Questions?** Check the troubleshooting section in the main guide.
