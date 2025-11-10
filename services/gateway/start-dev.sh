#!/bin/bash

# Gateway Service Development Startup Script

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting API Gateway (Development Mode)...${NC}"

# Check if running in Docker or local
if [ -f "/.dockerenv" ]; then
    echo "Running in Docker container"
else
    echo "Running locally"

    # Check for required services
    echo -e "${YELLOW}Checking downstream services...${NC}"

    services=("4000:Auth" "3001:User" "3002:Product" "3003:Inventory" "5003:Order")

    for service_info in "${services[@]}"; do
        IFS=':' read -r port name <<< "$service_info"
        if ! nc -z localhost $port 2>/dev/null; then
            echo -e "${YELLOW}Warning: $name Service not running on localhost:$port${NC}"
        else
            echo -e "${GREEN}✓ $name Service is running${NC}"
        fi
    done
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Build if dist doesn't exist
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}Building project...${NC}"
    npm run build
fi

echo -e "${GREEN}Starting API Gateway on http://localhost:3008${NC}"
echo ""

# Start in development mode
npm run start:dev
