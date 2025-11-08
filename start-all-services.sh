#!/bin/bash
# Bash Script to Start All E-commerce Microservices

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m'

echo -e "${CYAN}=====================================${NC}"
echo -e "${CYAN}E-commerce Microservices Starter${NC}"
echo -e "${CYAN}=====================================${NC}"
echo ""

# Load environment configuration
echo -e "${YELLOW}Loading environment configuration...${NC}"
if [ -f "./config.env.sh" ]; then
    source ./config.env.sh
else
    echo -e "${YELLOW}Warning: config.env.sh not found, using default values${NC}"
fi

# Check if Docker is running
echo ""
echo -e "${YELLOW}Checking Docker status...${NC}"
if ! docker ps &> /dev/null; then
    echo -e "${RED}Docker is not running. Please start Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}Docker is running${NC}"

# Start infrastructure services
echo ""
echo -e "${YELLOW}Starting infrastructure services...${NC}"
echo -e "${GRAY}Redis, Kafka, Zookeeper...${NC}"
cd services/inventory
docker-compose up -d
cd ../..

echo -e "${GREEN}Infrastructure services started${NC}"
echo -e "${GRAY}  - Redis: localhost:6379${NC}"
echo -e "${GRAY}  - Kafka: localhost:9092${NC}"
echo -e "${GRAY}  - Kafka UI: http://localhost:8080${NC}"
echo ""
echo -e "${CYAN}Using MongoDB Atlas (cloud database)${NC}"
echo -e "${GRAY}  - Connection: cluster0.ejp03r8.mongodb.net${NC}"
echo ""
echo -e "${YELLOW}Waiting 10 seconds for services to initialize...${NC}"
sleep 10

# Create logs directory
mkdir -p logs

echo ""
echo -e "${YELLOW}Starting microservices...${NC}"
echo -e "${GRAY}Check logs/ directory for service outputs${NC}"
echo ""

# Function to start a service
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    shift 3
    local env_vars=("$@")
    
    echo -e "${CYAN}Starting $service_name on port $port...${NC}"
    
    cd "$service_path"
    
    # Export environment variables and start service in background
    (
        for env_var in "${env_vars[@]}"; do
            export $env_var
        done
        npm run start:dev > "../../logs/${service_name// /-}.log" 2>&1 &
        echo $! > "../../logs/${service_name// /-}.pid"
    )
    
    cd - > /dev/null
    echo -e "${GREEN}$service_name started (PID: $(cat logs/${service_name// /-}.pid))${NC}"
}

# Start Order Service
start_service "Order Service" "services/order" $PORT_ORDER \
    "MONGO_URI=$MONGO_URI_ORDER" \
    "PORT=$PORT_ORDER"

sleep 2

# Start Product Service
start_service "Product Service" "services/product" $PORT_PRODUCT \
    "MONGO_URI=$MONGO_URI_PRODUCT" \
    "PORT=$PORT_PRODUCT" \
    "KAFKA_BROKERS=$KAFKA_BROKERS" \
    "ELASTICSEARCH_NODE=$ELASTICSEARCH_NODE"

sleep 2

# Start Inventory Service
start_service "Inventory Service" "services/inventory" $PORT_INVENTORY \
    "MONGO_URI=$MONGO_URI_INVENTORY" \
    "PORT=$PORT_INVENTORY" \
    "KAFKA_BROKER=$KAFKA_BROKER" \
    "REDIS_HOST=$REDIS_HOST"

sleep 2

# Start Auth Service
start_service "Auth Service" "services/auth" $PORT_AUTH \
    "MONGO_URI=$MONGO_URI_AUTH" \
    "AUTH_PORT=$PORT_AUTH" \
    "REDIS_HOST=$REDIS_HOST" \
    "JWT_ISS=$JWT_ISS"

sleep 2

# Start User Service
start_service "User Service" "services/user" $PORT_USER \
    "MONGO_URI=$MONGO_URI_USER" \
    "PORT=$PORT_USER" \
    "REDIS_HOST=$REDIS_HOST"

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}All services are starting!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${CYAN}Database: MongoDB Atlas (Cloud)${NC}"
echo -e "${GRAY}  cluster0.ejp03r8.mongodb.net${NC}"
echo ""
echo -e "${CYAN}Access Points:${NC}"
echo -e "  ${NC}Order API: http://localhost:$PORT_ORDER/docs${NC}"
echo -e "  ${NC}Product API: http://localhost:$PORT_PRODUCT/api${NC}"
echo -e "  ${NC}Inventory API: http://localhost:$PORT_INVENTORY/api${NC}"
echo -e "  ${NC}Auth OIDC: http://localhost:$PORT_AUTH/.well-known/openid-configuration${NC}"
echo -e "  ${NC}User API: http://localhost:$PORT_USER/users${NC}"
echo -e "  ${NC}Kafka UI: http://localhost:8080${NC}"
echo ""
echo -e "${CYAN}Service Logs:${NC}"
echo -e "  ${GRAY}View logs in the 'logs/' directory${NC}"
echo -e "  ${GRAY}Tail logs: tail -f logs/Order-Service.log${NC}"
echo ""
echo -e "${YELLOW}To stop all services:${NC}"
echo -e "  ${GRAY}Run: ./stop-all-services.sh${NC}"
echo ""
echo -e "${YELLOW}To change MongoDB URI:${NC}"
echo -e "  ${GRAY}Edit config.env.sh${NC}"
echo ""
