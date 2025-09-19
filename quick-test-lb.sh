#!/bin/bash

# Quick Load Balancing Test
# Set your JWT token here
TOKEN="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzaGFoaUBnbWFpbC5jb20iLCJpYXQiOjE3NTgyOTQ4MzUsImV4cCI6MTc1ODM4MTIzNX0.uQ49nEjI1DVN_nIV9unA-zNBidJX8IB1M8kfDIyTnJc"

# Check if token is set
if [ "$TOKEN" = "YOUR_JWT_TOKEN_HERE" ]; then
    echo "⚠️  Please set a valid JWT token in the TOKEN variable"
    echo "Edit this script and replace YOUR_JWT_TOKEN_HERE with your actual token"
    exit 1
fi

echo "🎯 Quick Load Balancing Test"
echo "==========================="
echo "Using token: ${TOKEN:0:20}..." # Show first 20 chars of token

echo "Testing Backend Service (10 requests):"
for i in {1..10}; do
    echo -n "Request $i: "
    response=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/health/instance")
    port=$(echo "$response" | grep -o '"port":"[^"]*"' | cut -d'"' -f4)
    hostname=$(echo "$response" | grep -o '"hostname":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$port" ]; then
        echo "Port: $port, Host: $hostname"
    else
        echo "No response"
    fi
done

echo ""
echo "Testing AI Service (10 requests):"
for i in {1..10}; do
    echo -n "Request $i: "
    response=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/ai/instance")
    port=$(echo "$response" | grep -o '"port":"[^"]*"' | cut -d'"' -f4)
    hostname=$(echo "$response" | grep -o '"hostname":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$port" ]; then
        echo "Port: $port, Host: $hostname"
    else
        echo "No response"
    fi
done
    fi
done