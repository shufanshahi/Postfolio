#!/bin/bash

# Postfolio Docker Setup Test Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

# Test 1: Docker Installation
print_header "1. Testing Docker Installation"
print_test "Checking Docker version..."
if docker --version > /dev/null 2>&1; then
    print_status "Docker is installed: $(docker --version)"
else
    print_error "Docker is not installed or not running"
    exit 1
fi

print_test "Checking Docker Compose version..."
if docker-compose --version > /dev/null 2>&1; then
    print_status "Docker Compose is installed: $(docker-compose --version)"
else
    print_error "Docker Compose is not installed"
    exit 1
fi

print_test "Checking Docker daemon status..."
if docker info > /dev/null 2>&1; then
    print_status "Docker daemon is running"
else
    print_error "Docker daemon is not running. Please start Docker service."
    exit 1
fi

# Test 2: Port Availability
print_header "2. Testing Port Availability"
check_port() {
    local port=$1
    local service=$2
    
    print_test "Checking if port $port is available for $service..."
    if nc -z localhost $port 2>/dev/null; then
        print_warning "Port $port is already in use (might conflict with $service)"
        return 1
    else
        print_status "Port $port is available for $service"
        return 0
    fi
}

check_port 8080 "API Gateway"
check_port 8081 "AI Service"
check_port 8082 "Main Backend"
check_port 8761 "Eureka Server"
check_port 5432 "PostgreSQL"
check_port 6379 "Redis"
check_port 5672 "RabbitMQ"
check_port 9991 "Stripe Service"
check_port 15672 "RabbitMQ Management"

# Test 3: Configuration Files
print_header "3. Testing Configuration Files"
print_test "Checking docker-compose.yml..."
if [ -f "docker-compose.yml" ]; then
    print_status "docker-compose.yml exists"
    if docker-compose config > /dev/null 2>&1; then
        print_status "docker-compose.yml is valid"
    else
        print_error "docker-compose.yml has syntax errors"
        docker-compose config
        exit 1
    fi
else
    print_error "docker-compose.yml not found"
    exit 1
fi

print_test "Checking .env file..."
if [ -f ".env" ]; then
    print_status ".env file exists"
    # Check for critical environment variables
    if grep -q "GEMINI_API_KEY=" .env; then
        print_status "GEMINI_API_KEY found in .env"
    else
        print_warning "GEMINI_API_KEY not found in .env"
    fi
    
    if grep -q "STRIPE_SECRET_KEY=" .env; then
        print_status "STRIPE_SECRET_KEY found in .env"
    else
        print_warning "STRIPE_SECRET_KEY not found in .env"
    fi
else
    print_warning ".env file not found (will use defaults)"
fi

# Test 4: Dockerfile Validation
print_header "4. Testing Dockerfiles"
services=("eureka-server" "api-gateway" "server" "ai-service" "stripe")

for service in "${services[@]}"; do
    print_test "Checking Dockerfile for $service..."
    if [ -f "$service/Dockerfile" ]; then
        print_status "Dockerfile exists for $service"
    else
        print_error "Dockerfile missing for $service"
        exit 1
    fi
done

# Test 5: Quick Infrastructure Test
print_header "5. Testing Basic Infrastructure Services"
print_test "Starting PostgreSQL, Redis, and RabbitMQ for quick test..."

# Start only infrastructure services
docker-compose up -d postgres redis rabbitmq

# Wait a bit for services to start
print_test "Waiting 30 seconds for services to initialize..."
sleep 30

# Check if services are running
print_test "Checking service status..."
if docker-compose ps | grep -q "postgres.*Up"; then
    print_status "PostgreSQL is running"
else
    print_error "PostgreSQL failed to start"
fi

if docker-compose ps | grep -q "redis.*Up"; then
    print_status "Redis is running"
else
    print_error "Redis failed to start"
fi

if docker-compose ps | grep -q "rabbitmq.*Up"; then
    print_status "RabbitMQ is running"
else
    print_error "RabbitMQ failed to start"
fi

# Test connections
print_test "Testing database connection..."
if docker exec postfolio-postgres pg_isready -U postgres > /dev/null 2>&1; then
    print_status "PostgreSQL is accepting connections"
else
    print_warning "PostgreSQL is not ready yet (this is normal on first run)"
fi

print_test "Testing Redis connection..."
if docker exec postfolio-redis redis-cli ping | grep -q "PONG"; then
    print_status "Redis is responding"
else
    print_warning "Redis is not ready yet"
fi

print_test "Testing RabbitMQ connection..."
if docker exec postfolio-rabbitmq rabbitmqctl status > /dev/null 2>&1; then
    print_status "RabbitMQ is running"
else
    print_warning "RabbitMQ is not ready yet"
fi

# Clean up test infrastructure
print_test "Cleaning up test infrastructure..."
docker-compose down

# Test 6: Build Test (Optional)
print_header "6. Docker Image Build Test (Optional)"
echo -e "${YELLOW}Do you want to test building Docker images? This will take several minutes. (y/n)${NC}"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    print_test "Building Eureka Server image..."
    if docker-compose build eureka-server > /dev/null 2>&1; then
        print_status "Eureka Server image built successfully"
    else
        print_error "Failed to build Eureka Server image"
    fi
    
    print_test "Building API Gateway image..."
    if docker-compose build api-gateway > /dev/null 2>&1; then
        print_status "API Gateway image built successfully"
    else
        print_error "Failed to build API Gateway image"
    fi
else
    print_status "Skipping build test"
fi

# Final Results
print_header "Test Results Summary"
print_status "Docker setup test completed!"

echo -e "\n${GREEN}Next steps:${NC}"
echo -e "1. Update .env with your actual API keys"
echo -e "2. Run: ${YELLOW}./deploy.sh${NC} to deploy all services"
echo -e "3. Run: ${YELLOW}./health-check.sh${NC} to verify deployment"
echo -e "4. Visit: ${BLUE}http://localhost:8761${NC} for Eureka Dashboard"

echo -e "\n${BLUE}Quick deployment command:${NC}"
echo -e "${YELLOW}./deploy.sh${NC}"