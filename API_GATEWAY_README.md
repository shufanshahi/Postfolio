# Postfolio API Gateway Setup

This document explains the API Gateway implementation using Spring Cloud Gateway and Eureka service discovery.

## Architecture Overview

```
Frontend (Next.js:3000)
    ↓ (HTTP Requests)
API Gateway (Spring Cloud Gateway:8080)
    ↓ (Service Discovery)
Eureka Server (8761)
    ↓ (Load Balancing)
├── Backend Service (8082)
└── AI Service (8081)
```

## Services Configuration

### 1. Eureka Server (Port 8761)
- **Purpose**: Service discovery and registration
- **Location**: `/eureka-server/`
- **URL**: http://localhost:8761

### 2. API Gateway (Port 8080)
- **Purpose**: Route requests, load balancing, CORS handling
- **Location**: `/api-gateway/`
- **URL**: http://localhost:8080

### 3. Backend Service (Port 8082)
- **Purpose**: Main application logic
- **Location**: `/server/`
- **Service Name**: `postfolio-backend`

### 4. AI Service (Port 8081)
- **Purpose**: AI-powered features
- **Location**: `/ai-service/`
- **Service Name**: `ai-service`

## Quick Start

### Option 1: Automated Startup (Recommended)
```bash
# Start all services
./start-services.sh

# Stop all services
./stop-services.sh
```

### Option 2: Manual Startup
```bash
# Terminal 1: Start Eureka Server
cd eureka-server && ./mvnw spring-boot:run

# Terminal 2: Start API Gateway (wait for Eureka to be ready)
cd api-gateway && ./mvnw spring-boot:run

# Terminal 3: Start Backend Service
cd server && ./mvnw spring-boot:run

# Terminal 4: Start AI Service
cd ai-service && ./mvnw spring-boot:run

# Terminal 5: Start Frontend
cd client && npm run dev
```

## API Routing

All API requests now go through the gateway at `http://localhost:8080`:

### Before (Direct Calls)
```
Frontend → http://localhost:8082/api/users     (Backend)
Frontend → http://localhost:8081/api/ai       (AI Service)
Backend  → http://localhost:8081/api/ai       (Inter-service)
```

### After (Through Gateway)
```
Frontend → http://localhost:8080/api/users     → Backend
Frontend → http://localhost:8080/api/ai        → AI Service
Backend  → http://localhost:8080/api/ai        → AI Service
```

## Gateway Routes

The API Gateway automatically routes requests based on the path:

- `/api/**` (except `/api/ai/**`) → `postfolio-backend`
- `/api/ai/**` → `ai-service`
- `/health` → Gateway health check

## Features Added

### 1. **Service Discovery**
- Services automatically register with Eureka
- Gateway discovers services dynamically
- No hardcoded service URLs

### 2. **Load Balancing**
- Automatic load balancing across service instances
- Uses `lb://service-name` for routing

### 3. **CORS Handling**
- Centralized CORS configuration
- Supports multiple frontend origins

### 4. **Request Logging**
- All requests logged through the gateway
- Includes request/response details

### 5. **Health Monitoring**
- Gateway health endpoint: `/actuator/health`
- Service discovery dashboard: http://localhost:8761

## Configuration Files

### Gateway Configuration (`api-gateway/src/main/resources/application.yml`)
```yaml
spring:
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
          lower-case-service-id: true
```

### Service Registration
Each service includes:
```properties
eureka.client.service-url.defaultZone=http://localhost:8761/eureka
eureka.instance.prefer-ip-address=true
```

## Monitoring and Debugging

### 1. Eureka Dashboard
- URL: http://localhost:8761
- Shows all registered services
- Service health status

### 2. Gateway Actuator
- Health: http://localhost:8080/actuator/health
- Gateway routes: http://localhost:8080/actuator/gateway/routes

### 3. Service Logs
- Located in `/logs/` directory
- Separate log file for each service

## Troubleshooting

### Common Issues

1. **Service not registering with Eureka**
   - Check if Eureka server is running
   - Verify `eureka.client.service-url.defaultZone` in service config

2. **Gateway routing not working**
   - Check service names in Eureka dashboard
   - Verify route configuration in gateway

3. **CORS errors**
   - Gateway handles CORS automatically
   - Check allowed origins in gateway config

### Port Conflicts
If you get port conflicts, update these files:
- Backend: `server/src/main/resources/application.properties` (server.port)
- Gateway: `api-gateway/src/main/resources/application.yml` (server.port)

## Benefits for Competition

1. **Enterprise Architecture**: Demonstrates microservices best practices
2. **Scalability**: Easy to add new services and scale existing ones
3. **Monitoring**: Built-in service discovery and health monitoring
4. **Centralized Management**: Single entry point for all API requests
5. **Fault Tolerance**: Service discovery handles service failures gracefully

## Next Steps (Optional Enhancements)

1. **Rate Limiting**: Add Redis-based rate limiting
2. **Circuit Breaker**: Implement fault tolerance patterns
3. **Authentication**: Centralize JWT validation at gateway
4. **Metrics**: Add Prometheus/Grafana monitoring
5. **API Documentation**: Generate OpenAPI docs at gateway level

## URLs Summary

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Eureka Dashboard**: http://localhost:8761
- **Backend (Direct)**: http://localhost:8082
- **AI Service (Direct)**: http://localhost:8081

**Note**: All API calls should go through the gateway (port 8080) for the best experience.