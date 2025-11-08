#!/bin/bash
# Check if Docker is Running
# Usage: ./check-docker.sh

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m'

echo -e "${CYAN}Checking Docker status...${NC}"
echo ""

max_attempts=30
attempt=0
docker_ready=false

while [ $attempt -lt $max_attempts ] && [ "$docker_ready" = false ]; do
    ((attempt++))
    
    if docker ps &> /dev/null; then
        docker_ready=true
        echo -e "${GREEN}✓ Docker is running and ready!${NC}"
        echo ""
        
        # Show Docker info
        echo -e "${CYAN}Docker Information:${NC}"
        docker version --format "  Docker Version: {{.Server.Version}}"
        echo ""
        
        # Show running containers
        echo -e "${CYAN}Running Containers:${NC}"
        if [ "$(docker ps -q)" ]; then
            docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        else
            echo -e "  ${GRAY}No containers running${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}✓ You can now run: ./start-all-services.sh${NC}"
        exit 0
    fi
    
    if [ $attempt -eq 1 ]; then
        echo -e "${YELLOW}Docker is not running or still starting up...${NC}"
        echo ""
        echo -e "${YELLOW}Please ensure Docker is running:${NC}"
        echo -e "  ${GRAY}• Linux: sudo systemctl start docker${NC}"
        echo -e "  ${GRAY}• Mac: Open Docker Desktop from Applications${NC}"
        echo -e "  ${GRAY}• WSL: Make sure Docker Desktop WSL integration is enabled${NC}"
        echo ""
        echo -e "${YELLOW}Waiting for Docker to start... (attempt $attempt of $max_attempts)${NC}"
    else
        echo -e "${GRAY}Still waiting... (attempt $attempt of $max_attempts)${NC}"
    fi
    
    sleep 2
done

if [ "$docker_ready" = false ]; then
    echo ""
    echo -e "${RED}✗ Docker is not running after $max_attempts attempts.${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting Steps:${NC}"
    echo -e "  1. ${NC}Start Docker manually${NC}"
    echo -e "  2. ${NC}Check Docker service: sudo systemctl status docker${NC}"
    echo -e "  3. ${NC}Start Docker service: sudo systemctl start docker${NC}"
    echo -e "  4. ${NC}Check Docker Desktop (Mac/Windows/WSL)${NC}"
    echo ""
    exit 1
fi
