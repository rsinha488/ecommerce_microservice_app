# Starting All Microservices - Quick Guide

This project includes multiple ways to start all microservices at once. Choose the method that works best for your operating system.

## 📋 Prerequisites

Before running any of these scripts, ensure:

1. ✅ **Docker Desktop** is installed and running
2. ✅ **Node.js** and **npm** are installed
3. ✅ All service dependencies are installed (run `npm run install:all` from root)

## 🚀 Methods to Start All Services

### Method 1: PowerShell Script (Windows - Recommended)

Opens each service in a separate PowerShell window for easy monitoring:

```powershell
.\start-all-services.ps1
```

To stop:
```powershell
.\stop-all-services.ps1
```

**Advantages:**
- Each service runs in its own window
- Easy to see logs for each service
- Easy to stop individual services

---

### Method 2: Bash Script (Linux/Mac/WSL)

Runs services in the background with logs saved to the `logs/` directory:

```bash
chmod +x start-all-services.sh
./start-all-services.sh
```

To stop:
```bash
./stop-all-services.sh
```

To view logs:
```bash
tail -f logs/Order-Service.log
tail -f logs/Product-Service.log
# ... etc
```

**Advantages:**
- Cross-platform (Linux, Mac, WSL)
- Background execution
- Centralized log files

---

### Method 3: Node.js Script (Cross-platform)

Runs all services in a single terminal with combined output:

```bash
npm run start:all
```

To stop:
- Press `Ctrl+C`

**Advantages:**
- Works on all platforms
- No shell dependencies
- Combined output in one terminal
- Automatic cleanup on exit

---

### Method 4: Manual npm Scripts

Start services individually:

```bash
# Start infrastructure first
npm run start:infrastructure

# Wait 10 seconds, then start services in separate terminals
npm run start:order
npm run start:product
npm run start:inventory
npm run start:auth
npm run start:user
```

---

## 📊 What Gets Started

### Infrastructure Services (Docker Containers)
- **MongoDB**: `localhost:27017`
- **Redis**: `localhost:6379`
- **Kafka**: `localhost:9092`
- **Zookeeper**: `localhost:2181`
- **Kafka UI**: `http://localhost:8080`

### Microservices
| Service | Port | API Documentation |
|---------|------|-------------------|
| Order Service | 5003 | http://localhost:5003/docs |
| Product Service | 3002 | http://localhost:3002/api |
| Inventory Service | 3003 | http://localhost:3003/api |
| Auth Service | 4000 | http://localhost:4000/.well-known/openid-configuration |
| User Service | 3001 | http://localhost:3001/users |

---

## 🛠️ Utility Scripts

### Install all dependencies
```bash
npm run install:all
```

### Build all services
```bash
npm run build:all
```

### Run tests for all services
```bash
npm run test:all
```

### Start only infrastructure
```bash
npm run start:infrastructure
```

### Stop infrastructure
```bash
npm run stop:infrastructure
```

---

## 🔧 Troubleshooting

### Docker not running
```
Error: Docker is not running
```
**Solution**: Start Docker Desktop and wait for it to fully initialize.

### Port already in use
```
Error: listen EADDRINUSE :::3001
```
**Solution**: 
- Windows: `netstat -ano | findstr :3001` then `taskkill /PID <PID> /F`
- Linux/Mac: `lsof -ti:3001 | xargs kill -9`

### MongoDB connection refused
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: 
```bash
docker ps | grep mongo  # Check if MongoDB is running
cd services/inventory
docker-compose restart mongodb
```

### Kafka connection error
```
Error: KafkaJSConnectionError
```
**Solution**: Kafka takes time to start. Wait 30 seconds and try again, or restart:
```bash
cd services/inventory
docker-compose restart kafka
```

---

## 📝 Environment Variables

Each service uses these default environment variables:

### Order Service
- `MONGO_URI=mongodb://localhost:27017/order-service`
- `PORT=5003`

### Product Service
- `MONGO_URI=mongodb://localhost:27017/product-service`
- `PORT=3002`
- `KAFKA_BROKERS=localhost:9092`

### Inventory Service
- `MONGO_URI=mongodb://localhost:27017/inventory-service`
- `PORT=3003`
- `KAFKA_BROKER=localhost:9092`
- `REDIS_HOST=localhost`

### Auth Service
- `MONGO_URI=mongodb://localhost:27017/auth-service`
- `AUTH_PORT=4000`
- `REDIS_HOST=localhost`
- `JWT_ISS=http://localhost:4000`

### User Service
- `MONGO_URI=mongodb://localhost:27017/user-service`
- `PORT=3001`
- `REDIS_HOST=localhost`

To customize, edit the values in the respective startup scripts.

---

## 🧪 Testing the System

After all services are running, test the event flow:

### 1. Create a Product
```bash
curl -X POST http://localhost:3002/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "sku": "TEST-001",
    "description": "Test Description",
    "price": 100,
    "stock": 50,
    "category": "test",
    "images": []
  }'
```

### 2. Create Inventory
```bash
curl -X POST http://localhost:3003/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "TEST-001",
    "stock": 50,
    "reserved": 0
  }'
```

### 3. Create Order
```bash
curl -X POST http://localhost:5003/orders \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "user-123",
    "currency": "USD",
    "items": [{
      "sku": "TEST-001",
      "name": "Test Product",
      "quantity": 2,
      "unitPrice": 100
    }]
  }'
```

---

## 🎯 Recommended Workflow

1. **First Time Setup**:
   ```bash
   npm run install:all
   npm run build:all
   ```

2. **Start Development**:
   - Windows: `.\start-all-services.ps1`
   - Linux/Mac: `./start-all-services.sh`
   - Or: `npm run start:all`

3. **Monitor Services**:
   - Check individual service windows/logs
   - Visit http://localhost:8080 for Kafka UI
   - Check service health endpoints

4. **Stop Everything**:
   - Windows: `.\stop-all-services.ps1`
   - Linux/Mac: `./stop-all-services.sh`
   - Or: Press `Ctrl+C` if using Node.js script

---

## 💡 Tips

- **First startup** may take 1-2 minutes for all services to initialize
- **Kafka** needs ~30 seconds to be fully ready
- **MongoDB** starts quickly but services need time to connect
- Check **Kafka UI** (http://localhost:8080) to monitor events
- Each service has **hot-reload** enabled for development

---

## 📚 Additional Resources

- See `QUICK_FINISH_GUIDE.md` for detailed setup instructions
- See individual service READMEs in `services/<service-name>/README.md`
- Check `PROJECT_STARTUP_REPORT.md` for project status

---

**Happy Coding! 🚀**


