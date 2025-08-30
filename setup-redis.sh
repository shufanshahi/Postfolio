#!/bin/bash

# Redis Setup Script for Postfolio

echo "Setting up Redis for Postfolio..."

# Check if Redis is already installed
if redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis is already running!"
    exit 0
fi

# Check for Docker
if command -v docker >/dev/null 2>&1; then
    echo "🐳 Setting up Redis with Docker..."
    docker run -d --name redis-postfolio -p 6379:6379 redis:7-alpine
    sleep 3
    if redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis is now running via Docker!"
        exit 0
    fi
fi

# Install Redis natively on Ubuntu/Debian
if command -v apt >/dev/null 2>&1; then
    echo "📦 Installing Redis natively..."
    sudo apt update
    sudo apt install -y redis-server
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    
    if redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis is now running natively!"
        exit 0
    fi
fi

# Install Redis on macOS
if command -v brew >/dev/null 2>&1; then
    echo "🍺 Installing Redis with Homebrew..."
    brew install redis
    brew services start redis
    
    if redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis is now running via Homebrew!"
        exit 0
    fi
fi

echo "❌ Could not install Redis automatically."
echo "Please install Redis manually:"
echo ""
echo "For Ubuntu/Debian:"
echo "  sudo apt install redis-server"
echo ""
echo "For macOS:"
echo "  brew install redis"
echo ""
echo "For Docker:"
echo "  docker run -d --name redis-postfolio -p 6379:6379 redis:7-alpine"
echo ""
echo "Then verify with: redis-cli ping"
