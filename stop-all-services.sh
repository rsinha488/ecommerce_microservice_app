#!/bin/bash
# Bash Script to Stop All E-commerce Microservices
# Usage: ./stop-all-services.sh

# Colors for output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================${NC}"
echo -e "${CYAN}Stopping E-commerce Microservices${NC}"
echo -e "${CYAN}=====================================${NC}"
echo ""

# Stop services using PID files
if [ -d "logs" ]; then
    echo -e "${YELLOW}Stopping microservices...${NC}"
    
    for pidfile in logs/*.pid; do
        if [ -f "$pidfile" ]; then
            service_name=$(basename "$pidfile" .pid)
            pid=$(cat "$pidfile")
            
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${GRAY}  Stopping $service_name (PID: $pid)...${NC}"
                kill $pid 2>/dev/null
                sleep 1
                
                # Force kill if still running
                if ps -p $pid > /dev/null 2>&1; then
                    kill -9 $pid 2>/dev/null
                fi
                
                echo -e "${GREEN}  ✓ $service_name stopped${NC}"
            fi
            
            rm "$pidfile"
        fi
    done
fi

# Stop Docker containers
echo ""
echo -e "${YELLOW}Stopping infrastructure services...${NC}"
cd services/inventory
docker-compose down
cd ../..

echo -e "${GREEN}✓ Infrastructure services stopped${NC}"

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}All services stopped!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""


