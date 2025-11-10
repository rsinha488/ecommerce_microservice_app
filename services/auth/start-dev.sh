#!/bin/bash

# Auth Service Development Startup Script

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting Auth Service (Development Mode)...${NC}"

# Check if running in Docker or local
if [ -f "/.dockerenv" ]; then
    echo "Running in Docker container"
else
    echo "Running locally"

    # Check for required dependencies
    echo -e "${YELLOW}Checking dependencies...${NC}"

    # Check MongoDB
    if ! nc -z localhost 27017 2>/dev/null; then
        echo -e "${YELLOW}Warning: MongoDB not running on localhost:27017${NC}"
        echo "Start MongoDB with: docker run -d -p 27017:27017 mongo:7"
    fi

    # Check Redis
    if ! nc -z localhost 6379 2>/dev/null; then
        echo -e "${YELLOW}Warning: Redis not running on localhost:6379${NC}"
        echo "Start Redis with: docker run -d -p 6379:6379 redis:7"
    fi

    # Check Kafka
    if ! nc -z localhost 9092 2>/dev/null; then
        echo -e "${YELLOW}Warning: Kafka not running on localhost:9092${NC}"
        echo "You may need to start Kafka with docker-compose"
    fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pnpm install
fi

# Build if dist doesn't exist
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}Building project...${NC}"
    pnpm run build
fi

echo -e "${GREEN}Starting Auth Service on http://localhost:4000${NC}"
echo ""

# Start in development mode
pnpm run start:dev
