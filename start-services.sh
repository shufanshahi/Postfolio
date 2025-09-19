#!/bin/bash

echo "Starting Postfolio with API Gateway and Eureka..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to start service in background
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    
    echo -e "${YELLOW}Starting $service_name on port $port...${NC}"
    cd "$service_path"
    ./mvnw spring-boot:run > "../logs/${service_name}.log" 2>&1 &
    local pid=$!
    echo "$pid" > "../logs/${service_name}.pid"
    echo -e "${GREEN}$service_name started with PID $pid${NC}"
    cd - > /dev/null
}

# Create logs directory
mkdir -p logs

echo -e "${GREEN}=== Starting Postfolio Microservices ===${NC}"

# Start Eureka Server first
start_service "eureka-server" "eureka-server" "8761"
echo "Waiting for Eureka Server to start..."
sleep 15

# Start API Gateway
start_service "api-gateway" "api-gateway" "8080"
echo "Waiting for API Gateway to start..."
sleep 10

# Start Backend Service
start_service "postfolio-backend" "server" "8082"
echo "Waiting for Backend Service to start..."
sleep 10

# Start AI Service
start_service "ai-service" "ai-service" "8081"
echo "Waiting for AI Service to start..."
sleep 5

echo -e "${GREEN}=== All services started! ===${NC}"
echo ""
echo -e "${YELLOW}Service URLs:${NC}"
echo "• Eureka Dashboard: http://localhost:8761"
echo "• API Gateway: http://localhost:8080"
echo "• Backend Service: http://localhost:8082"
echo "• AI Service: http://localhost:8081"
echo ""
echo -e "${YELLOW}Frontend:${NC}"
echo "• Start frontend with: cd client && npm run dev"
echo "• Frontend URL: http://localhost:3000"
echo ""
echo -e "${YELLOW}Logs are available in the 'logs' directory${NC}"
echo ""
echo "To stop all services, run: ./stop-services.sh"