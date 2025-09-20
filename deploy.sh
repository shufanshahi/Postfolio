#!/bin/bash

# Postfolio Backend Services - Build and Deploy Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Postfolio Backend Services Deployment${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker and Docker Compose are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Requirements check passed ✓"
}

# Create necessary directories
setup_directories() {
    print_status "Setting up directories..."
    mkdir -p logs
    print_status "Directories created ✓"
}

# Build all Docker images
build_images() {
    print_status "Building Docker images..."
    
    docker-compose build --no-cache
    
    if [ $? -eq 0 ]; then
        print_status "All images built successfully ✓"
    else
        print_error "Failed to build images"
        exit 1
    fi
}

# Deploy services
deploy_services() {
    print_status "Deploying services..."
    
    # Start infrastructure services first
    print_status "Starting infrastructure services (PostgreSQL, Redis, RabbitMQ)..."
    docker-compose up -d postgres redis rabbitmq
    
    # Wait for infrastructure services to be ready
    print_status "Waiting for infrastructure services to be ready..."
    sleep 30
    
    # Start Eureka server
    print_status "Starting Eureka server..."
    docker-compose up -d eureka-server
    
    # Wait for Eureka to be ready
    print_status "Waiting for Eureka server to be ready..."
    sleep 30
    
    # Start application services
    print_status "Starting application services..."
    docker-compose up -d postfolio-backend ai-service stripe-service
    
    # Wait for application services to be ready
    print_status "Waiting for application services to be ready..."
    sleep 30
    
    # Start API Gateway last
    print_status "Starting API Gateway..."
    docker-compose up -d api-gateway
    
    print_status "All services deployed successfully ✓"
}

# Show service status
show_status() {
    print_status "Service Status:"
    docker-compose ps
    
    echo ""
    print_status "Service URLs:"
    echo "  • Eureka Server: http://localhost:8761"
    echo "  • API Gateway: http://localhost:8080"
    echo "  • Main Backend: http://localhost:8082"
    echo "  • AI Service: http://localhost:8081"
    echo "  • Stripe Service: http://localhost:9991"
    echo "  • PostgreSQL: localhost:5432"
    echo "  • Redis: localhost:6379"
    echo "  • RabbitMQ Management: http://localhost:15672 (guest/guest)"
}

# Main deployment flow
main() {
    check_requirements
    setup_directories
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Please create it with your API keys."
        print_warning "You can use the provided .env as a template."
        exit 1
    fi
    
    build_images
    deploy_services
    
    echo ""
    print_status "Waiting for all services to fully start..."
    sleep 20
    
    show_status
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Deployment completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "To view logs: ${YELLOW}docker-compose logs -f [service-name]${NC}"
    echo -e "To stop all services: ${YELLOW}./stop-services.sh${NC}"
    echo -e "To restart a service: ${YELLOW}docker-compose restart [service-name]${NC}"
}

# Run main function
main "$@"