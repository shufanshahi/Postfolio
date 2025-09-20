#!/bin/bash

# Test Docker Service Credentials

echo "🔐 Testing Docker Service Credentials..."
echo "========================================"

# Test PostgreSQL
echo "1. Testing PostgreSQL (postgres/admin)..."
docker-compose exec postgres psql -U postgres -d postfolio -c "SELECT version();" 2>/dev/null && echo "✅ PostgreSQL: Connected successfully" || echo "❌ PostgreSQL: Connection failed"

# Test Redis (no auth)
echo "2. Testing Redis (no password)..."
docker-compose exec redis redis-cli ping 2>/dev/null && echo "✅ Redis: Connected successfully" || echo "❌ Redis: Connection failed"

# Test RabbitMQ Management
echo "3. Testing RabbitMQ Management UI..."
if curl -s -u guest:guest http://localhost:15672/api/overview > /dev/null; then
    echo "✅ RabbitMQ: Web UI accessible (guest/guest)"
else
    echo "❌ RabbitMQ: Web UI not accessible"
fi

# Check if local services are conflicting
echo ""
echo "🔍 Checking for port conflicts..."
echo "================================"
netstat -tulpn | grep ":5432\|:5672\|:15672\|:6379" | while read line; do
    echo "Port in use: $line"
done

echo ""
echo "📝 Docker Service URLs:"
echo "======================"
echo "PostgreSQL: localhost:5432 (postgres/admin)"
echo "RabbitMQ AMQP: localhost:5672 (guest/guest)"
echo "RabbitMQ Management: http://localhost:15672 (guest/guest)"
echo "Redis: localhost:6379 (no password)"