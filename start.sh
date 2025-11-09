#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting E-commerce Microservices...${NC}"

# Stop any running containers
echo -e "${YELLOW}Stopping any existing containers...${NC}"
docker-compose down

# Start all services
echo -e "${YELLOW}Starting all services...${NC}"
docker-compose up --build -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check service health
echo -e "${GREEN}Services started on:${NC}"
echo -e "Auth Service: http://localhost:4000"
echo -e "User Service: http://localhost:3001"
echo -e "Product Service: http://localhost:3002"
echo -e "Inventory Service: http://localhost:3003"
echo -e "Order Service: http://localhost:5003"
echo -e "Kafka UI: http://localhost:8080"
# echo -e "Client (Next.js):   http://localhost:3000"

# Show logs
echo -e "${YELLOW}Showing logs...${NC}"
docker-compose logs -f
