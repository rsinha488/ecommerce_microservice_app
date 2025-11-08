# E-commerce Microservices Platform

A complete microservices-based e-commerce platform built with NestJS, MongoDB Atlas, Kafka, and Redis.

## 🏗️ Architecture

This project consists of 5 independent microservices:

| Service | Port | Description | Status |
|---------|------|-------------|--------|
| **User Service** | 3001 | User management and profiles | ✅ Working |
| **Product Service** | 3002 | Product catalog with Elasticsearch | ✅ Working |
| **Inventory Service** | 3003 | Stock and inventory management | ⚠️ Check logs |
| **Auth Service** | 4000 | Authentication & Authorization (OIDC/JWT) | ✅ Working |
| **Order Service** | 5003 | Order processing and management | ⚠️ Check logs |

## 🛠️ Technology Stack

- **Framework:** NestJS (Node.js/TypeScript)
- **Database:** MongoDB Atlas (Cloud) + Local MongoDB (Docker)
- **Message Queue:** Apache Kafka
- **Caching:** Redis
- **Search:** Elasticsearch (Product Service)
- **Containerization:** Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites

- ✅ Node.js 18+ 
- ✅ Docker Desktop
- ✅ npm or pnpm

### 1. Install Dependencies

```powershell
npm run install:all
```

### 2. Start All Services

**Windows (PowerShell):**
```powershell
.\start-all-services.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x start-all-services.sh
./start-all-services.sh
```

**Node.js (Cross-platform):**
```bash
npm run start:all
```

### 3. Check Service Status

```powershell
.\check-services-status.ps1
```

## 🌐 Access Points

Once all services are running:

| Service | URL |
|---------|-----|
| User API | http://localhost:3001/users |
| Product API | http://localhost:3002/products |
| Inventory API | http://localhost:3003/api |
| Auth OIDC Config | http://localhost:4000/.well-known/openid-configuration |
| Order API Docs | http://localhost:5003/docs |
| Kafka UI | http://localhost:8080 |

## 🔧 Configuration

All environment variables are centralized in configuration files:

- **Windows:** `config.env.ps1`
- **Linux/Mac:** `config.env.sh`

### MongoDB Configuration

Currently using **MongoDB Atlas** (cloud database):
```
mongodb+srv://ruchishestabit_db_user:39763976@cluster0.ejp03r8.mongodb.net
```

To change the database URI, edit `config.env.ps1` or `config.env.sh`.

## 📦 Available Scripts

```bash
# Start all services
npm run start:all

# Start infrastructure only (MongoDB, Redis, Kafka)
npm run start:infrastructure

# Stop infrastructure
npm run stop:infrastructure

# Install all service dependencies
npm run install:all

# Build all services
npm run build:all

# Start individual services
npm run start:order
npm run start:product
npm run start:inventory
npm run start:auth
npm run start:user
```

## 🐳 Infrastructure Services

The following services run in Docker containers:

- **MongoDB** - localhost:27017 (optional, using Atlas cloud)
- **Redis** - localhost:6379
- **Kafka** - localhost:9092
- **Zookeeper** - localhost:2181
- **Kafka UI** - localhost:8080

Start infrastructure:
```powershell
cd services/inventory
docker-compose up -d
```

## 🔍 Troubleshooting

### Services Not Starting

1. **Check PowerShell/Terminal windows** for error messages
2. **Verify Docker is running:** `.\check-docker.ps1`
3. **Check if ports are available:** `.\check-services-status.ps1`
4. **Install missing dependencies:** `cd services/<service-name> && npm install`

### Common Issues

**Port Already in Use:**
```powershell
# Windows
Get-Process node | Stop-Process -Force

# Linux/Mac
killall node
```

**Docker Not Running:**
```powershell
.\restart-docker.ps1
```

**Environment Variables Not Loading:**
```powershell
# Load configuration manually
. .\config.env.ps1
```

## 📚 Documentation

- [START_SERVICES_README.md](START_SERVICES_README.md) - Comprehensive service startup guide
- [QUICK_FINISH_GUIDE.md](QUICK_FINISH_GUIDE.md) - Quick reference for setup
- [ENV_CONFIGURATION.md](ENV_CONFIGURATION.md) - Environment configuration details
- [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md) - MongoDB Atlas configuration

## 🧪 Testing

### Test Working Services

```powershell
# User Service
curl http://localhost:3001/users

# Product Service
curl http://localhost:3002/products

# Auth Service
curl http://localhost:4000/.well-known/openid-configuration
```

### Create a Product

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

## 🔒 Security Notes

⚠️ **Development Environment:** The current setup is configured for development with credentials in plain text.

For **production**:
- Use environment variables from secure secret management
- Enable authentication for all infrastructure services
- Configure MongoDB Atlas IP whitelist
- Use proper SSL/TLS certificates
- Rotate credentials regularly

## 🛑 Stopping Services

**Stop All Services:**
```powershell
# Windows
.\stop-all-services.ps1

# Linux/Mac
./stop-all-services.sh

# Or kill all Node processes
Get-Process node | Stop-Process -Force
```

**Stop Infrastructure:**
```powershell
cd services/inventory
docker-compose down
```

## 🏗️ Project Structure

```
ecom_microservice-master/
├── services/
│   ├── auth/           # Authentication service
│   ├── user/           # User management service
│   ├── product/        # Product catalog service
│   ├── inventory/      # Inventory management service
│   ├── order/          # Order processing service
│   ├── cart/           # (Not implemented)
│   └── payment/        # (Not implemented)
├── scripts/
│   └── start-all.js    # Node.js startup script
├── config.env.ps1      # Windows configuration
├── config.env.sh       # Linux/Mac configuration
├── start-all-services.ps1  # Windows startup script
├── start-all-services.sh   # Linux/Mac startup script
├── stop-all-services.ps1   # Windows stop script
├── stop-all-services.sh    # Linux/Mac stop script
└── package.json        # Root package.json with scripts
```

## 🤝 Contributing

Each service follows Domain-Driven Design (DDD) principles with:
- **Domain Layer:** Entities, value objects, domain services
- **Application Layer:** Use cases, DTOs
- **Infrastructure Layer:** Database, messaging, external services
- **Presentation Layer:** Controllers, HTTP endpoints

## 📝 License

MIT

## 🔗 Useful Links

- [NestJS Documentation](https://docs.nestjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Apache Kafka](https://kafka.apache.org/)
- [Docker Documentation](https://docs.docker.com/)

---

**Need Help?** Check the documentation files or create an issue.

**Quick Commands:**
```powershell
# Start everything
.\start-all-services.ps1

# Check status
.\check-services-status.ps1

# Stop everything
.\stop-all-services.ps1
```
