#!/bin/bash

# Client (Next.js) Development Startup Script

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting Client Application (Development Mode)...${NC}"

# Check if running in Docker or local
if [ -f "/.dockerenv" ]; then
    echo "Running in Docker container"
else
    echo "Running locally"

    # Check for API Gateway
    echo -e "${YELLOW}Checking API Gateway...${NC}"

    if ! nc -z localhost 3008 2>/dev/null; then
        echo -e "${YELLOW}Warning: API Gateway not running on localhost:3008${NC}"
        echo "The client needs the gateway to function properly."
    else
        echo -e "${GREEN}✓ API Gateway is running${NC}"
    fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install --legacy-peer-deps
fi

echo -e "${GREEN}Starting Next.js Client on http://localhost:3000${NC}"
echo ""

# Start in development mode
npm run dev
