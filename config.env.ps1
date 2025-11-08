# Common Environment Configuration for All Microservices
# Source this file in your PowerShell scripts: . .\config.env.ps1

# Local MongoDB Connection (Docker)
$env:MONGODB_BASE_URI = "mongodb://localhost:27017"

# Service-specific MongoDB URIs
$env:MONGO_URI_USER = "mongodb://localhost:27017/user-service"
$env:MONGO_URI_PRODUCT = "mongodb://localhost:27017/product-service"
$env:MONGO_URI_INVENTORY = "mongodb://localhost:27017/inventory-service"
$env:MONGO_URI_AUTH = "mongodb://localhost:27017/auth-service"
$env:MONGO_URI_ORDER = "mongodb://localhost:27017/order-service"

# Generic MONGO_URI for services that use it
$env:MONGO_URI = "mongodb://localhost:27017"

# Redis Configuration
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6379"

# Kafka Configuration
$env:KAFKA_BROKERS = "localhost:9092"
$env:KAFKA_BROKER = "localhost:9092"

# Elasticsearch Configuration
$env:ELASTICSEARCH_NODE = "http://localhost:9200"

# Service Ports
$env:PORT_USER = "3001"
$env:PORT_PRODUCT = "3002"
$env:PORT_INVENTORY = "3003"
$env:PORT_AUTH = "4000"
$env:PORT_ORDER = "5003"

# Auth Service Configuration
$env:JWT_ISS = "http://localhost:4000"

# Environment
$env:NODE_ENV = "development"

Write-Host "Environment variables loaded from config.env.ps1" -ForegroundColor Green

