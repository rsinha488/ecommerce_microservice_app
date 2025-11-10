#!/bin/bash

# ============================================
# Start Infrastructure Only (for Local Dev)
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo ""
log_info "=========================================="
log_info "  Starting Infrastructure Services Only"
log_info "=========================================="
echo ""

log_info "This will start:"
echo "  - MongoDB (27017)"
echo "  - Redis (6379)"
echo "  - Zookeeper (2181)"
echo "  - Kafka (9092, 29092)"
echo "  - Kafka UI (8080)"
echo ""
log_warning "Microservices will NOT be started."
log_info "Use this for local development of individual services."
echo ""

# Clean up any existing infrastructure containers
log_warning "Stopping any existing infrastructure containers..."
docker-compose stop mongo redis zookeeper kafka kafka-ui 2>/dev/null || true

log_info "Starting infrastructure services..."
docker-compose up -d mongo redis zookeeper kafka kafka-ui

log_info "Waiting for services to be healthy..."
sleep 15

echo ""
log_success "=========================================="
log_success "  Infrastructure Started!"
log_success "=========================================="
echo ""

log_info "Available Services:"
echo "  MongoDB:   mongodb://localhost:27017"
echo "  Redis:     redis://localhost:6379"
echo "  Kafka:     localhost:9092"
echo "  Kafka UI:  http://localhost:8080"
echo ""

log_info "You can now start individual microservices:"
echo "  cd services/auth && ./start-dev.sh"
echo "  cd services/product && ./start-dev.sh"
echo "  cd services/user && ./start-dev.sh"
echo "  cd services/inventory && ./start-dev.sh"
echo "  cd services/order && ./start-dev.sh"
echo "  cd services/gateway && ./start-dev.sh"
echo "  cd client && ./start-dev.sh"
echo ""

log_info "To stop infrastructure:"
echo "  docker-compose stop mongo redis zookeeper kafka kafka-ui"
echo ""
