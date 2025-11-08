#!/bin/bash
# Common Environment Configuration for All Microservices
# Source this file in your bash scripts: source config.env.sh

# Local MongoDB Connection (Docker)
export MONGODB_BASE_URI="mongodb://localhost:27017"

# Service-specific MongoDB URIs
export MONGO_URI_USER="mongodb://localhost:27017/user-service"
export MONGO_URI_PRODUCT="mongodb://localhost:27017/product-service"
export MONGO_URI_INVENTORY="mongodb://localhost:27017/inventory-service"
export MONGO_URI_AUTH="mongodb://localhost:27017/auth-service"
export MONGO_URI_ORDER="mongodb://localhost:27017/order-service"

# Generic MONGO_URI for services that use it
export MONGO_URI="mongodb://localhost:27017"

# Redis Configuration
export REDIS_HOST="localhost"
export REDIS_PORT="6379"

# Kafka Configuration
export KAFKA_BROKERS="localhost:9092"
export KAFKA_BROKER="localhost:9092"

# Elasticsearch Configuration
export ELASTICSEARCH_NODE="http://localhost:9200"

# Service Ports
export PORT_USER="3001"
export PORT_PRODUCT="3002"
export PORT_INVENTORY="3003"
export PORT_AUTH="4000"
export PORT_ORDER="5003"
export PORT_CLIENT="3000"
# Auth Service Configuration
export JWT_ISS="http://localhost:4000"

# Environment
export NODE_ENV="development"

echo "✓ Environment variables loaded from config.env.sh"

