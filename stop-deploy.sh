#!/bin/bash

# Postfolio Backend Services - Stop Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Stopping Postfolio Backend Services${NC}"
echo -e "${BLUE}========================================${NC}"

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Stop all services
print_status "Stopping all services..."
docker-compose down

if [ "$1" == "--remove-volumes" ] || [ "$1" == "-v" ]; then
    print_warning "Removing volumes (this will delete all data)..."
    docker-compose down -v
    print_status "All services stopped and volumes removed ✓"
elif [ "$1" == "--remove-images" ] || [ "$1" == "-i" ]; then
    print_warning "Removing images..."
    docker-compose down --rmi all
    print_status "All services stopped and images removed ✓"
else
    print_status "All services stopped ✓"
fi

echo ""
print_status "All Postfolio services have been stopped."
echo ""
echo -e "Options:"
echo -e "  ${YELLOW}./stop-services.sh -v${NC}  Stop and remove volumes (deletes data)"
echo -e "  ${YELLOW}./stop-services.sh -i${NC}  Stop and remove images"
echo -e "  ${YELLOW}./deploy.sh${NC}            Start services again"