#!/bin/bash

# Postfolio Backend Services - Development Mode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Postfolio Development Mode${NC}"
echo -e "${BLUE}========================================${NC}"

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Start only infrastructure services for local development
print_status "Starting infrastructure services for local development..."
print_status "This will start PostgreSQL, Redis, and RabbitMQ only."
print_status "You can run your Spring Boot applications locally in your IDE."

docker-compose up -d postgres redis rabbitmq

echo ""
print_status "Infrastructure services started ✓"
echo ""
print_status "Connection details for local development:"
echo "  • PostgreSQL: localhost:5432 (postfolio/postgres/admin)"
echo "  • Redis: localhost:6379"
echo "  • RabbitMQ: localhost:5672 (guest/guest)"
echo "  • RabbitMQ Management: http://localhost:15672"
echo ""
print_status "You can now run your Spring Boot applications locally."
print_status "Use 'docker-compose logs -f [postgres|redis|rabbitmq]' to view logs."
print_status "Use './stop-services.sh' to stop all services."