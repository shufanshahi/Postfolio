#!/bin/bash

echo "Stopping all Postfolio services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to stop service
stop_service() {
    local service_name=$1
    local pid_file="logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        echo -e "${YELLOW}Stopping $service_name (PID: $pid)...${NC}"
        
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            sleep 2
            if kill -0 "$pid" 2>/dev/null; then
                echo -e "${RED}Force killing $service_name...${NC}"
                kill -9 "$pid"
            fi
            echo -e "${GREEN}$service_name stopped${NC}"
        else
            echo -e "${YELLOW}$service_name was not running${NC}"
        fi
        
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}No PID file found for $service_name${NC}"
    fi
}

# Stop services in reverse order
stop_service "ai-service"
stop_service "postfolio-backend"
stop_service "api-gateway"
stop_service "eureka-server"

echo -e "${GREEN}All services stopped!${NC}"

# Clean up any remaining Spring Boot processes (be careful with this)
echo -e "${YELLOW}Cleaning up any remaining Spring Boot processes...${NC}"
pkill -f "spring-boot:run" 2>/dev/null || true

echo -e "${GREEN}Done!${NC}"