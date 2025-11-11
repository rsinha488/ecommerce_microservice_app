#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}E-Commerce Microservices End-to-End Test${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Test 1: Check all services are running
echo -e "${YELLOW}[Test 1] Checking Docker services...${NC}"
SERVICES=("ecom-mongo" "ecom-redis" "ecom-kafka" "ecom-auth-service" "ecom-product-service" "ecom-gateway" "ecom-realtime-service" "ecom-client")

all_running=true
for service in "${SERVICES[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${service}$"; then
        echo -e "${GREEN}✓${NC} $service is running"
    else
        echo -e "${RED}✗${NC} $service is NOT running"
        all_running=false
    fi
done

if [ "$all_running" = false ]; then
    echo -e "${RED}Some services are not running. Start them with: docker-compose up -d${NC}"
    exit 1
fi
echo ""

# Test 2: Check Gateway health
echo -e "${YELLOW}[Test 2] Checking Gateway health...${NC}"
health_response=$(curl -s http://localhost:3008/health)
if echo "$health_response" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓${NC} Gateway is healthy"
else
    echo -e "${RED}✗${NC} Gateway health check failed"
    echo "Response: $health_response"
fi
echo ""

# Test 3: Check Redis connectivity
echo -e "${YELLOW}[Test 3] Checking Redis connectivity...${NC}"
redis_ping=$(docker exec ecom-redis redis-cli ping 2>&1)
if [ "$redis_ping" = "PONG" ]; then
    echo -e "${GREEN}✓${NC} Redis is responding"
else
    echo -e "${RED}✗${NC} Redis connectivity failed"
fi
echo ""

# Test 4: Test user login
echo -e "${YELLOW}[Test 4] Testing user login...${NC}"
login_response=$(curl -s -X POST http://localhost:3008/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ruchi@yopmail.com","password":"Hrhk@123"}')

if echo "$login_response" | grep -q '"success":true'; then
    session_id=$(echo "$login_response" | grep -o '"session_id":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✓${NC} Login successful"
    echo "  Session ID: ${session_id:0:20}..."
else
    echo -e "${RED}✗${NC} Login failed"
    echo "Response: $login_response"
fi
echo ""

# Test 5: Test caching (first request)
echo -e "${YELLOW}[Test 5] Testing Redis caching...${NC}"
echo "First request (should be MISS):"
cache_status_1=$(curl -s -I http://localhost:3008/product/products 2>&1 | grep -i "x-cache-status" || echo "Header not found")
echo "  $cache_status_1"

sleep 1

echo "Second request (should be HIT):"
cache_status_2=$(curl -s -I http://localhost:3008/product/products 2>&1 | grep -i "x-cache-status" || echo "Header not found")
echo "  $cache_status_2"

if echo "$cache_status_2" | grep -qi "HIT"; then
    echo -e "${GREEN}✓${NC} Caching is working"
else
    echo -e "${YELLOW}⚠${NC} Caching might not be enabled or header not present"
fi
echo ""

# Test 6: Check detailed health (all services)
echo -e "${YELLOW}[Test 6] Checking detailed system health...${NC}"
detailed_health=$(curl -s http://localhost:3008/health/detailed)

# Check Redis
if echo "$detailed_health" | grep -q '"redis".*"status":"up"'; then
    echo -e "${GREEN}✓${NC} Redis health: UP"
else
    echo -e "${RED}✗${NC} Redis health: DOWN"
fi

# Check Auth Service
if echo "$detailed_health" | grep -q '"auth".*"status":"up"'; then
    echo -e "${GREEN}✓${NC} Auth Service health: UP"
else
    echo -e "${YELLOW}⚠${NC} Auth Service health: Unknown"
fi

# Check Product Service
if echo "$detailed_health" | grep -q '"product".*"status":"up"'; then
    echo -e "${GREEN}✓${NC} Product Service health: UP"
else
    echo -e "${YELLOW}⚠${NC} Product Service health: Unknown"
fi
echo ""

# Test 7: Check WebSocket service
echo -e "${YELLOW}[Test 7] Checking WebSocket service...${NC}"
ws_health=$(curl -s http://localhost:3009/health)
if echo "$ws_health" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓${NC} WebSocket service is healthy"
else
    echo -e "${RED}✗${NC} WebSocket service health check failed"
fi
echo ""

# Test 8: Check Kafka
echo -e "${YELLOW}[Test 8] Checking Kafka...${NC}"
kafka_topics=$(docker exec ecom-kafka kafka-topics --bootstrap-server localhost:9092 --list 2>&1 | grep -E "product|order|inventory" || echo "No topics found")
if echo "$kafka_topics" | grep -q "product.events"; then
    echo -e "${GREEN}✓${NC} Kafka topics found:"
    echo "$kafka_topics" | sed 's/^/  /'
else
    echo -e "${YELLOW}⚠${NC} No Kafka topics found (they will be created on first use)"
fi
echo ""

# Test 9: Test product listing
echo -e "${YELLOW}[Test 9] Testing product API...${NC}"
products=$(curl -s http://localhost:3008/product/products)
product_count=$(echo "$products" | grep -o '"_id"' | wc -l)
echo -e "${GREEN}✓${NC} Product API responded with $product_count products"
echo ""

# Test 10: Check client is accessible
echo -e "${YELLOW}[Test 10] Checking client application...${NC}"
client_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$client_response" = "200" ]; then
    echo -e "${GREEN}✓${NC} Client application is accessible at http://localhost:3000"
else
    echo -e "${RED}✗${NC} Client application returned status: $client_response"
fi
echo ""

# Summary
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test Summary${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Access points:"
echo -e "  ${GREEN}•${NC} Client:          http://localhost:3000"
echo -e "  ${GREEN}•${NC} Gateway:         http://localhost:3008"
echo -e "  ${GREEN}•${NC} Auth Swagger:    http://localhost:4000/api"
echo -e "  ${GREEN}•${NC} Product Swagger: http://localhost:3002/api"
echo -e "  ${GREEN}•${NC} Kafka UI:        http://localhost:8080"
echo -e "  ${GREEN}•${NC} System Health:   http://localhost:3008/health/detailed"
echo ""
echo -e "${GREEN}All tests completed!${NC}"
echo ""
echo "To test WebSocket in browser:"
echo "1. Open http://localhost:3000"
echo "2. Login with email: ruchi@yopmail.com, password: Hrhk@123"
echo "3. Open browser console to see WebSocket connection logs"
echo "4. Navigate through the app to see real-time updates"
