# E-commerce Microservices Platform

A modern e-commerce platform built with microservices architecture, featuring secure authentication using HTTP-only cookies.

## 🚀 Quick Start

### Start All Services (Recommended)
```bash
./start.sh
```

This will start all microservices and the Next.js client application in Docker containers.

### Individual Service Development

#### Start Microservices Only
```bash
docker-compose up --build -d
```

#### Start Next.js Client Separately (Development Mode)
```bash
cd client
./start-client.sh  # Linux/Mac
# OR
./start-client.ps1  # Windows
```

## 📋 Services

| Service | Port | Description |
|---------|------|-------------|
| Auth Service | 4000 | Authentication & Authorization |
| User Service | 3001 | User management |
| Product Service | 3002 | Product catalog |
| Inventory Service | 3003 | Inventory management |
| Order Service | 5003 | Order processing |
| Next.js Client | 3000 | Frontend application |
| MongoDB | 27018 | Database |
| Redis | 6380 | Cache & Sessions |
| Kafka | 9092 | Message broker |
| Kafka UI | 8080 | Kafka management UI |

## 🔐 Authentication

The platform uses production-ready authentication with:
- **HTTP-only cookies** for secure token storage
- **Server-side session management** in Redis
- **Route protection** via Next.js middleware
- **Automatic redirects** for unauthenticated users

### Authentication Flow
1. User logs in → Server sets HTTP-only cookie
2. Protected routes check for valid session
3. Invalid/expired sessions redirect to login
4. Logout clears server-side session and cookie

## 🛠️ Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local client development)

### Environment Variables
Services use the following environment variables (configured in docker-compose.yml):
- `API_*_URL`: Service URLs for inter-service communication
- `MONGO_URI`: MongoDB connection string
- `REDIS_HOST/PORT`: Redis configuration
- `KAFKA_BROKER`: Kafka broker URL

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   Auth Service  │
│   Client        │◄──►│   (Port 4000)   │
│   (Port 3000)   │    └─────────────────┘
└─────────────────┘            ▲
        │                      │
        ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│ Product Service │    │   User Service  │
│   (Port 3002)   │    │   (Port 3001)   │
└─────────────────┘    └─────────────────┘
        ▲                      ▲
        │                      │
        ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│Inventory Service│    │ Order Service   │
│   (Port 3003)   │    │   (Port 5003)   │
└─────────────────┘    └─────────────────┘
        ▲                      ▲
        └──────────────────────┘
               Kafka
               Redis
               MongoDB
```

## 🧪 Testing

### Demo Credentials
- Email: `demo@example.com`
- Password: `demo123`

### Test Authentication Flow
1. Visit http://localhost:3000
2. Try accessing `/orders` or `/cart` (should redirect to login)
3. Login with demo credentials
4. Should redirect back to intended page
5. Logout should clear session and redirect to login

## 📁 Project Structure

```
ecom_microservice-master/
├── client/                 # Next.js frontend
│   ├── app/               # Next.js app router
│   ├── components/        # React components
│   ├── lib/              # Utilities & API clients
│   └── middleware.ts      # Route protection
├── services/              # Microservices
│   ├── auth/             # Authentication service
│   ├── user/             # User management
│   ├── product/          # Product catalog
│   ├── inventory/        # Inventory management
│   └── order/            # Order processing
├── docker-compose.yml     # All services configuration
├── start.sh              # Quick start script
└── README.md
```

## 🔒 Security Features

- **HTTP-only cookies** prevent XSS attacks
- **Server-side sessions** in Redis
- **Route-level protection** via middleware
- **Automatic token refresh** (cookies sent with requests)
- **Secure logout** with server-side cleanup

## 📊 Monitoring

- **API Gateway Swagger Documentation**: http://localhost:3008/api
- **Kafka UI**: http://localhost:8080
- **Service logs**: `docker-compose logs -f [service-name]`
- **Health checks**: Individual service endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test with `./start.sh`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
