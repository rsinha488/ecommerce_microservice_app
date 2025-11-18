# E-Commerce Microservices Platform

> A production-ready microservices architecture built with NestJS, Next.js, MongoDB, Redis, and Kafka

[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![NestJS](https://img.shields.io/badge/NestJS-Framework-red)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-Frontend-black)](https://nextjs.org/)

---

## 🚀 Quick Start (30 seconds)

```bash
# 1. Make sure Docker is running
docker --version

# 2. Start everything
./start-enhanced.sh

# 3. Open your browser
# http://localhost:3000 (Client)
# http://localhost:3008 (API Gateway)
# http://localhost:8080 (Kafka UI)
```

**That's it!** The platform will start in 2-3 minutes with all services running.

---

## 📚 Documentation

| Document | Purpose | When to Read |
|----------|---------|-------------|
| [QUICK_START.md](QUICK_START.md) | Fast reference guide | **Start here!** |
| [STARTUP_GUIDE.md](STARTUP_GUIDE.md) | Detailed instructions | Need more details |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Architecture & overview | Understanding the system |
| [IMPROVEMENTS_SUMMARY.md](IMPROVEMENTS_SUMMARY.md) | What changed and why | Curious about changes |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       Client Layer                            │
│                   Next.js (Port 3000)                         │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                      Gateway Layer                            │
│                  API Gateway (Port 3008)                      │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                    Microservices Layer                        │
│  Auth (4000) | User (3001) | Product (3002)                 │
│  Inventory (3003) | Order (5003)                             │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                        │
│  MongoDB | Redis | Kafka | Zookeeper                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Services

| Service | Port | Description | Tech Stack |
|---------|------|-------------|------------|
| **Client** | 3000 | Web application | Next.js, React, TailwindCSS |
| **API Gateway** | 3008 | Request routing | NestJS, Express |
| **Auth Service** | 4000 | Authentication/OAuth2 | NestJS, JWT, MongoDB |
| **User Service** | 3001 | User management | NestJS, MongoDB |
| **Product Service** | 3002 | Product catalog | NestJS, MongoDB, Elasticsearch |
| **Inventory Service** | 3003 | Stock management | NestJS, MongoDB |
| **Order Service** | 5003 | Order processing | NestJS, MongoDB |

---

## 🎮 Usage

### Full Stack (Docker)
Perfect for testing and production-like environment:
```bash
./start-enhanced.sh    # Start everything
./status.sh            # Check health
./stop-enhanced.sh     # Stop everything
```

### Local Development
Perfect for coding with hot reload:
```bash
# Terminal 1: Start infrastructure
./start-infrastructure.sh

# Terminal 2: Develop your service
cd services/auth
./start-dev.sh
```

### Hybrid Development
Perfect for testing integration while developing:
```bash
# Infrastructure + most services in Docker
docker-compose up -d mongo redis kafka gateway

# Your service locally
cd services/product
./start-dev.sh
```

---

## 🔧 Available Scripts

### Root Level Scripts
```bash
./start-enhanced.sh          # 🚀 Start all services (Docker)
./start-infrastructure.sh    # 🏗️  Start infrastructure only
./stop-enhanced.sh          # 🛑 Stop all services
./stop-enhanced.sh -v       # 🗑️  Stop + remove data
./stop-enhanced.sh -c       # 💣 Complete cleanup
./status.sh                 # ✅ Check system status
```

### Service Level Scripts
```bash
cd services/auth && ./start-dev.sh       # Auth service
cd services/product && ./start-dev.sh    # Product service
cd services/user && ./start-dev.sh       # User service
cd services/inventory && ./start-dev.sh  # Inventory service
cd services/order && ./start-dev.sh      # Order service
cd services/gateway && ./start-dev.sh    # Gateway
cd client && ./start-dev.sh              # Client app
```

---

## 📊 Monitoring

### Check System Health
```bash
./status.sh
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

### Access Kafka UI
Open http://localhost:8080 to monitor message queues

### Access Service APIs
- Auth API: http://localhost:4000/api
- Product API: http://localhost:3002/api
- User API: http://localhost:3001/api
- Inventory API: http://localhost:3003/api
- Order API: http://localhost:5003/api
- Gateway API: http://localhost:3008/api

---

## 🔍 Key Features

### ✅ Development Features
- **Hot Reload**: Change code and see instant updates
- **Individual Service Development**: Run any service independently
- **Docker Compose**: Full stack in one command
- **Health Monitoring**: Built-in status checks
- **Comprehensive Logging**: Colored output and clear messages

### ✅ Production Features
- **Microservices Architecture**: Independent, scalable services
- **API Gateway**: Single entry point for all APIs
- **Event-Driven**: Kafka for async communication
- **Caching**: Redis for session and data caching
- **OAuth2/JWT**: Secure authentication
- **Docker Ready**: Containerized deployment

### ✅ Best Practices
- **Service Isolation**: Each service is independent
- **Health Checks**: All services have health endpoints
- **Error Handling**: Graceful error management
- **Documentation**: Multiple levels of docs
- **Clean Code**: TypeScript, ESLint, Prettier

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
lsof -i :3000        # Find process
kill -9 <PID>        # Kill it
```

### Containers Won't Start
```bash
./stop-enhanced.sh -v    # Clean everything
./start-enhanced.sh      # Fresh start
```

### Service Can't Connect to Database
```bash
docker-compose logs mongo        # Check MongoDB
docker-compose restart mongo     # Restart it
```

### More Issues?
See [STARTUP_GUIDE.md](STARTUP_GUIDE.md) → Troubleshooting section

---

## 🔐 Environment Variables

### Docker Environment (Automatic)
Services automatically use Docker network:
- MongoDB: `mongodb://mongo:27017`
- Redis: `redis:6379`
- Kafka: `kafka:29092`

### Local Development
For local development, update service `.env` files:
- MongoDB: `mongodb://localhost:27017`
- Redis: `localhost:6379`
- Kafka: `localhost:9092`

---

## 🎯 Common Workflows

### First Time User
```bash
./start-enhanced.sh
# Wait 2-3 minutes
# Open http://localhost:3000
```

### Frontend Developer
```bash
# Start backend in Docker
docker-compose up -d mongo redis kafka \
  auth-service user-service product-service gateway

# Develop frontend locally with hot reload
cd client && ./start-dev.sh
```

### Backend Developer
```bash
# Start infrastructure
./start-infrastructure.sh

# Develop your service
cd services/auth && ./start-dev.sh
```

### Full Stack Developer
```bash
# Everything in Docker
./start-enhanced.sh

# Or infrastructure in Docker, services local
./start-infrastructure.sh
# Then start services you need locally
```

---

## 📦 Technology Stack

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: MongoDB
- **Cache**: Redis
- **Message Queue**: Kafka
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State**: Redux Toolkit
- **HTTP**: Axios

### DevOps
- **Containerization**: Docker & Docker Compose
- **Package Manager**: pnpm (backend), npm (frontend)
- **Process Manager**: PM2 (optional)

---

## 🚧 Project Status

✅ **Working Features**
- All microservices (Auth, User, Product, Inventory, Order)
- API Gateway with routing
- Next.js client application
- Docker Compose setup
- Individual service development
- Health monitoring
- Comprehensive documentation

🔄 **In Progress**
- Payment service
- Cart service
- WebSocket service

---

## 📝 Prerequisites

- **Docker**: Version 20.x or higher
- **Docker Compose**: Version 2.x or higher
- **Node.js**: Version 18.x or higher (for local development)
- **pnpm**: Version 8.x or higher (for NestJS services)
- **npm**: Version 9.x or higher (for Gateway and Client)

### Quick Install
```bash
# Check versions
docker --version
docker-compose --version
node --version
pnpm --version

# Install pnpm if needed
npm install -g pnpm
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- NestJS for the excellent framework
- Next.js for the amazing React framework
- Docker for containerization
- The open-source community

---

## 📞 Support

- **Documentation**: See [QUICK_START.md](QUICK_START.md) for fast reference
- **Detailed Guide**: See [STARTUP_GUIDE.md](STARTUP_GUIDE.md) for comprehensive instructions
- **Troubleshooting**: See the Troubleshooting section in the guide

---

## 🎉 Getting Started Now

```bash
# Clone the repository (if not already)
cd ecom_microservice-master

# Start everything
./start-enhanced.sh

# Open browser
# http://localhost:3000 - Client
# http://localhost:3008 - API Gateway
# http://localhost:8080 - Kafka UI

# Check status
./status.sh

# Stop when done
./stop-enhanced.sh
```

**Happy Coding!** 🚀
