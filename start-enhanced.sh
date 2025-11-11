#!/bin/bash

# ============================================
# E-Commerce Microservices Startup Script
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# Step 1: Safe Docker Cleanup (Preserving Data)
# ============================================
log_info "Starting E-commerce Microservices Platform..."
echo ""

log_warning "Stopping all running containers (preserving data volumes)..."
docker-compose down 2>/dev/null || true

# ⚠️ IMPORTANT: Removed --volumes flag to preserve database data
# Only remove orphaned containers, keep volumes intact
log_warning "Removing orphaned containers (keeping volumes for data persistence)..."
docker-compose down --remove-orphans 2>/dev/null || true

log_warning "Cleaning up Docker system (unused images, containers, networks only)..."
# Only prune images and containers, NOT volumes
docker system prune -f

log_success "Docker cleanup completed (MongoDB and Redis data preserved)"
echo ""

# ============================================
# Step 2: Check Docker Resources
# ============================================
log_info "Checking Docker resources..."

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

log_success "Docker daemon is running"
echo ""

# ============================================
# Step 2.5: Check Existing Volumes
# ============================================
log_info "Checking existing data volumes..."
if docker volume ls | grep -q "mongo_data"; then
    log_success "MongoDB volume exists - your database data will be preserved"
else
    log_warning "MongoDB volume not found - this appears to be a fresh install"
fi

if docker volume ls | grep -q "redis_data"; then
    log_success "Redis volume exists - your session data will be preserved"
else
    log_warning "Redis volume not found - will be created on first start"
fi
echo ""

# ============================================
# Step 3: Build and Start Services
# ============================================
log_info "Building and starting all services..."
echo ""

# Build images using cache for faster subsequent builds
# Remove --no-cache flag to speed up builds significantly
log_info "Building Docker images (using cache for faster builds)..."
docker-compose build

log_info "Starting infrastructure services (MongoDB, Redis, Kafka)..."
docker-compose up -d mongo redis zookeeper kafka

log_info "Waiting for infrastructure services to be healthy..."
sleep 20

# Check infrastructure health
log_info "Checking infrastructure health..."
docker-compose ps mongo redis kafka zookeeper

log_info "Starting microservices..."
docker-compose up -d auth-service user-service product-service inventory-service order-service

log_info "Waiting for microservices to be ready..."
sleep 15

log_info "Starting API Gateway..."
docker-compose up -d gateway

log_info "Waiting for gateway to be healthy..."
sleep 10

log_info "Starting Real-Time WebSocket service..."
docker-compose up -d realtime-service

log_info "Waiting for real-time service to be healthy..."
sleep 10

log_info "Starting client application..."
docker-compose up -d client

log_info "Starting Kafka UI..."
docker-compose up -d kafka-ui

log_success "All services started successfully!"
echo ""

# ============================================
# Step 4: Health Check
# ============================================
log_info "Performing health checks..."
echo ""

sleep 5

# Show running containers
log_info "Running containers:"
docker-compose ps

echo ""
log_info "Checking service logs for errors (last 10 lines each)..."
for service in mongo redis kafka auth-service user-service product-service inventory-service order-service realtime-service gateway client; do
    echo ""
    log_info "=== $service logs ==="
    docker-compose logs --tail=10 $service 2>&1 | tail -10 || log_warning "$service logs unavailable"
done

echo ""
echo ""

# ============================================
# Step 5: Display Service URLs
# ============================================
log_success "=========================================="
log_success "  E-Commerce Platform Started! "
log_success "=========================================="
echo ""
log_info "Service URLs:"
echo ""
echo -e "  ${GREEN}Infrastructure:${NC}"
echo -e "    MongoDB:      mongodb://localhost:27017"
echo -e "    Redis:        redis://localhost:6379"
echo -e "    Kafka:        localhost:9092"
echo -e "    Kafka UI:     http://localhost:8080"
echo ""
echo -e "  ${GREEN}Microservices:${NC}"
echo -e "    Auth:         http://localhost:4000"
echo -e "    User:         http://localhost:3001"
echo -e "    Product:      http://localhost:3002"
echo -e "    Inventory:    http://localhost:3003"
echo -e "    Order:        http://localhost:5003"
echo -e "    Real-Time:    http://localhost:3009"
echo ""
echo -e "  ${GREEN}Gateway & Client:${NC}"
echo -e "    API Gateway:  http://localhost:3008"
echo -e "    Client (Web): http://localhost:3000"
echo ""
echo -e "  ${GREEN}Documentation & Monitoring:${NC}"
echo -e "    Real-Time API Docs: http://localhost:3009/api/docs"
echo -e "    WebSocket Server:   ws://localhost:3009"
echo ""
log_success "=========================================="
echo ""
log_info "Database data persistence:"
echo -e "  ${GREEN}✓${NC} MongoDB data saved in: mongo_data volume"
echo -e "  ${GREEN}✓${NC} Redis data saved in:   redis_data volume"
echo -e "  ${YELLOW}⚠${NC}  Your data will persist across restarts"
echo ""
log_warning "To completely reset database (DELETE ALL DATA):"
echo "  docker-compose down -v"
echo ""
log_info "Useful commands:"
echo "  View logs:       docker-compose logs -f [service-name]"
echo "  Stop (safe):     docker-compose down"
echo "  Stop + delete:   docker-compose down -v  ${YELLOW}(⚠️ DELETES ALL DATA)${NC}"
echo "  Restart service: docker-compose restart [service-name]"
echo "  Check status:    docker-compose ps"
echo "  Check volumes:   docker volume ls"
echo ""

# ============================================
# Step 6: Follow Logs (Optional)
# ============================================
read -p "Do you want to follow the logs? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Following logs (Ctrl+C to exit)..."
    docker-compose logs -f
fi
