#!/bin/bash

# ============================================
# E-Commerce Microservices Status Checker
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}=========================================="
echo -e "  E-Commerce Platform Status"
echo -e "==========================================${NC}"
echo ""

# Check Docker
echo -e "${YELLOW}Docker Daemon:${NC}"
if docker info > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Running"
else
    echo -e "  ${RED}✗${NC} Not running"
    exit 1
fi
echo ""

# Container Status
echo -e "${YELLOW}Container Status:${NC}"
docker-compose ps
echo ""

# Check service health
echo -e "${YELLOW}Service Health Checks:${NC}"

check_service() {
    local url=$1
    local name=$2

    if curl -sf "$url" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} $name - UP"
        return 0
    else
        echo -e "  ${RED}✗${NC} $name - DOWN"
        return 1
    fi
}

# Infrastructure
echo -e "${BLUE}Infrastructure:${NC}"
check_service "http://localhost:8080" "Kafka UI"

# Microservices
echo -e "${BLUE}Microservices:${NC}"
check_service "http://localhost:4000" "Auth Service"
check_service "http://localhost:3001" "User Service"
check_service "http://localhost:3002" "Product Service"
check_service "http://localhost:3003" "Inventory Service"
check_service "http://localhost:5003" "Order Service"

# Gateway & Client
echo -e "${BLUE}Gateway & Client:${NC}"
check_service "http://localhost:3008" "API Gateway"
check_service "http://localhost:3000" "Client App"

echo ""

# Resource usage
echo -e "${YELLOW}Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep "ecom-" || echo "No containers running"

echo ""
echo -e "${BLUE}==========================================${NC}"
echo ""

# Quick help
echo -e "${YELLOW}Quick Commands:${NC}"
echo "  View logs:    docker-compose logs -f [service-name]"
echo "  Restart:      docker-compose restart [service-name]"
echo "  Stop all:     ./stop-enhanced.sh"
echo "  Start all:    ./start-enhanced.sh"
echo ""
