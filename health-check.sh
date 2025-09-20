#!/bin/bash

# Postfolio Backend Services - Health Check

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_service() {
    local service_name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo -n "Checking $service_name... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✓ Healthy${NC}"
        return 0
    else
        echo -e "${RED}✗ Unhealthy${NC}"
        return 1
    fi
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Postfolio Services Health Check${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if Docker services are running
print_status "Checking Docker services status..."
docker-compose ps

echo ""
print_status "Checking service endpoints..."

# Infrastructure services
echo "Infrastructure Services:"
if nc -z localhost 5432 2>/dev/null; then
    echo -e "  PostgreSQL: ${GREEN}✓ Running${NC}"
else
    echo -e "  PostgreSQL: ${RED}✗ Not running${NC}"
fi

if nc -z localhost 6379 2>/dev/null; then
    echo -e "  Redis: ${GREEN}✓ Running${NC}"
else
    echo -e "  Redis: ${RED}✗ Not running${NC}"
fi

if nc -z localhost 5672 2>/dev/null; then
    echo -e "  RabbitMQ: ${GREEN}✓ Running${NC}"
else
    echo -e "  RabbitMQ: ${RED}✗ Not running${NC}"
fi

echo ""
echo "Application Services:"

# Application services health endpoints
check_service "Eureka Server" "http://localhost:8761/actuator/health" "200"
check_service "Main Backend" "http://localhost:8082/actuator/health" "200"
check_service "AI Service" "http://localhost:8081/actuator/health" "200"
check_service "API Gateway" "http://localhost:8080/actuator/health" "200"
check_service "Stripe Service" "http://localhost:9991/actuator/health" "200"

echo ""
print_status "Health check completed."
echo ""
echo -e "Service URLs:"
echo -e "  • Eureka Dashboard: ${BLUE}http://localhost:8761${NC}"
echo -e "  • API Gateway: ${BLUE}http://localhost:8080${NC}"
echo -e "  • Main Backend: ${BLUE}http://localhost:8082${NC}"
echo -e "  • AI Service: ${BLUE}http://localhost:8081${NC}"
echo -e "  • Stripe Service: ${BLUE}http://localhost:9991${NC}"
echo -e "  • RabbitMQ Management: ${BLUE}http://localhost:15672${NC}"