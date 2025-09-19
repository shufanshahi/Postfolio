#!/bin/bash

# Load Balancing Test Script for Postfolio
# This script tests if load balancing is working properly across service instances

echo "🚀 Postfolio Load Balancing Test Script"
echo "======================================="

# Configuration
GATEWAY_URL="http://localhost:8080"
NUM_REQUESTS=10

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to make requests and track responses
test_endpoint() {
    local endpoint="$1"
    local service_name="$2"
    local auth_required="$3"
    
    echo -e "\n${BLUE}Testing ${service_name} at ${endpoint}${NC}"
    echo "Making ${NUM_REQUESTS} requests..."
    
    declare -A port_counts
    declare -A hostname_counts
    local successful_requests=0
    local failed_requests=0
    
    for i in $(seq 1 $NUM_REQUESTS); do
        echo -n "Request $i: "
        
        if [ "$auth_required" = "true" ]; then
            # For endpoints requiring authentication, we'll get 401, but that's ok for load balancing test
            response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${GATEWAY_URL}${endpoint}" 2>/dev/null)
        else
            response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${GATEWAY_URL}${endpoint}" 2>/dev/null)
        fi
        
        http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
        json_response=$(echo "$response" | sed '/HTTP_STATUS:/d')
        
        if [ "$http_status" = "200" ]; then
            # Extract port and hostname from JSON response
            port=$(echo "$json_response" | grep -o '"port":"[^"]*"' | cut -d'"' -f4)
            hostname=$(echo "$json_response" | grep -o '"hostname":"[^"]*"' | cut -d'"' -f4)
            
            if [ -n "$port" ]; then
                port_counts["$port"]=$((${port_counts["$port"]} + 1))
                hostname_counts["$hostname"]=$((${hostname_counts["$hostname"]} + 1))
                echo -e "${GREEN}✓ Port: $port, Host: $hostname${NC}"
                successful_requests=$((successful_requests + 1))
            else
                echo -e "${YELLOW}⚠ Success but no instance info${NC}"
                successful_requests=$((successful_requests + 1))
            fi
        elif [ "$http_status" = "401" ] && [ "$auth_required" = "true" ]; then
            # For auth-required endpoints, 401 means the request reached the service
            echo -e "${YELLOW}⚠ 401 (Auth required - but load balancer worked)${NC}"
            successful_requests=$((successful_requests + 1))
        else
            echo -e "${RED}✗ HTTP $http_status${NC}"
            failed_requests=$((failed_requests + 1))
        fi
        
        sleep 0.1  # Small delay between requests
    done
    
    echo -e "\n${BLUE}Results for ${service_name}:${NC}"
    echo "Successful requests: $successful_requests"
    echo "Failed requests: $failed_requests"
    
    if [ ${#port_counts[@]} -gt 0 ]; then
        echo "Port distribution:"
        for port in "${!port_counts[@]}"; do
            echo "  Port $port: ${port_counts[$port]} requests"
        done
        
        echo "Hostname distribution:"
        for hostname in "${!hostname_counts[@]}"; do
            echo "  $hostname: ${hostname_counts[$hostname]} requests"
        done
        
        # Check if load balancing is working
        if [ ${#port_counts[@]} -gt 1 ]; then
            echo -e "${GREEN}✅ Load balancing is working! Requests distributed across ${#port_counts[@]} instances.${NC}"
        else
            echo -e "${YELLOW}⚠️  Only 1 instance responded. Check if multiple instances are running.${NC}"
        fi
    fi
}

# Function to check Eureka for registered instances
check_eureka_instances() {
    echo -e "\n${BLUE}Checking Eureka for registered instances...${NC}"
    
    eureka_response=$(curl -s "http://localhost:8761/eureka/apps" -H "Accept: application/json" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$eureka_response" ]; then
        echo "✅ Eureka server is accessible"
        
        # Check for POSTFOLIO-BACKEND instances
        backend_instances=$(echo "$eureka_response" | grep -o '"app":"POSTFOLIO-BACKEND"' | wc -l)
        echo "POSTFOLIO-BACKEND instances: $backend_instances"
        
        # Check for AI-SERVICE instances
        ai_instances=$(echo "$eureka_response" | grep -o '"app":"AI-SERVICE"' | wc -l)
        echo "AI-SERVICE instances: $ai_instances"
        
        if [ "$backend_instances" -gt 1 ]; then
            echo -e "${GREEN}✅ Multiple backend instances detected${NC}"
        else
            echo -e "${YELLOW}⚠️  Only $backend_instances backend instance found${NC}"
        fi
        
        if [ "$ai_instances" -gt 1 ]; then
            echo -e "${GREEN}✅ Multiple AI service instances detected${NC}"
        else
            echo -e "${YELLOW}⚠️  Only $ai_instances AI service instance found${NC}"
        fi
    else
        echo -e "${RED}❌ Could not connect to Eureka server${NC}"
    fi
}

# Function to test gateway routes
test_gateway_routes() {
    echo -e "\n${BLUE}Testing Gateway Route Configuration...${NC}"
    
    # Test if gateway is accessible
    gateway_health=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/actuator/health" 2>/dev/null)
    if [ "$gateway_health" = "200" ]; then
        echo -e "${GREEN}✅ API Gateway is accessible${NC}"
    else
        echo -e "${RED}❌ API Gateway is not accessible (HTTP: $gateway_health)${NC}"
        echo "Make sure the gateway is running on port 8080"
        return 1
    fi
    
    # Test gateway routes endpoint
    routes_response=$(curl -s "http://localhost:8080/actuator/gateway/routes" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "✅ Gateway routes endpoint accessible"
        echo "Active routes:"
        echo "$routes_response" | grep -o '"route_id":"[^"]*"' | cut -d'"' -f4 | sed 's/^/  - /'
    else
        echo -e "${YELLOW}⚠️  Could not access gateway routes endpoint${NC}"
    fi
}

# Main execution
main() {
    echo "Starting load balancing tests..."
    
    # Check prerequisites
    echo -e "\n${BLUE}Checking Prerequisites...${NC}"
    check_eureka_instances
    test_gateway_routes
    
    # Test backend service load balancing
    test_endpoint "/api/health/instance" "Backend Service" false
    
    # Test AI service load balancing
    test_endpoint "/api/ai/instance" "AI Service" false
    
    # Test load test endpoints
    echo -e "\n${BLUE}Running Load Test Endpoints...${NC}"
    test_endpoint "/api/health/load-test" "Backend Load Test" false
    test_endpoint "/api/ai/load-test" "AI Service Load Test" false
    
    # Summary
    echo -e "\n${BLUE}Test Summary${NC}"
    echo "============"
    echo "If you see requests distributed across different ports/hostnames,"
    echo "then load balancing is working correctly!"
    echo ""
    echo "Expected behavior:"
    echo "- Multiple different ports (8082, 8083, etc.)"
    echo "- Roughly equal distribution of requests"
    echo "- All requests successful (HTTP 200)"
    echo ""
    echo -e "${GREEN}Test completed!${NC}"
}

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is not installed. Please install curl to run this test.${NC}"
    exit 1
fi

# Run the main function
main